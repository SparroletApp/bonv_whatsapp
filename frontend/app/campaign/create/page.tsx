"use client";

import campaignService from "@/app/apiservice/campaignservice";
import categoryInsightService, {
    CategorySummary,
} from "@/app/apiservice/categoryinsightservice";
import templateService, {
    TemplateResponse,
} from "@/app/apiservice/templateservice";

import Modal from "@/app/component/Modal";
import TemplatePreview from "@/app/component/TemplatePreview";
import TemplateForm from "@/app/templatepage/form/page";
import { apiError } from "@/app/utils/apiError";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import "./create-campaign.css";


const CAMPAIGNS_PAGE = "/campaign";

type Kind = "NAME" | "PHONE" | "EMAIL" | "TEXT";

interface VarMap {
    kind: Kind;
    text: string;
}

const SAMPLE: Record<Exclude<Kind, "TEXT">, string> = {
    NAME: "Rahul",
    PHONE: "919876543210",
    EMAIL: "rahul@example.com",
};

const MEDIA_HEADERS = ["IMAGE", "VIDEO", "DOCUMENT"];

const MEDIA_RULES: Record<
    string,
    { accept: string; mimes: string[]; maxMb: number; label: string }
> = {
    IMAGE: {
        accept: "image/jpeg,image/png",
        mimes: ["image/jpeg", "image/png"],
        maxMb: 5,
        label: "JPEG or PNG image",
    },
    VIDEO: {
        accept: "video/mp4",
        mimes: ["video/mp4"],
        maxMb: 16,
        label: "MP4 video",
    },
    DOCUMENT: {
        accept: "application/pdf",
        mimes: ["application/pdf"],
        maxMb: 100,
        label: "PDF document",
    },
};

