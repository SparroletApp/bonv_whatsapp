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

// Earliest selectable time for the date picker (now + 5 min, in local time) as "YYYY-MM-DDTHH:mm"
const minSchedule = () => {
    const d = new Date(Date.now() + 5 * 60000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export default function CampaignCreatePage() {
    const nav = useRouter();

    const [name, setName] = useState("");
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [selected, setSelected] = useState<number[]>([]);

    const [templates, setTemplates] = useState<TemplateResponse[]>([]);
    const [templateId, setTemplateId] = useState<number | "">("");

    const [mapping, setMapping] = useState<VarMap[]>([]);

    const [sendMode, setSendMode] = useState<"NOW" | "LATER">("NOW");
    const [scheduledAt, setScheduledAt] = useState("");

    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    const filteredCategories = useMemo(() => {
        return categories.filter((category) =>
            category.name
                .toLowerCase()
                .includes(categorySearch.toLowerCase())
        );
    }, [categories, categorySearch]);

    const selectedCategories = useMemo(() => {
        return categories.filter((category) =>
            selected.includes(category.id)
        );
    }, [categories, selected]);

    const approvedTemplates = useMemo(
        () =>
            templates.filter(
                (t) => t.status?.toUpperCase() === "APPROVED"
            ),
        [templates]
    );

    const template = approvedTemplates.find(
        (t) => t.id === templateId
    );

    const headerType = template?.headerType?.toUpperCase() ?? "";

    const needsMedia = MEDIA_HEADERS.includes(headerType);

    const savedMediaUrl = template?.headerMediaUrl?.trim() ?? "";

    const mediaReady =
        !!template && (!needsMedia || !!savedMediaUrl);

    const variablesReady =
        !!template &&
        !mapping.some(
            (m) => m.kind === "TEXT" && !m.text.trim()
        );

    const scheduleReady = sendMode === "NOW" || !!scheduledAt;

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
                setError(
                    "Could not refresh templates: " + apiError(e)
                );
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
            !approvedTemplates.some(
                (t) => t.id === templateId
            )
        ) {
            setTemplateId("");
            setMapping([]);
        }
    }, [approvedTemplates, templateId]);

    const totalContacts = useMemo(() => {
        return categories
            .filter((c) => selected.includes(c.id))
            .reduce(
                (sum, c) => sum + c.contactCount,
                0
            );
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

        const selectedTemplate = approvedTemplates.find(
            (t) => t.id === id
        );

        setMapping(
            Array.from(
                {
                    length: selectedTemplate?.variableCount ?? 0,
                },
                (_, i) => ({
                    kind: i === 0 ? "NAME" : "TEXT",
                    text: "",
                })
            )
        );
    };

    const updateMap = (
        index: number,
        patch: Partial<VarMap>
    ) => {
        setMapping((current) =>
            current.map((item, i) =>
                i === index
                    ? { ...item, ...patch }
                    : item
            )
        );
    };

    const previewValues = mapping.map((item) =>
        item.kind === "TEXT"
            ? item.text
            : SAMPLE[item.kind]
    );

    const launch = async () => {
        setError("");
        setInfo("");

        if (!name.trim()) {
            setError("Please enter a campaign name.");
            return;
        }

        if (selected.length === 0) {
            setError(
                "Please select at least one contact category."
            );
            return;
        }

        if (!template) {
            setError("Please select an approved template.");
            return;
        }

        if (
            mapping.some(
                (m) =>
                    m.kind === "TEXT" &&
                    !m.text.trim()
            )
        ) {
            setError(
                "Please fill in all custom variable values."
            );
            return;
        }

        if (needsMedia && !savedMediaUrl) {
            setError(
                `The selected ${headerType.toLowerCase()} template has no saved media. Please recreate the template with its media.`
            );
            return;
        }

        if (sendMode === "LATER") {
            if (!scheduledAt) {
                setError("Please choose a date and time to send the campaign.");
                return;
            }

            if (new Date(scheduledAt).getTime() < Date.now() + 60_000) {
                setError("Scheduled time must be at least 1 minute in the future.");
                return;
            }
        }

        setLaunching(true);

        try {

            await campaignService.create({
                name: name.trim(),
                templateId: template.id,
                categoryIds: selected,
                variableMapping: mapping.map((m) =>
                    m.kind === "TEXT"
                        ? `TEXT:${m.text}`
                        : m.kind
                ),
                // null = send immediately, otherwise e.g. "2026-11-10T18:30"
                scheduledAt: sendMode === "LATER" ? scheduledAt : null,
            });

            nav.push(CAMPAIGNS_PAGE);
        } catch (e) {
            setError(apiError(e));
            setLaunching(false);
        }
    };

    const allSelected =
        categories.length > 0 &&
        selected.length === categories.length;

    return (
        <div className="cc-page">

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

                        <div
                            className={`cc-progress-item ${selected.length ? "active" : ""
                                }`}
                        >
                            <span>02</span>
                            <div>
                                <strong>Audience</strong>
                                <small>Select your contacts</small>
                            </div>
                        </div>

                        <div className="cc-progress-line" />

                        <div
                            className={`cc-progress-item ${template ? "active" : ""
                                }`}
                        >
                            <span>03</span>
                            <div>
                                <strong>Message</strong>
                                <small>Choose your template</small>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

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

                <div className="cc-main">

                    <section className="cc-card">

                        <div className="cc-card-header">
                            <div className="cc-section-icon">
                                <i className="bi bi-pencil-square" />
                            </div>

                            <div>
                                <h2>Campaign information</h2>
                                <p>
                                    Give your campaign a recognizable name.
                                </p>
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
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                placeholder="e.g. Diwali Special Offers - November 2026"
                                maxLength={100}
                            />

                            <div className="cc-field-bottom">
                                <span>
                                    <i className="bi bi-info-circle" />
                                    Choose a name that helps you identify
                                    this campaign.
                                </span>

                                <small>
                                    {name.length}/100
                                </small>
                            </div>
                        </div>
                    </section>

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
                        </div>

                        <div className="cc-category-dropdown">

                            <button
                                type="button"
                                className={`cc-category-trigger ${categoryDropdownOpen ? "open" : ""
                                    }`}
                                onClick={() =>
                                    setCategoryDropdownOpen((prev) => !prev)
                                }
                            >
                                <div className="cc-trigger-left">
                                    <i className="bi bi-folder2-open" />

                                    <div>
                                        <strong>
                                            {selected.length > 0
                                                ? `${selected.length} categories selected`
                                                : "Select contact categories"}
                                        </strong>

                                        <small>
                                            {selected.length > 0
                                                ? `${totalContacts.toLocaleString("en-IN")} contacts in your audience`
                                                : "Click to choose your audience"}
                                        </small>
                                    </div>
                                </div>

                                <i className={`bi ${categoryDropdownOpen
                                        ? "bi-chevron-up"
                                        : "bi-chevron-down"
                                    }`} />
                            </button>

                            {selectedCategories.length > 0 && (
                                <div className="cc-selected-chips">
                                    {selectedCategories.map((category) => (
                                        <span key={category.id} className="cc-category-chip">
                                            {category.name}

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCategory(category.id);
                                                }}
                                                aria-label={`Remove ${category.name}`}
                                            >
                                                <i className="bi bi-x" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {categoryDropdownOpen && (
                                <div className="cc-category-dropdown-menu">

                                    <div className="cc-category-search">
                                        <i className="bi bi-search" />

                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={categorySearch}
                                            onChange={(e) =>
                                                setCategorySearch(e.target.value)
                                            }
                                        />

                                        {categorySearch && (
                                            <button
                                                type="button"
                                                onClick={() => setCategorySearch("")}
                                            >
                                                <i className="bi bi-x-circle" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="cc-category-dropdown-toolbar">
                                        <span>
                                            {filteredCategories.length} categories
                                        </span>

                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelected((current) => [
                                                        ...new Set([
                                                            ...current,
                                                            ...filteredCategories.map(
                                                                (c) => c.id
                                                            ),
                                                        ]),
                                                    ]);
                                                }}
                                            >
                                                Select all
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelected([]);
                                                }}
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    </div>

                                    <div className="cc-category-dropdown-list">

                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map((category) => {
                                                const isSelected = selected.includes(
                                                    category.id
                                                );

                                                return (
                                                    <label
                                                        key={category.id}
                                                        className={`cc-category-option ${isSelected ? "selected" : ""
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() =>
                                                                toggleCategory(category.id)
                                                            }
                                                        />

                                                        <span className="cc-custom-checkbox">
                                                            <i className="bi bi-check-lg" />
                                                        </span>

                                                        <span className="cc-option-icon">
                                                            <i className="bi bi-people-fill" />
                                                        </span>

                                                        <span className="cc-option-details">
                                                            <strong>{category.name}</strong>
                                                            <small>
                                                                {category.contactCount.toLocaleString("en-IN")} contacts
                                                            </small>
                                                        </span>

                                                        <span className="cc-option-count">
                                                            {category.contactCount.toLocaleString("en-IN")}
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        ) : (
                                            <div className="cc-category-no-results">
                                                <i className="bi bi-search" />
                                                <strong>No categories found</strong>
                                                <span>Try another category name.</span>
                                            </div>
                                        )}

                                    </div>

                                    <div className="cc-category-dropdown-footer">
                                        <span>
                                            {selected.length} selected
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCategoryDropdownOpen(false);
                                                setCategorySearch("");
                                            }}
                                        >
                                            Done
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>

                        <div className="cc-selected-footer">
                            <i className="bi bi-shield-check" />
                            Your campaign will target contacts from the selected categories.
                        </div>

                    </section>



                    <section className="cc-card">

                        <div className="cc-card-header">
                            <div className="cc-section-icon">
                                <i className="bi bi-chat-square-text" />
                            </div>

                            <div>
                                <h2>Message template</h2>
                                <p>
                                    Choose an approved WhatsApp message template.
                                </p>
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
                                <i
                                    className={`bi bi-arrow-repeat ${syncing ? "cc-spinning" : ""
                                        }`}
                                />

                                {syncing
                                    ? "Refreshing..."
                                    : "Sync from Meta"}
                            </button>

                            <button
                                type="button"
                                className="cc-create-template-btn"
                                onClick={() =>
                                    setShowTemplateForm(true)
                                }
                            >
                                <i className="bi bi-plus-lg" />
                                New template
                            </button>

                        </div>

                        <div className="cc-template-select-wrapper">

                            <label htmlFor="templateSelect">
                                Select template
                            </label>

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
                                        <option
                                            key={t.id}
                                            value={t.id}
                                        >
                                            {t.name} ({t.language})
                                        </option>
                                    ))}
                                </select>

                                <i className="bi bi-chevron-down cc-select-arrow" />

                            </div>

                            <small>
                                {approvedTemplates.length} approved template
                                {approvedTemplates.length === 1 ? "" : "s"}{" "}
                                available. Pending or rejected templates
                                appear here once Meta approves them.
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
                                            {template.language} ·{" "}
                                            {template.variableCount} variable(s)
                                        </span>
                                    </div>

                                    <span className="cc-approved">
                                        <i className="bi bi-check-circle-fill" />
                                        Selected
                                    </span>

                                </div>

                                {needsMedia && (
                                    <div className="cc-saved-media-section">

                                        <div className="cc-saved-media-heading">

                                            <div className="cc-saved-media-icon">
                                                <i className="bi bi-cloud-check" />
                                            </div>

                                            <div className="cc-saved-media-info">
                                                <strong>
                                                    Template header media
                                                </strong>

                                                <small>
                                                    Previously uploaded media
                                                    from this template.
                                                </small>
                                            </div>

                                            {savedMediaUrl ? (
                                                <span className="cc-media-status">
                                                    <i className="bi bi-check-circle-fill" />
                                                    Available
                                                </span>
                                            ) : (
                                                <span className="cc-media-missing">
                                                    <i className="bi bi-exclamation-circle-fill" />
                                                    Missing
                                                </span>
                                            )}

                                        </div>

                                        {savedMediaUrl && (
                                            <div className="cc-saved-media-preview">

                                                {headerType === "IMAGE" && (
                                                    <img
                                                        src={savedMediaUrl}
                                                        alt="Saved template header"
                                                    />
                                                )}

                                                {headerType === "VIDEO" && (
                                                    <video
                                                        src={savedMediaUrl}
                                                        controls
                                                    />
                                                )}

                                                {headerType === "DOCUMENT" && (
                                                    <a
                                                        href={savedMediaUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <i className="bi bi-file-earmark-pdf" />

                                                        View saved template document

                                                        <i className="bi bi-box-arrow-up-right" />
                                                    </a>
                                                )}

                                                <p>
                                                    <i className="bi bi-info-circle" />
                                                    This media is retrieved
                                                    from the selected template.
                                                    No additional upload is needed.
                                                </p>

                                            </div>
                                        )}

                                        {!savedMediaUrl && (
                                            <div className="cc-media-warning">
                                                <i className="bi bi-exclamation-triangle" />

                                                <span>
                                                    No saved media URL was found
                                                    for this template. Recreate
                                                    the template with its media
                                                    before launching this campaign.
                                                </span>
                                            </div>
                                        )}

                                    </div>
                                )}

                                {template.variableCount > 0 && (
                                    <div className="cc-variable-section">

                                        <div className="cc-variable-heading">
                                            <div>
                                                <h3>
                                                    Personalize your message
                                                </h3>

                                                <p>
                                                    Map each template variable
                                                    to a contact field or
                                                    custom value.
                                                </p>
                                            </div>

                                            <span>
                                                {mapping.length} variables
                                            </span>
                                        </div>

                                        <div className="cc-variable-list">

                                            {mapping.map((item, index) => (
                                                <div
                                                    className="cc-variable-row"
                                                    key={index}
                                                >

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
                                                            <option value="NAME">
                                                                Contact name
                                                            </option>

                                                            <option value="PHONE">
                                                                Contact phone
                                                            </option>

                                                            <option value="EMAIL">
                                                                Contact email
                                                            </option>

                                                            <option value="TEXT">
                                                                Custom text
                                                            </option>
                                                        </select>

                                                    </div>

                                                    {item.kind === "TEXT" ? (
                                                        <div className="cc-variable-control cc-variable-custom">

                                                            <label>
                                                                Custom value
                                                            </label>

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

                                                            <strong>
                                                                {SAMPLE[item.kind]}
                                                            </strong>

                                                        </div>
                                                    )}

                                                </div>
                                            ))}

                                        </div>

                                        <div className="cc-variable-note">
                                            <i className="bi bi-lightbulb" />

                                            Contact fields are dynamically
                                            populated for each recipient.
                                            Custom text is shared with everyone
                                            in this campaign.
                                        </div>

                                    </div>
                                )}

                                <div className="cc-preview-section">

                                    <div className="cc-preview-heading">
                                        <div>
                                            <h3>Message preview</h3>
                                            <p>
                                                See how your selected template
                                                will look.
                                            </p>
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

                                <strong>
                                    No approved templates available
                                </strong>

                                <span>
                                    Create a template and wait for Meta
                                    approval. Then sync your templates.
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowTemplateForm(true)
                                    }
                                >
                                    <i className="bi bi-plus-lg" />
                                    Create template
                                </button>

                            </div>
                        )}

                    </section>

                    <section className="cc-card">

                        <div className="cc-card-header">
                            <div className="cc-section-icon">
                                <i className="bi bi-clock" />
                            </div>

                            <div>
                                <h2>Send time</h2>
                                <p>
                                    Send right away or schedule for later.
                                </p>
                            </div>

                            <span className="cc-step">STEP 04</span>
                        </div>

                        <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name="sendMode"
                                    checked={sendMode === "NOW"}
                                    onChange={() => setSendMode("NOW")}
                                />
                                Send immediately
                            </label>

                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name="sendMode"
                                    checked={sendMode === "LATER"}
                                    onChange={() => setSendMode("LATER")}
                                />
                                Schedule for later
                            </label>
                        </div>

                        {sendMode === "LATER" && (
                            <div className="cc-field">
                                <label htmlFor="scheduledAt">
                                    Date &amp; time <span>*</span>
                                </label>

                                <input
                                    id="scheduledAt"
                                    type="datetime-local"
                                    min={minSchedule()}
                                    value={scheduledAt}
                                    onChange={(e) =>
                                        setScheduledAt(e.target.value)
                                    }
                                />

                                <div className="cc-field-bottom">
                                    <span>
                                        <i className="bi bi-info-circle" />
                                        Messages will be sent automatically at
                                        this time (India time).
                                    </span>
                                </div>
                            </div>
                        )}

                    </section>

                </div>

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

                            <strong>
                                {totalContacts.toLocaleString("en-IN")}
                            </strong>

                            <small>
                                Contacts in selected categories
                            </small>
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

                                <strong>
                                    {selected.length} selected
                                </strong>
                            </div>

                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-chat-square-text" />
                                    Template
                                </span>

                                <strong>
                                    {template
                                        ? template.name
                                        : "Not selected"}
                                </strong>
                            </div>

                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-braces" />
                                    Variables
                                </span>

                                <strong>
                                    {mapping.length}
                                </strong>
                            </div>

                            <div className="cc-summary-row">
                                <span>
                                    <i className="bi bi-clock" />
                                    Send time
                                </span>

                                <strong>
                                    {sendMode === "NOW"
                                        ? "Immediately"
                                        : scheduledAt
                                            ? new Date(scheduledAt).toLocaleString(undefined, {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "Not set"}
                                </strong>
                            </div>

                        </div>

                        <div className="cc-summary-divider" />

                        <div className="cc-checklist">

                            <h4>Launch checklist</h4>

                            <div className={name.trim() ? "completed" : ""}>
                                <i
                                    className={`bi ${name.trim()
                                        ? "bi-check-circle-fill"
                                        : "bi-circle"
                                        }`}
                                />
                                Campaign name added
                            </div>

                            <div className={selected.length ? "completed" : ""}>
                                <i
                                    className={`bi ${selected.length
                                        ? "bi-check-circle-fill"
                                        : "bi-circle"
                                        }`}
                                />
                                Audience selected
                            </div>

                            <div className={template ? "completed" : ""}>
                                <i
                                    className={`bi ${template
                                        ? "bi-check-circle-fill"
                                        : "bi-circle"
                                        }`}
                                />
                                Template selected
                            </div>

                            <div className={variablesReady ? "completed" : ""}>
                                <i
                                    className={`bi ${variablesReady
                                        ? "bi-check-circle-fill"
                                        : "bi-circle"
                                        }`}
                                />
                                Variables configured
                            </div>

                            {needsMedia && (
                                <div className={mediaReady ? "completed" : ""}>
                                    <i
                                        className={`bi ${mediaReady
                                            ? "bi-check-circle-fill"
                                            : "bi-circle"
                                            }`}
                                    />
                                    Template media available
                                </div>
                            )}

                            {sendMode === "LATER" && (
                                <div className={scheduleReady ? "completed" : ""}>
                                    <i
                                        className={`bi ${scheduleReady
                                            ? "bi-check-circle-fill"
                                            : "bi-circle"
                                            }`}
                                    />
                                    Schedule time set
                                </div>
                            )}

                        </div>

                        <button
                            type="button"
                            className="cc-launch-btn"
                            disabled={
                                launching ||
                                !template ||
                                (needsMedia && !mediaReady) ||
                                !scheduleReady
                            }
                            onClick={launch}
                        >
                            {launching ? (
                                <>
                                    <span className="cc-loader" />
                                    {sendMode === "LATER"
                                        ? "Scheduling campaign..."
                                        : "Launching campaign..."}
                                </>
                            ) : (
                                <>
                                    {sendMode === "LATER"
                                        ? "Schedule campaign"
                                        : "Launch campaign"}
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