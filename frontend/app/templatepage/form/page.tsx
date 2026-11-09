
"use client";

import { useMemo, useState } from "react";

import "./template-form.css";
import templateService, {
    TemplateButton,
    TemplateResponse,
} from "@/app/apiservice/templateservice";
import { apiError } from "@/app/utils/apiError";
import TemplatePreview from "@/app/component/TemplatePreview";

const LANGUAGES = [
    { code: "en_US", label: "English (US)" },
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "ml", label: "Malayalam" },
    { code: "ta", label: "Tamil" },
];

const NAME_VARIABLE = "{{1}}";
const NAME_EXAMPLE = "Rahul";

export default function TemplateForm({
    onCreated,
}: {
    onCreated: (t: TemplateResponse) => void;
}) {
    const [name, setName] = useState("");
    const [language, setLanguage] = useState("en_US");
    const [category, setCategory] = useState<"MARKETING" | "UTILITY">(
        "MARKETING"
    );

    const [headerText, setHeaderText] = useState("");
    const [body, setBody] = useState("");
    const [footerText, setFooterText] = useState("");

    const [nameExample, setNameExample] = useState(NAME_EXAMPLE);

    const [buttons, setButtons] = useState<TemplateButton[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");


    const hasNameVariable = body.includes(NAME_VARIABLE);

    const varCount = useMemo(
        () => (hasNameVariable ? 1 : 0),
        [hasNameVariable]
    );

    const addNameVariable = () => {
        if (hasNameVariable) return;

        setBody((current) => {
            const separator =
                current.length > 0 && !/\s$/.test(current) ? " " : "";

            return `${current}${separator}${NAME_VARIABLE}`;
        });

        setNameExample(NAME_EXAMPLE);
        setError("");
    };

    const addButton = () => {
        if (buttons.length >= 3) return;

        setButtons((current) => [
            ...current,
            { type: "QUICK_REPLY", text: "" },
        ]);
    };

    const updateButton = (
        index: number,
        patch: Partial<TemplateButton>
    ) => {
        setButtons((current) =>
            current.map((button, i) =>
                i === index ? { ...button, ...patch } : button
            )
        );
    };

    const removeButton = (index: number) => {
        setButtons((current) =>
            current.filter((_, i) => i !== index)
        );
    };

    const submit = async () => {
        setError("");

        const cleanName = name.trim();
        const cleanBody = body.trim();

        if (!/^[a-z0-9_]+$/.test(cleanName)) {
            setError(
                "Template name must contain lowercase letters, numbers and underscores only."
            );
            return;
        }

        if (!cleanBody) {
            setError("Message body is required.");
            return;
        }

        const variableMatches = [
            ...cleanBody.matchAll(/\{\{(\d+)\}\}/g),
        ];

        const invalidVariable = variableMatches.some(
            (match) => Number(match[1]) !== 1
        );

        if (invalidVariable) {
            setError(
                "Only the Name variable is supported. Please use the Add Name button."
            );
            return;
        }


        if (/^\s*\{\{1\}\}/.test(cleanBody)) {
            setError("Message body cannot start with a variable.");
            return;
        }

        if (/\{\{1\}\}\s*$/.test(cleanBody)) {
            setError("Message body cannot end with a variable.");
            return;
        }

        if (hasNameVariable && !nameExample.trim()) {
            setError("Please provide an example name.");
            return;
        }


        for (const button of buttons) {
            if (!button.text.trim()) {
                setError("Every button must have button text.");
                return;
            }

            if (button.type === "URL") {
                if (!button.url?.trim()) {
                    setError("URL button requires a URL.");
                    return;
                }

                try {
                    const url = new URL(button.url);

                    if (!["http:", "https:"].includes(url.protocol)) {
                        setError(
                            "URL must start with http:// or https://."
                        );
                        return;
                    }
                } catch {
                    setError("Please enter a valid button URL.");
                    return;
                }
            }

            if (
                button.type === "PHONE_NUMBER" &&
                !button.phoneNumber?.trim()
            ) {
                setError("Phone button requires a phone number.");
                return;
            }
        }

        setSaving(true);

        try {
            const created = await templateService.create({
                name: cleanName,
                language,
                category,
                headerText: headerText.trim() || undefined,
                body: cleanBody,
                footerText: footerText.trim() || undefined,

                bodyExamples: hasNameVariable
                    ? [nameExample.trim()]
                    : [],

                buttons: buttons.filter((button) =>
                    button.text.trim()
                ),
            });

            onCreated(created);
        } catch (e) {
            setError(apiError(e));
        } finally {
            setSaving(false);
        }
    };

    const previewValues = hasNameVariable
        ? [nameExample.trim() || NAME_EXAMPLE]
        : [];

    return (
        <div className="tf-wrapper">

            {/* HEADING */}
            <div className="tf-heading">
                <div>
                    <span className="tf-eyebrow">
                        WHATSAPP BUSINESS
                    </span>

                    <h2>Create Message Template</h2>

                    <p>
                        Design and submit personalized WhatsApp
                        message templates for approval.
                    </p>
                </div>

                <div className="tf-heading-icon">
                    <i className="bi bi-chat-square-text" />
                </div>
            </div>

            <div className="tf-layout">

                {/* FORM */}
                <div className="tf-form-card">

                    {/* STEP 01 */}
                    <div className="tf-card-heading">
                        <div>
                            <span className="tf-step">STEP 01</span>
                            <h3>Template details</h3>
                            <p>
                                Set up the basic information for
                                your template.
                            </p>
                        </div>

                        <i className="bi bi-sliders2 tf-section-icon" />
                    </div>

                    {error && (
                        <div className="tf-error">
                            <i className="bi bi-exclamation-circle-fill" />
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                aria-label="Close error"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    )}

                    <div className="tf-field">
                        <label>
                            Template name <span>*</span>
                        </label>

                        <input
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/\s/g, "_")
                                )
                            }
                            placeholder="diwali_offer_2026"
                            maxLength={512}
                        />

                        <small>
                            Use lowercase letters, numbers and underscores.
                        </small>
                    </div>

                    <div className="tf-field-row">
                        <div className="tf-field">
                            <label>Language</label>

                            <select
                                value={language}
                                onChange={(e) =>
                                    setLanguage(e.target.value)
                                }
                            >
                                {LANGUAGES.map((l) => (
                                    <option
                                        key={l.code}
                                        value={l.code}
                                    >
                                        {l.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="tf-field">
                            <label>Category</label>

                            <select
                                value={category}
                                onChange={(e) =>
                                    setCategory(
                                        e.target.value as
                                            | "MARKETING"
                                            | "UTILITY"
                                    )
                                }
                            >
                                <option value="MARKETING">
                                    Marketing
                                </option>

                                <option value="UTILITY">
                                    Utility
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="tf-divider" />

                    {/* STEP 02 */}
                    <div className="tf-card-heading">
                        <div>
                            <span className="tf-step">STEP 02</span>
                            <h3>Message content</h3>
                            <p>
                                Customize your message header, body
                                and footer.
                            </p>
                        </div>

                        <i className="bi bi-pencil-square tf-section-icon" />
                    </div>

                    {/* HEADER */}
                    <div className="tf-field">
                        <label>
                            Header
                            <span className="tf-optional">
                                OPTIONAL
                            </span>
                        </label>

                        <input
                            value={headerText}
                            maxLength={60}
                            onChange={(e) =>
                                setHeaderText(e.target.value)
                            }
                            placeholder="e.g. Special festive offer"
                        />

                        <div className="tf-character-count">
                            {headerText.length}/60
                        </div>
                    </div>

                    {/* BODY */}
                    <div className="tf-field">
                        <div className="tf-label-row">
                            <label>
                                Message body <span>*</span>
                            </label>

                            <button
                                type="button"
                                className="tf-variable-btn"
                                onClick={addNameVariable}
                                disabled={hasNameVariable}
                            >
                                <i className="bi bi-person-plus-fill" />

                                {hasNameVariable
                                    ? "Name added"
                                    : "Add Name"}
                            </button>
                        </div>

                        <textarea
                            rows={5}
                            value={body}
                            maxLength={1024}
                            onChange={(e) =>
                                setBody(e.target.value)
                            }
                            placeholder="Hello, welcome to our service! Click Add Name to personalize your message."
                        />

                        <div className="tf-textarea-footer">
                            <span>
                                <i className="bi bi-info-circle" />
                                Insert the contact's name using Add Name.
                            </span>

                            <span>{body.length}/1024</span>
                        </div>
                    </div>

                    {/* NAME VARIABLE */}
                    {hasNameVariable && (
                        <div className="tf-variables">

                            <div className="tf-variable-heading">
                                <div>
                                    <h4>
                                        <i className="bi bi-person-circle" />
                                        Personalization variable
                                    </h4>

                                    <p>
                                        This variable automatically
                                        uses each contact's name.
                                    </p>
                                </div>

                                <span className="tf-count">
                                    1 variable
                                </span>
                            </div>

                            <div className="tf-name-variable-card">
                                <div className="tf-name-variable-icon">
                                    <i className="bi bi-person-fill" />
                                </div>

                                <div className="tf-name-variable-info">
                                    <strong>Name</strong>
                                    <span>
                                        WhatsApp placeholder: {"{{1}}"}
                                    </span>
                                </div>

                                <span className="tf-variable-status">
                                    <i className="bi bi-check-circle-fill" />
                                    Added
                                </span>
                            </div>

                            <div className="tf-field tf-example-field">
                                <label>
                                    Example contact name
                                    <span>*</span>
                                </label>

                                <input
                                    value={nameExample}
                                    onChange={(e) =>
                                        setNameExample(e.target.value)
                                    }
                                    placeholder="Rahul"
                                />

                                <small>
                                    Meta uses this sample value to review
                                    your personalized message.
                                </small>
                            </div>
                        </div>
                    )}

                    {/* FOOTER */}
                    <div className="tf-field">
                        <label>
                            Footer
                            <span className="tf-optional">
                                OPTIONAL
                            </span>
                        </label>

                        <input
                            value={footerText}
                            maxLength={60}
                            onChange={(e) =>
                                setFooterText(e.target.value)
                            }
                            placeholder="e.g. Thank you for choosing us!"
                        />

                        <div className="tf-character-count">
                            {footerText.length}/60
                        </div>
                    </div>

                    <div className="tf-divider" />

                    {/* STEP 03 */}
                    <div className="tf-card-heading">
                        <div>
                            <span className="tf-step">STEP 03</span>
                            <h3>Interactive buttons</h3>
                            <p>
                                Add actions that customers can interact with.
                            </p>
                        </div>

                        <i className="bi bi-hand-index-thumb tf-section-icon" />
                    </div>

                    <div className="tf-button-info">
                        <i className="bi bi-info-circle-fill" />
                        You can add up to 3 buttons to your template.
                    </div>

                    {buttons.map((b, i) => (
                        <div className="tf-button-card" key={i}>

                            <div className="tf-button-card-header">
                                <span>BUTTON {i + 1}</span>

                                <button
                                    type="button"
                                    onClick={() => removeButton(i)}
                                    aria-label="Remove button"
                                >
                                    <i className="bi bi-trash3" />
                                </button>
                            </div>

                            <div className="tf-field-row">
                                <div className="tf-field">
                                    <label>Button type</label>

                                    <select
                                        value={b.type}
                                        onChange={(e) =>
                                            updateButton(i, {
                                                type: e.target.value as TemplateButton["type"],
                                                url: undefined,
                                                phoneNumber: undefined,
                                            })
                                        }
                                    >
                                        <option value="QUICK_REPLY">
                                            Quick reply
                                        </option>

                                        <option value="URL">
                                            Website URL
                                        </option>

                                        <option value="PHONE_NUMBER">
                                            Phone number
                                        </option>
                                    </select>
                                </div>

                                <div className="tf-field">
                                    <label>Button text</label>

                                    <input
                                        placeholder="e.g. Shop now"
                                        value={b.text}
                                        maxLength={25}
                                        onChange={(e) =>
                                            updateButton(i, {
                                                text: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {b.type === "URL" && (
                                <div className="tf-field">
                                    <label>Website URL</label>

                                    <input
                                        placeholder="https://example.com"
                                        value={b.url || ""}
                                        onChange={(e) =>
                                            updateButton(i, {
                                                url: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            {b.type === "PHONE_NUMBER" && (
                                <div className="tf-field">
                                    <label>Phone number</label>

                                    <input
                                        placeholder="+919876543210"
                                        value={b.phoneNumber || ""}
                                        onChange={(e) =>
                                            updateButton(i, {
                                                phoneNumber: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {buttons.length < 3 && (
                        <button
                            type="button"
                            className="tf-add-button"
                            onClick={addButton}
                        >
                            <i className="bi bi-plus-circle" />
                            Add another button
                        </button>
                    )}

                    {/* SUBMIT */}
                    <div className="tf-submit-area">
                        <div>
                            <span className="tf-submit-title">
                                Ready to submit?
                            </span>

                            <span className="tf-submit-description">
                                Your template will be sent to Meta for review.
                            </span>
                        </div>

                        <button
                            type="button"
                            className="tf-submit-btn"
                            disabled={saving}
                            onClick={submit}
                        >
                            {saving ? (
                                <>
                                    <span className="tf-spinner" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit for approval
                                    <i className="bi bi-arrow-right" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* PREVIEW */}
                <div className="tf-preview-column">
                    <div className="tf-preview-sticky">

                        <div className="tf-preview-heading">
                            <div>
                                <span className="tf-step">
                                    LIVE PREVIEW
                                </span>

                                <h3>Message preview</h3>

                                <p>
                                    See how your WhatsApp message looks.
                                </p>
                            </div>

                            <i className="bi bi-eye" />
                        </div>

                        <div className="tf-preview-card">
                            <TemplatePreview
                                headerText={headerText}
                                body={body || "Your message…"}
                                footerText={footerText}
                                values={previewValues}
                                buttonsJson={JSON.stringify(
                                    buttons.filter((b) => b.text.trim())
                                )}
                            />
                        </div>

                        <div className="tf-review-info">
                            <div className="tf-review-icon">
                                <i className="bi bi-shield-check" />
                            </div>

                            <div>
                                <h4>Meta approval process</h4>

                                <p>
                                    Every template is reviewed by Meta.
                                    Approval usually takes a few minutes,
                                    but may take up to 24 hours.
                                </p>
                            </div>
                        </div>

                        <div className="tf-preview-tip">
                            <i className="bi bi-lightbulb" />

                            <div>
                                <strong>Quick tip</strong>

                                <p>
                                    Use the Name variable to automatically
                                    personalize your WhatsApp message
                                    for every recipient.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