export default function CampaignCreatePage() {
    const nav = useRouter();

    const [name, setName] = useState("");
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [templates, setTemplates] = useState<TemplateResponse[]>([]);
    const [templateId, setTemplateId] = useState<number | "">("");
    const [mapping, setMapping] = useState<VarMap[]>([]);
    // Holds the uploaded WhatsApp media ID (sent to the backend as headerMediaUrl)
    const [headerMediaUrl, setHeaderMediaUrl] = useState("");
    const [mediaName, setMediaName] = useState("");
    const [mediaPreview, setMediaPreview] = useState("");
    const [uploading, setUploading] = useState(false);

    const clearMedia = () => {
        setHeaderMediaUrl("");
        setMediaName("");
        setMediaPreview((old) => {
            if (old) URL.revokeObjectURL(old);
            return "";
        });
    };

    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const approvedTemplates = useMemo(
        () => templates.filter((t) => t.status?.toUpperCase() === "APPROVED"),
        [templates]
    );

    const template = approvedTemplates.find((t) => t.id === templateId);

    const headerType = template?.headerType?.toUpperCase() ?? "";
    const needsMedia = MEDIA_HEADERS.includes(headerType);
    const mediaRule = MEDIA_RULES[headerType];

    const handleMediaPick = async (file: File | undefined) => {
        if (!file || !mediaRule) return;

        setError("");

        if (!mediaRule.mimes.includes(file.type)) {
            setError(`Please select a valid ${mediaRule.label}.`);
            return;
        }

        if (file.size > mediaRule.maxMb * 1024 * 1024) {
            setError(`File is too large. Maximum size is ${mediaRule.maxMb} MB.`);
            return;
        }

        setUploading(true);

        try {
            const res: any = await campaignService.uploadMedia(file);
            const mediaId: string | undefined =
                res?.data?.mediaId ?? res?.mediaId;

            if (!mediaId) {
                throw new Error("Upload did not return a media ID");
            }

            clearMedia();
            setHeaderMediaUrl(mediaId);
            setMediaName(file.name);

            if (file.type.startsWith("image/")) {
                setMediaPreview(URL.createObjectURL(file));
            }
        } catch (e) {
            clearMedia();
            setError("Media upload failed: " + apiError(e));
        } finally {
            setUploading(false);
        }
    };

    const loadTemplates = async () => {
        const data = await templateService.list();
        setTemplates(data);
    };

    const refreshFromMeta = async (silent = false) => {
        setSyncing(true);

        try {
            await templateService.sync();
            await loadTemplates();

            if (!silent) {
                setInfo("Templates successfully refreshed from Meta.");
                setError("");
            }
        } catch (e) {
            await loadTemplates().catch(() => { });

            if (!silent) {
                setError("Could not refresh templates: " + apiError(e));
            }
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        categoryInsightService
            .list()
            .then(setCategories)
            .catch((e) => setError(apiError(e)));

        refreshFromMeta(true);
    }, []);

    useEffect(() => {
        if (
            templateId !== "" &&
            !approvedTemplates.some((t) => t.id === templateId)
        ) {
            setTemplateId("");
            setMapping([]);
            clearMedia();
        }
    }, [approvedTemplates, templateId]);

    const totalContacts = useMemo(() => {
        return categories
            .filter((c) => selected.includes(c.id))
            .reduce((sum, c) => sum + c.contactCount, 0);
    }, [categories, selected]);

    const toggleCategory = (id: number) => {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id]
        );
    };

    const selectAllCategories = () => {
        setSelected((current) =>
            current.length === categories.length
                ? []
                : categories.map((c) => c.id)
        );
    };

    const pickTemplate = (id: number | "") => {
        setTemplateId(id);
        clearMedia();

        const selectedTemplate = approvedTemplates.find((t) => t.id === id);

        setMapping(
            Array.from(
                { length: selectedTemplate?.variableCount ?? 0 },
                (_, i) => ({
                    kind: i === 0 ? "NAME" : "TEXT",
                    text: "",
                })
            )
        );
    };

    const updateMap = (index: number, patch: Partial<VarMap>) => {
        setMapping((current) =>
            current.map((item, i) =>
                i === index ? { ...item, ...patch } : item
            )
        );
    };

    const previewValues = mapping.map((item) =>
        item.kind === "TEXT" ? item.text : SAMPLE[item.kind]
    );

    const mediaUploaded = headerMediaUrl.trim() !== "";

    const variablesReady =
        !!template &&
        !mapping.some((m) => m.kind === "TEXT" && !m.text.trim());

    const mediaReady = !!template && (!needsMedia || mediaUploaded);

    const launch = async () => {
        setError("");
        setInfo("");

        if (!name.trim()) {
            setError("Please enter a campaign name.");
            return;
        }

        if (selected.length === 0) {
            setError("Please select at least one contact category.");
            return;
        }

        if (!template) {
            setError("Please select an approved template.");
            return;
        }

        if (mapping.some((m) => m.kind === "TEXT" && !m.text.trim())) {
            setError("Please fill in all custom variable values.");
            return;
        }

        if (uploading) {
            setError("Please wait for the media upload to finish.");
            return;
        }

        if (needsMedia && !mediaUploaded) {
            setError(`Please select a ${mediaRule?.label ?? "media file"} for the header.`);
            return;
        }

        setLaunching(true);

        try {
            await campaignService.create({
                name: name.trim(),
                templateId: template.id,
                categoryIds: selected,
                variableMapping: mapping.map((m) =>
                    m.kind === "TEXT" ? `TEXT:${m.text}` : m.kind
                ),
                headerMediaUrl: needsMedia ? headerMediaUrl.trim() : undefined,
            });

            nav.push(CAMPAIGNS_PAGE);
        } catch (e) {
            setError(apiError(e));
            setLaunching(false);
        }
    };

    const allSelected =
        categories.length > 0 && selected.length === categories.length;

    return (
        <div className="cc-page">

            {/* HERO */}
            <div className="cc-hero">
                <div className="cc-hero-content">
                    <div className="cc-breadcrumb">
                        <span>Campaigns</span>
                        <i className="bi bi-chevron-right" />
                        <strong>Create campaign</strong>
                    </div>

                    <div className="cc-hero-main">
                        <div>
                            <div className="cc-hero-tag">
                                <i className="bi bi-whatsapp" />
                                WHATSAPP MARKETING
                            </div>

                            <h1>Create your campaign</h1>

                            <p>
                                Build meaningful conversations with your
                                audience. Configure your campaign and reach
                                the right people at the right time.
                            </p>
                        </div>

                        <div className="cc-hero-icon">
                            <i className="bi bi-megaphone" />
                            <span className="cc-icon-dot" />
                        </div>
                    </div>

                    <div className="cc-progress">
                        <div className="cc-progress-item active">
                            <span>01</span>
                            <div>
                                <strong>Campaign details</strong>
                                <small>Set up your campaign</small>
                            </div>
                        </div>

                        <div className="cc-progress-line" />

                        <div className={`cc-progress-item ${selected.length ? "active" : ""}`}>
                            <span>02</span>
                            <div>
                                <strong>Audience</strong>
                                <small>Select your contacts</small>
                            </div>
                        </div>

                        <div className="cc-progress-line" />

                        <div className={`cc-progress-item ${template ? "active" : ""}`}>
                            <span>03</span>
                            <div>
                                <strong>Message</strong>
                                <small>Choose your template</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* NOTIFICATIONS */}
            {error && (
                <div className="cc-alert cc-alert-error">
                    <i className="bi bi-exclamation-circle-fill" />
                    <span>{error}</span>
                    <button onClick={() => setError("")}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
            )}

            {info && (
                <div className="cc-alert cc-alert-success">
                    <i className="bi bi-check-circle-fill" />
                    <span>{info}</span>
                    <button onClick={() => setInfo("")}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
            )}

            <div className="cc-layout">

                {/* MAIN FORM */}
                <div className="cc-main">

                    {/* CAMPAIGN NAME */}
                    <section className="cc-card">
                        <div className="cc-card-header">
                            <div className="cc-section-icon">
                                <i className="bi bi-pencil-square" />
                            </div>

                            <div>
                                <h2>Campaign information</h2>
                                <p>Give your campaign a recognizable name.</p>
                            </div>

                            <span className="cc-step">STEP 01</span>
                        </div>

                        <div className="cc-field">
                            <label htmlFor="campaignName">
                                Campaign name <span>*</span>
                            </label>

                            <input
                                id="campaignName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Diwali Special Offers - November 2026"
                                maxLength={100}
                            />

                            <div className="cc-field-bottom">
                                <span>
                                    <i className="bi bi-info-circle" />
                                    Choose a name that helps you identify this campaign.
                                </span>
                                <small>{name.length}/100</small>
                            </div>
                        </div>
                    </section>

                    {/* CATEGORY SELECTION */}
                    <section className="cc-card">
                        <div className="cc-card-header">
                            <div className="cc-section-icon">
                                <i className="bi bi-people" />
                            </div>

                            <div>
                                <h2>Choose your audience</h2>
                                <p>Select the contact groups you want to reach.</p>
                            </div>

                            <span className="cc-step">STEP 02</span>
                        </div>

                        <div className="cc-audience-summary">
                            <div className="cc-audience-summary-icon">
                                <i className="bi bi-person-check" />
                            </div>

                            <div>
                                <strong>{totalContacts.toLocaleString("en-IN")}</strong>
                                <span>Contacts selected</span>
                            </div>

                            <div className="cc-audience-summary-divider" />

                            <div>
                                <strong>{selected.length}</strong>
                                <span>Categories</span>
                            </div>

                            <button
                                type="button"
                                className="cc-select-all"
                                onClick={selectAllCategories}
                                disabled={categories.length === 0}
                            >
                                {allSelected ? "Deselect all" : "Select all"}
                            </button>
                        </div>

                        {categories.length > 0 ? (
                            <div className="cc-category-grid">
                                {categories.map((category) => {
                                    const isSelected = selected.includes(category.id);

                                    return (
                                        <button
                                            type="button"
                                            key={category.id}
                                            className={`cc-category-card ${isSelected ? "selected" : ""}`}
                                            onClick={() => toggleCategory(category.id)}
                                        >
                                            <span className="cc-category-icon">
                                                <i className="bi bi-people-fill" />
                                            </span>

                                            <span className="cc-category-content">
                                                <strong>{category.name}</strong>
                                                <small>
                                                    {category.contactCount.toLocaleString("en-IN")} contacts
                                                </small>
                                            </span>

                                            <span className="cc-category-check">
                                                <i className={`bi ${isSelected ? "bi-check-lg" : "bi-plus-lg"}`} />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="cc-empty">
                                <i className="bi bi-people" />
                                <strong>No categories found</strong>
                                <span>Create contact categories to build your audience.</span>
                            </div>
                        )}

                        <div className="cc-selected-footer">
                            <i className="bi bi-shield-check" />
                            Your campaign will target contacts from the selected categories.
                        </div>
                    </section>

                    {/* TEMPLATE SELECTION */}
                    <section className="cc-card">
                        <div className="cc-card-header">
                            <div className="cc-section-icon">
                                <i className="bi bi-chat-square-text" />
                            </div>

                            <div>
                                <h2>Message template</h2>
                                <p>Choose an approved WhatsApp message template.</p>
                            </div>

                            <span className="cc-step">STEP 03</span>
                        </div>

                        <div className="cc-template-actions">
                            <button
                                type="button"
                                className="cc-refresh-btn"
                                onClick={() => refreshFromMeta(false)}
                                disabled={syncing}
                            >
                                <i className={`bi bi-arrow-repeat ${syncing ? "cc-spinning" : ""}`} />
                                {syncing ? "Refreshing..." : "Sync from Meta"}
                            </button>

                            <button
                                type="button"
                                className="cc-create-template-btn"
                                onClick={() => setShowTemplateForm(true)}
                            >
                                <i className="bi bi-plus-lg" />
                                New template
                            </button>
                        </div>

                        <div className="cc-template-select-wrapper">
                            <label htmlFor="templateSelect">Select template</label>

                            <div className="cc-select-container">
                                <i className="bi bi-file-earmark-text" />

                                <select
                                    id="templateSelect"
                                    value={templateId}
                                    onChange={(e) =>
                                        pickTemplate(
                                            e.target.value
                                                ? Number(e.target.value)
                                                : ""
                                        )
                                    }
                                >
                                    <option value="">
                                        {approvedTemplates.length
                                            ? "Choose an approved template"
                                            : "No approved templates available"}
                                    </option>

                                    {approvedTemplates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.language})
                                        </option>
                                    ))}
                                </select>

                                <i className="bi bi-chevron-down cc-select-arrow" />
                            </div>

                            <small>
                                {approvedTemplates.length} approved template
                                {approvedTemplates.length === 1 ? "" : "s"} available.
                                Pending or rejected templates appear here once Meta approves them.
                            </small>
                        </div>

                        {template && (
                            <div className="cc-template-config">

                                <div className="cc-template-selected">
                                    <div className="cc-template-selected-icon">
                                        <i className="bi bi-whatsapp" />
                                    </div>

                                    <div>
                                        <strong>{template.name}</strong>
                                        <span>
                                            {template.language} · {template.variableCount} variable(s)
                                        </span>
                                    </div>

                                    <span className="cc-approved">
                                        <i className="bi bi-check-circle-fill" />
                                        Selected
                                    </span>
                                </div>

                                {needsMedia && (
                                    <div className="cc-field">
                                        <label htmlFor="headerMediaFile">
                                            Header {headerType.toLowerCase()}{" "}
                                            <span>*</span>
                                        </label>

                                        <input
                                            id="headerMediaFile"
                                            type="file"
                                            accept={mediaRule?.accept}
                                            disabled={uploading}
                                            onChange={(e) => {
                                                handleMediaPick(e.target.files?.[0]);
                                                e.target.value = "";
                                            }}
                                        />

                                        {mediaPreview && (
                                            <img
                                                src={mediaPreview}
                                                alt="Selected header"
                                                style={{
                                                    marginTop: 10,
                                                    maxWidth: 220,
                                                    maxHeight: 160,
                                                    borderRadius: 8,
                                                    objectFit: "cover",
                                                }}
                                            />
                                        )}

                                        <div className="cc-field-bottom">
                                            <span>
                                                <i className="bi bi-info-circle" />
                                                {uploading
                                                    ? "Uploading..."
                                                    : mediaName
                                                        ? `Uploaded: ${mediaName}`
                                                        : `Select a ${mediaRule?.label} (max ${mediaRule?.maxMb} MB).`}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {template.variableCount > 0 && (
                                    <div className="cc-variable-section">
                                        <div className="cc-variable-heading">
                                            <div>
                                                <h3>Personalize your message</h3>
                                                <p>
                                                    Map each template variable to a contact field or custom value.
                                                </p>
                                            </div>

                                            <span>{mapping.length} variables</span>
                                        </div>

                                        <div className="cc-variable-list">
                                            {mapping.map((item, index) => (
                                                <div className="cc-variable-row" key={index}>
                                                    <div className="cc-variable-number">
                                                        {"{{" + (index + 1) + "}}"}
                                                    </div>

                                                    <div className="cc-variable-control">
                                                        <label>
                                                            Variable {index + 1}
                                                        </label>

                                                        <select
                                                            value={item.kind}
                                                            onChange={(e) =>
                                                                updateMap(index, {
                                                                    kind: e.target.value as Kind,
                                                                    text: "",
                                                                })
                                                            }
                                                        >
                                                            <option value="NAME">Contact name</option>
                                                            <option value="PHONE">Contact phone</option>
                                                            <option value="EMAIL">Contact email</option>
                                                            <option value="TEXT">Custom text</option>
                                                        </select>
                                                    </div>

                                                    {item.kind === "TEXT" ? (
                                                        <div className="cc-variable-control cc-variable-custom">
                                                            <label>Custom value</label>

                                                            <input
                                                                type="text"
                                                                value={item.text}
                                                                onChange={(e) =>
                                                                    updateMap(index, {
                                                                        text: e.target.value,
                                                                    })
                                                                }
                                                                placeholder="Enter message value"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="cc-variable-preview">
                                                            <small>
                                                                {item.kind === "NAME"
                                                                    ? "Each contact's name · example"
                                                                    : "Example value"}
                                                            </small>
                                                            <strong>{SAMPLE[item.kind]}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="cc-variable-note">
                                            <i className="bi bi-lightbulb" />
                                            Contact fields are dynamically populated for each recipient.
                                            Custom text is shared with everyone in this campaign.
                                        </div>
                                    </div>
                                )}

                                <div className="cc-preview-section">
                                    <div className="cc-preview-heading">
                                        <div>
                                            <h3>Message preview</h3>
                                            <p>See how your selected template will look.</p>
                                        </div>

                                        <span>
                                            <i className="bi bi-eye" />
                                            LIVE PREVIEW
                                        </span>
                                    </div>

                                    <div className="cc-preview-container">
                                        <TemplatePreview
                                            {...template}
                                            values={previewValues}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {approvedTemplates.length === 0 && !syncing && (
                            <div className="cc-empty cc-template-empty">
                                <i className="bi bi-file-earmark-plus" />
                                <strong>No approved templates available</strong>
                                <span>
                                    Create a template and wait for Meta approval.
                                    Then sync your templates.
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setShowTemplateForm(true)}
                                >
                                    <i className="bi bi-plus-lg" />
                                    Create template
                                </button>
                            </div>
                        )}
                    </section>

                </div>

                {/* SIDEBAR */}
                <aside className="cc-sidebar">
                    <div className="cc-summary-card">
                        <div className="cc-summary-header">
                            <div>
                                <span>CAMPAIGN OVERVIEW</span>
                                <h3>Ready to launch?</h3>
                            </div>

                            <div className="cc-summary-icon">
                                <i className="bi bi-send-fill" />
                            </div>
                        </div>

                        <div className="cc-total-contacts">
                            <span>Estimated recipients</span>
                            <strong>{totalContacts.toLocaleString("en-IN")}</strong>
                            <small>Contacts in selected categories</small>
                        </div>

                        <div className="cc-summary-divider" />

                        <div className="cc-summary-list">
                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-megaphone" />
                                    Campaign name
                                </span>
                                <strong title={name}>
                                    {name || "Not provided"}
                                </strong>
                            </div>

                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-people" />
                                    Categories
                                </span>
                                <strong>{selected.length} selected</strong>
                            </div>

                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-chat-square-text" />
                                    Template
                                </span>
                                <strong>{template ? template.name : "Not selected"}</strong>
                            </div>

                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-braces" />
                                    Variables
                                </span>
                                <strong>{mapping.length}</strong>
                            </div>
                        </div>

                        <div className="cc-summary-divider" />

                        <div className="cc-checklist">
                            <h4>Launch checklist</h4>

                            <div className={name.trim() ? "completed" : ""}>
                                <i className={`bi ${name.trim() ? "bi-check-circle-fill" : "bi-circle"}`} />
                                Campaign name added
                            </div>

                            <div className={selected.length ? "completed" : ""}>
                                <i className={`bi ${selected.length ? "bi-check-circle-fill" : "bi-circle"}`} />
                                Audience selected
                            </div>

                            <div className={template ? "completed" : ""}>
                                <i className={`bi ${template ? "bi-check-circle-fill" : "bi-circle"}`} />
                                Template selected
                            </div>

                            <div className={variablesReady ? "completed" : ""}>
                                <i className={`bi ${variablesReady ? "bi-check-circle-fill" : "bi-circle"}`} />
                                Variables configured
                            </div>

                            {needsMedia && (
                                <div className={mediaReady ? "completed" : ""}>
                                    <i className={`bi ${mediaReady ? "bi-check-circle-fill" : "bi-circle"}`} />
                                    Header media URL added
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="cc-launch-btn"
                            disabled={launching || uploading}
                            onClick={launch}
                        >
                            {launching ? (
                                <>
                                    <span className="cc-loader" />
                                    Launching campaign...
                                </>
                            ) : (
                                <>
                                    Launch campaign
                                    <i className="bi bi-arrow-right" />
                                </>
                            )}
                        </button>

                        <p className="cc-launch-note">
                            <i className="bi bi-shield-lock" />
                            Review your campaign details before launching.
                        </p>
                    </div>

                    <div className="cc-help-card">
                        <div className="cc-help-icon">
                            <i className="bi bi-lightbulb" />
                        </div>

                        <div>
                            <strong>Pro tip</strong>
                            <p>
                                Use personalized variables like contact names
                                to make your WhatsApp messages more engaging.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {showTemplateForm && (
                <Modal
                    title="Create WhatsApp template"
                    onClose={() => setShowTemplateForm(false)}
                >
                    <TemplateForm
                        onCreated={(t) => {
                            setShowTemplateForm(false);

                            setInfo(
                                `Template "${t.name}" submitted (status: ${t.status}). It will be available once approved by Meta.`
                            );

                            loadTemplates().catch((e) =>
                                setError(apiError(e))
                            );
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}