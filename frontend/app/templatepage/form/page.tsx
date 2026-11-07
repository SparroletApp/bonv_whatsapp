
import { useMemo, useState } from "react";



import "./template-form.css";
import templateService, { TemplateButton, TemplateResponse } from "@/app/apiservice/templateservice";
import { apiError } from "@/app/utils/apiError";
import TemplatePreview from "@/app/component/TemplatePreview";

const LANGUAGES = [
    { code: "en_US", label: "English (US)" },
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "ml", label: "Malayalam" },
    { code: "ta", label: "Tamil" },
];

export default function TemplateForm({
    onCreated,
}: {
    onCreated: (t: TemplateResponse) => void;
}) {
    const [name, setName] = useState("");
    const [language, setLanguage] = useState("en_US");
    const [category, setCategory] = useState<"MARKETING" | "UTILITY">("MARKETING");
    const [headerText, setHeaderText] = useState("");
    const [body, setBody] = useState("");
    const [footerText, setFooterText] = useState("");
    const [examples, setExamples] = useState<string[]>([]);
    const [buttons, setButtons] = useState<TemplateButton[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const varCount = useMemo(() => {
        const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
        return nums.length ? Math.max(...nums) : 0;
    }, [body]);

    const setExample = (i: number, v: string) => {
        const next = [...examples];
        next[i] = v;
        setExamples(next);
    };

    const addVariable = () => {
        setBody((b) => `${b}{{${varCount + 1}}}`);
    };

    const addButton = () => {
        if (buttons.length >= 3) return;
        setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
    };

    const updateButton = (i: number, patch: Partial<TemplateButton>) =>
        setButtons(buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

    const submit = async () => {
        setError("");

        const cleanName = name.trim();
        const cleanBody = body.trim();

        if (!/^[a-z0-9_]+$/.test(cleanName)) {
            return setError("Name: lowercase letters, numbers, and underscores only");
        }

        if (!cleanBody) {
            return setError("Body is required");
        }

        const matches = [...cleanBody.matchAll(/\{\{(\d+)\}\}/g)];
        const variableNumbers = matches.map((m) => Number(m[1]));

        const uniqueNumbers = [...new Set(variableNumbers)].sort((a, b) => a - b);

        for (let i = 0; i < uniqueNumbers.length; i++) {
            if (uniqueNumbers[i] !== i + 1) {
                return setError("Variables must be sequential: {{1}}, {{2}}, {{3}}...");
            }
        }

        const count = uniqueNumbers.length;

        if (/^\s*\{\{\d+\}\}/.test(cleanBody)) {
            return setError("Body cannot start with a variable");
        }

        if (/\{\{\d+\}\}\s*$/.test(cleanBody)) {
            return setError("Body cannot end with a variable");
        }

        if (
            count > 0 &&
            Array.from({ length: count }).some((_, i) => !examples[i]?.trim())
        ) {
            return setError("Provide an example value for every variable");
        }

        for (const button of buttons) {
            if (!button.text.trim()) {
                return setError("Every button must have button text");
            }

            if (button.type === "URL") {
                if (!button.url?.trim()) {
                    return setError("URL button requires a URL");
                }

                try {
                    const url = new URL(button.url);
                    if (!["http:", "https:"].includes(url.protocol)) {
                        return setError("URL must start with http:// or https://");
                    }
                } catch {
                    return setError("Please enter a valid button URL");
                }
            }

            if (button.type === "PHONE_NUMBER" && !button.phoneNumber?.trim()) {
                return setError("Phone button requires a phone number");
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
                bodyExamples: examples.slice(0, count),
                buttons: buttons.filter((b) => b.text.trim()),
            });

            onCreated(created);
        } catch (e) {
            setError(apiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tf-wrapper">
            <div className="tf-heading">
                <div>
                    <span className="tf-eyebrow">WHATSAPP BUSINESS</span>
                    <h2>Create Message Template</h2>
                    <p>Design and submit message templates for WhatsApp approval.</p>
                </div>

                <div className="tf-heading-icon">
                    <i className="bi bi-chat-square-text"></i>
                </div>
            </div>

            <div className="tf-layout">
                <div className="tf-form-card">
                    <div className="tf-card-heading">
                        <div>
                            <span className="tf-step">STEP 01</span>
                            <h3>Template details</h3>
                            <p>Set up the basic information for your template.</p>
                        </div>
                        <i className="bi bi-sliders2 tf-section-icon"></i>
                    </div>

                    {error && (
                        <div className="tf-error">
                            <i className="bi bi-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <div className="tf-field">
                        <label>Template name <span>*</span></label>
                        <input
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value.toLowerCase().replace(/\s/g, "_"))
                            }
                            placeholder="diwali_offer_2026"
                        />
                        <small>Use lowercase letters, numbers and underscores.</small>
                    </div>

                    <div className="tf-field-row">
                        <div className="tf-field">
                            <label>Language</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                                {LANGUAGES.map((l) => (
                                    <option key={l.code} value={l.code}>{l.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="tf-field">
                            <label>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as "MARKETING" | "UTILITY")}
                            >
                                <option value="MARKETING">Marketing</option>
                                <option value="UTILITY">Utility</option>
                            </select>
                        </div>
                    </div>

                    <div className="tf-divider" />

                    <div className="tf-card-heading">
                        <div>
                            <span className="tf-step">STEP 02</span>
                            <h3>Message content</h3>
                            <p>Customize your message header, body and footer.</p>
                        </div>
                        <i className="bi bi-pencil-square tf-section-icon"></i>
                    </div>

                    <div className="tf-field">
                        <label>Header <span className="tf-optional">OPTIONAL</span></label>
                        <input
                            value={headerText}
                            maxLength={60}
                            onChange={(e) => setHeaderText(e.target.value)}
                            placeholder="e.g. Special festive offer"
                        />
                        <div className="tf-character-count">{headerText.length}/60</div>
                    </div>

                    <div className="tf-field">
                        <div className="tf-label-row">
                            <label>Message body <span>*</span></label>
                            <button type="button" className="tf-variable-btn" onClick={addVariable}>
                                <i className="bi bi-braces"></i> Add variable
                            </button>
                        </div>

                        <textarea
                            rows={5}
                            value={body}
                            maxLength={1024}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Hi {{1}}, our festive offer starts today!"
                        />

                        <div className="tf-textarea-footer">
                            <span>Use variables like {"{{1}}"} to personalize messages.</span>
                            <span>{body.length}/1024</span>
                        </div>
                    </div>

                    {varCount > 0 && (
                        <div className="tf-variables">
                            <div className="tf-variable-heading">
                                <div>
                                    <h4><i className="bi bi-braces"></i> Variable examples</h4>
                                    <p>Provide sample values for your message variables.</p>
                                </div>
                                <span className="tf-count">{varCount} variables</span>
                            </div>

                            {Array.from({ length: varCount }).map((_, i) => (
                                <div className="tf-field" key={i}>
                                    <label>Example for {"{{"}{i + 1}{"}}"}</label>
                                    <input
                                        placeholder={`Enter example for variable ${i + 1}`}
                                        value={examples[i] || ""}
                                        onChange={(e) => setExample(i, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="tf-field">
                        <label>Footer <span className="tf-optional">OPTIONAL</span></label>
                        <input
                            value={footerText}
                            maxLength={60}
                            onChange={(e) => setFooterText(e.target.value)}
                            placeholder="e.g. Thank you for choosing us!"
                        />
                        <div className="tf-character-count">{footerText.length}/60</div>
                    </div>

                    <div className="tf-divider" />

                    <div className="tf-card-heading">
                        <div>
                            <span className="tf-step">STEP 03</span>
                            <h3>Interactive buttons</h3>
                            <p>Add actions that customers can interact with.</p>
                        </div>
                        <i className="bi bi-hand-index-thumb tf-section-icon"></i>
                    </div>

                    <div className="tf-button-info">
                        <i className="bi bi-info-circle"></i>
                        You can add up to 3 buttons to your template.
                    </div>

                    {buttons.map((b, i) => (
                        <div className="tf-button-card" key={i}>
                            <div className="tf-button-card-header">
                                <span>BUTTON {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}
                                    aria-label="Remove button"
                                >
                                    <i className="bi bi-trash3"></i>
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
                                        <option value="QUICK_REPLY">Quick reply</option>
                                        <option value="URL">Website URL</option>
                                        <option value="PHONE_NUMBER">Phone number</option>
                                    </select>
                                </div>

                                <div className="tf-field">
                                    <label>Button text</label>
                                    <input
                                        placeholder="e.g. Shop now"
                                        value={b.text}
                                        maxLength={25}
                                        onChange={(e) => updateButton(i, { text: e.target.value })}
                                    />
                                </div>
                            </div>

                            {b.type === "URL" && (
                                <div className="tf-field">
                                    <label>Website URL</label>
                                    <input
                                        placeholder="https://example.com"
                                        value={b.url || ""}
                                        onChange={(e) => updateButton(i, { url: e.target.value })}
                                    />
                                </div>
                            )}

                            {b.type === "PHONE_NUMBER" && (
                                <div className="tf-field">
                                    <label>Phone number</label>
                                    <input
                                        placeholder="+919876543210"
                                        value={b.phoneNumber || ""}
                                        onChange={(e) => updateButton(i, { phoneNumber: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {buttons.length < 3 && (
                        <button type="button" className="tf-add-button" onClick={addButton}>
                            <i className="bi bi-plus-circle"></i>
                            Add another button
                        </button>
                    )}

                    <div className="tf-submit-area">
                        <div>
                            <span className="tf-submit-title">Ready to submit?</span>
                            <span className="tf-submit-description">Your template will be sent to Meta for review.</span>
                        </div>

                        <button className="tf-submit-btn" disabled={saving} onClick={submit}>
                            {saving ? (
                                <><span className="tf-spinner"></span> Submitting...</>
                            ) : (
                                <>Submit for approval <i className="bi bi-arrow-right"></i></>
                            )}
                        </button>
                    </div>
                </div>

                <div className="tf-preview-column">
                    <div className="tf-preview-sticky">
                        <div className="tf-preview-heading">
                            <div>
                                <span className="tf-step">LIVE PREVIEW</span>
                                <h3>Message preview</h3>
                                <p>See how your WhatsApp message looks.</p>
                            </div>
                            <i className="bi bi-eye"></i>
                        </div>

                        <div className="tf-preview-card">
                            <TemplatePreview
                                headerText={headerText}
                                body={body || "Your message…"}
                                footerText={footerText}
                                values={examples}
                                buttonsJson={JSON.stringify(buttons.filter((b) => b.text))}
                            />
                        </div>

                        <div className="tf-review-info">
                            <div className="tf-review-icon">
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <div>
                                <h4>Meta approval process</h4>
                                <p>
                                    Every template is reviewed by Meta. Approval usually takes
                                    a few minutes, but may take up to 24 hours.
                                </p>
                            </div>
                        </div>

                        <div className="tf-preview-tip">
                            <i className="bi bi-lightbulb"></i>
                            <div>
                                <strong>Quick tip</strong>
                                <p>Keep your message clear, relevant and personalized for better customer engagement.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
