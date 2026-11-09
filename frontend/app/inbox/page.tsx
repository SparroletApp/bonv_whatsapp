"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type { ChangeEvent } from "react";

import { apiError } from "../utils/apiError";

import inboxService, {
    Conversation,
    InboxMessage,
} from "../apiservice/inboxservice";

import templateService, {
    TemplateResponse,
} from "../apiservice/templateservice";

import "./inbox.css";

/* ==========================================
   HELPERS
========================================== */

function unwrapResponse<T>(response: any): T {
    return response?.data !== undefined
        ? response.data
        : response;
}

function getInitials(name: string) {
    return (
        name
            ?.split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase() || "?"
    );
}

function formatMessageTime(value: string) {
    if (!value) return "";

    const date = new Date(
        /Z$|[+-]\d{2}:\d{2}$/.test(value)
            ? value
            : `${value}Z`
    );

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function formatRemaining(ms: number) {
    if (ms <= 0) return "0m";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
}

function remainingFor(
    conversation: Conversation | null | undefined,
    now: number
) {
    if (!conversation?.windowExpiresAt || !now) return 0;

    const raw = conversation.windowExpiresAt as unknown;

    let expiry: number;

    if (typeof raw === "number") {
        expiry =
            raw < 1000000000000
                ? raw * 1000
                : raw;
    } else {
        const value = String(raw);

        const utcValue =
            /Z$|[+-]\d{2}:\d{2}$/.test(value)
                ? value
                : `${value}Z`;

        expiry = new Date(utcValue).getTime();
    }

    if (!Number.isFinite(expiry)) return 0;

    return Math.max(0, expiry - now);
}

function replaceTemplateVariables(
    body: string,
    parameters: string[]
) {
    let result = body || "";

    parameters.forEach((value, index) => {
        const number = index + 1;

        result = result.replace(
            new RegExp(`\\{\\{\\s*${number}\\s*\\}\\}`, "g"),
            value
        );
    });

    return result;
}

/* ==========================================
   NORMAL MEDIA BUBBLE
========================================== */

function MediaBubble({ m }: { m: InboxMessage }) {
    const [url, setUrl] = useState("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!m.mediaId) return;

        let objectUrl = "";
        let cancelled = false;

        inboxService
            .media(m.mediaId)
            .then((response: any) => {
                if (cancelled) return;

                const blob = unwrapResponse<Blob>(response);

                if (!(blob instanceof Blob)) {
                    throw new Error("Invalid media response");
                }

                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;

            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [m.mediaId]);

    if (failed) {
        return (
            <div className="wa-media-missing">
                Media unavailable
            </div>
        );
    }

    if (!url) {
        return (
            <div className="wa-media-loading">
                Loading…
            </div>
        );
    }

    if (m.messageType === "IMAGE") {
        return (
            <img
                src={url}
                alt="Message attachment"
                className="wa-media-image"
            />
        );
    }

    if (m.messageType === "VIDEO") {
        return (
            <video
                src={url}
                controls
                className="wa-media-video"
            />
        );
    }

    if (m.messageType === "DOCUMENT") {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="wa-document-link"
            >
                <i className="bi bi-file-earmark-pdf" />
                Open document
            </a>
        );
    }

    return (
        <audio
            controls
            src={url}
            className="wa-media-audio"
        />
    );
}

/* ==========================================
   TEMPLATE HEADER MEDIA
========================================== */

function TemplateHeaderMedia({
    imageUrl,
}: {
    imageUrl: string;
}) {
    const [failed, setFailed] = useState(false);

    if (!imageUrl || failed) {
        return (
            <div className="wa-media-missing">
                <i className="bi bi-image" />
                Template image unavailable
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt="Template header"
            className="wa-media-image wa-template-header-image"
            onError={() => setFailed(true)}
        />
    );
}

/* ==========================================
   MAIN INBOX PAGE
========================================== */

export default function InboxPage() {
    const [convs, setConvs] = useState<Conversation[]>([]);
    const [active, setActive] = useState<Conversation | null>(null);
    const [msgs, setMsgs] = useState<InboxMessage[]>([]);

    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [now, setNow] = useState(0);

    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [recording, setRecording] = useState(false);
    const [recSecs, setRecSecs] = useState(0);

    /* TEMPLATE STATES */

    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const [approvedTemplates, setApprovedTemplates] =
        useState<TemplateResponse[]>([]);

    const [selectedTemplateId, setSelectedTemplateId] =
        useState<number | "">("");

    const [templateParameters, setTemplateParameters] =
        useState<string[]>([]);

    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [sendingTemplate, setSendingTemplate] = useState(false);
    const [templateError, setTemplateError] = useState("");

    /* REFS */

    const fileInput = useRef<HTMLInputElement>(null);
    const recRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const cancelRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const bottom = useRef<HTMLDivElement>(null);
    const activePhoneRef = useRef<string | null>(null);

    /* ==========================================
       LOAD CONVERSATIONS
    ========================================== */

    const loadConvs = async () => {
        try {
            const response = await inboxService.conversations();
            const data = unwrapResponse<Conversation[]>(response);

            if (Array.isArray(data)) {
                setConvs(data);
            }
        } catch {
            // Retain existing conversations if polling fails.
        }
    };

    /* ==========================================
       LOAD MESSAGES
    ========================================== */

    const loadMsgs = async (phone: string) => {
        try {
            const response = await inboxService.messages(phone);
            const data = unwrapResponse<InboxMessage[]>(response);

            if (
                Array.isArray(data) &&
                activePhoneRef.current === phone
            ) {
                setMsgs(data);
            }
        } catch {
            // Retain existing messages if polling fails.
        }
    };

    /* ==========================================
       INITIAL LOAD AND POLLING
    ========================================== */

    useEffect(() => {
        loadConvs();

        const interval = setInterval(loadConvs, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!active?.phone) return;

        activePhoneRef.current = active.phone;

        loadMsgs(active.phone);

        const interval = setInterval(() => {
            loadMsgs(active.phone);
        }, 5000);

        return () => clearInterval(interval);
    }, [active?.phone]);

    /* ==========================================
       CURRENT TIME
    ========================================== */

    useEffect(() => {
        setNow(Date.now());

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    /* ==========================================
       AUTO SCROLL
    ========================================== */

    useEffect(() => {
        bottom.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [msgs.length]);

    /* ==========================================
       PREVIEW CLEANUP
    ========================================== */

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    /* ==========================================
       RECORDING CLEANUP
    ========================================== */

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            const recorder = recRef.current;

            if (recorder?.state === "recording") {
                recorder.stop();
            }
        };
    }, []);

    /* ==========================================
       ACTIVE CONVERSATION
    ========================================== */

    const activeConv =
        convs.find((c) => c.phone === active?.phone) ?? active;

    const remainingMs = remainingFor(activeConv, now);
    const windowOpen = remainingMs > 0;

    /* ==========================================
       OPEN CONVERSATION
    ========================================== */

    const open = async (c: Conversation) => {
        activePhoneRef.current = c.phone;

        setActive(c);
        setError("");
        setMsgs([]);
        setText("");

        await loadMsgs(c.phone);

        if (c.unreadCount > 0) {
            try {
                await inboxService.markRead(c.phone);
                await loadConvs();
            } catch {
                // Ignore mark-read refresh errors.
            }
        }
    };

    /* ==========================================
       TEMPLATE SELECTION
    ========================================== */

    const selectedTemplate = useMemo(
        () =>
            approvedTemplates.find(
                (t) => t.id === Number(selectedTemplateId)
            ) ?? null,
        [approvedTemplates, selectedTemplateId]
    );

    /* ==========================================
       BODY VARIABLES
    ========================================== */

    const bodyVariableNumbers = useMemo(() => {
        if (!selectedTemplate?.body) return [];

        const matches = [
            ...selectedTemplate.body.matchAll(
                /\{\{\s*(\d+)\s*\}\}/g
            ),
        ];

        return Array.from(
            new Set(matches.map((match) => Number(match[1]))
            )
        ).sort((a, b) => a - b);
    }, [selectedTemplate]);

    /* ==========================================
       TEMPLATE VALIDATION
    ========================================== */

    const unsupportedTemplateReason = useMemo(() => {
        if (!selectedTemplate) return "";

        const headerType =
            selectedTemplate.headerType?.toUpperCase() || "NONE";

        if (headerType === "LOCATION") {
            return "Location header templates are not supported by this send form yet.";
        }

        if (
            headerType === "TEXT" &&
            /\{\{\s*\d+\s*\}\}/.test(
                selectedTemplate.headerText || ""
            )
        ) {
            return "This template has header variables. Header parameter support must be added before sending it.";
        }

        return "";
    }, [selectedTemplate]);

    /* ==========================================
       OPEN TEMPLATE MODAL
    ========================================== */

    const openTemplateModal = async () => {
        if (!active) return;

        setTemplateError("");
        setError("");
        setShowTemplateModal(true);
        setSelectedTemplateId("");
        setTemplateParameters([]);

        try {
            setLoadingTemplates(true);

            const response = await templateService.list("APPROVED");
            const data = unwrapResponse<TemplateResponse[]>(response);

            const templates = Array.isArray(data) ? data : [];

            setApprovedTemplates(
                templates.filter(
                    (template) =>
                        template.status?.toUpperCase() === "APPROVED"
                )
            );
        } catch (e) {
            setTemplateError(apiError(e));
        } finally {
            setLoadingTemplates(false);
        }
    };

    /* ==========================================
       SELECT TEMPLATE
    ========================================== */

    const selectTemplate = (value: string) => {
        const id = value ? Number(value) : "";

        setSelectedTemplateId(id);
        setTemplateError("");

        if (id === "") {
            setTemplateParameters([]);
            return;
        }

        const template = approvedTemplates.find(
            (t) => t.id === Number(id)
        );

        if (!template) {
            setTemplateParameters([]);
            return;
        }

        const matches = [
            ...template.body.matchAll(
                /\{\{\s*(\d+)\s*\}\}/g
            ),
        ];

        const numbers = Array.from(
            new Set(matches.map((match) => Number(match[1]))
            )
        ).sort((a, b) => a - b);

        setTemplateParameters(
            numbers.map(() => "")
        );
    };

    /* ==========================================
       UPDATE TEMPLATE VARIABLES
    ========================================== */

    const updateTemplateParameter = (
        index: number,
        value: string
    ) => {
        setTemplateParameters((previous) =>
            previous.map((item, i) =>
                i === index ? value : item
            )
        );
    };

    /* ==========================================
       TEMPLATE PREVIEW
    ========================================== */

    const templatePreview = useMemo(() => {
        if (!selectedTemplate) return "";

        let preview = selectedTemplate.body || "";

        bodyVariableNumbers.forEach((number, index) => {
            const value =
                templateParameters[index] || `{{${number}}}`;

            preview = preview.replace(
                new RegExp(
                    `\\{\\{\\s*${number}\\s*\\}\\}`,
                    "g"
                ),
                value
            );
        });

        return preview;
    }, [
        selectedTemplate,
        bodyVariableNumbers,
        templateParameters,
    ]);

    /* ==========================================
       SEND TEMPLATE
    ========================================== */

    const sendTemplate = async () => {
        if (!active || !selectedTemplate) {
            setTemplateError("Please select a template.");
            return;
        }

        if (unsupportedTemplateReason) {
            setTemplateError(unsupportedTemplateReason);
            return;
        }

        if (
            templateParameters.some(
                (parameter) => !parameter.trim()
            )
        ) {
            setTemplateError(
                "Please fill in all template variables."
            );
            return;
        }

        setTemplateError("");
        setSendingTemplate(true);

        const phone = active.phone;

        try {
            await inboxService.sendTemplate(phone, {
                templateId: selectedTemplate.id,
                templateName: selectedTemplate.name,
                language: selectedTemplate.language,
                parameters: templateParameters,
            });

            setShowTemplateModal(false);
            setSelectedTemplateId("");
            setTemplateParameters([]);

            await loadMsgs(phone);
            await loadConvs();
        } catch (e) {
            setTemplateError(apiError(e));
        } finally {
            setSendingTemplate(false);
        }
    };

    /* ==========================================
       CLEAR IMAGE
    ========================================== */

    const clearImage = () => {
        setPendingImage(null);
        setPreviewUrl("");

        if (fileInput.current) {
            fileInput.current.value = "";
        }
    };

    /* ==========================================
       NORMAL MESSAGE SENDING
    ========================================== */

    const send = async () => {
        if (!active || !windowOpen) return;

        setError("");

        try {
            if (pendingImage) {
                await inboxService.replyMedia(
                    active.phone,
                    pendingImage,
                    pendingImage.name,
                    text.trim() || undefined
                );

                clearImage();
            } else if (text.trim()) {
                await inboxService.reply(
                    active.phone,
                    text.trim()
                );
            } else {
                return;
            }

            setText("");

            await loadMsgs(active.phone);
            await loadConvs();
        } catch (e) {
            setError(apiError(e));
        }
    };

    /* ==========================================
       PICK IMAGE
    ========================================== */

    const pickImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        e.target.value = "";

        if (!file) return;

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            setError("Only JPEG or PNG images are supported.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be 5 MB or smaller.");
            return;
        }

        setError("");
        setPendingImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    /* ==========================================
       AUDIO RECORDING
    ========================================== */

    const startRecording = async () => {
        if (!active || !windowOpen) return;

        setError("");

        const phone = active.phone;

        try {
            if (
                !navigator.mediaDevices?.getUserMedia ||
                !window.MediaRecorder
            ) {
                throw new Error(
                    "Audio recording is not supported by this browser."
                );
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                });

            const supportedTypes = [
                "audio/ogg;codecs=opus",
                "audio/mp4",
                "audio/webm;codecs=opus",
                "audio/webm",
            ];

            const selectedType = supportedTypes.find((type) =>
                MediaRecorder.isTypeSupported(type)
            );

            const recorder = new MediaRecorder(
                stream,
                selectedType ? { mimeType: selectedType } : undefined
            );

            chunksRef.current = [];
            cancelRef.current = false;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                setRecording(false);
                setRecSecs(0);

                if (
                    cancelRef.current ||
                    chunksRef.current.length === 0
                ) {
                    return;
                }

                const mime = recorder.mimeType || "audio/webm";

                const blob = new Blob(chunksRef.current, {
                    type: mime,
                });

                if (blob.size > 16 * 1024 * 1024) {
                    setError("Audio must be 16 MB or smaller.");
                    return;
                }

                const extension = mime.includes("ogg")
                    ? "ogg"
                    : mime.includes("mp4")
                        ? "m4a"
                        : "webm";

                try {
                    await inboxService.replyMedia(
                        phone,
                        blob,
                        `voice.${extension}`
                    );

                    await loadMsgs(phone);
                    await loadConvs();
                } catch (e) {
                    setError(apiError(e));
                }
            };

            recorder.onerror = () => {
                stream.getTracks().forEach((track) => track.stop());

                setRecording(false);
                setError("Audio recording failed.");
            };

            recorder.start(500);
            recRef.current = recorder;

            setRecording(true);

            timerRef.current = setInterval(() => {
                setRecSecs((seconds) => seconds + 1);
            }, 1000);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Microphone access failed."
            );
        }
    };

    const stopRecording = (cancel = false) => {
        cancelRef.current = cancel;

        if (recRef.current?.state === "recording") {
            recRef.current.stop();
        }
    };

    const fmtSecs = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${String(
            seconds % 60
        ).padStart(2, "0")}`;

    /* ==========================================
       MESSAGE STATUS
    ========================================== */

    const tick = (m: InboxMessage) => {
        if (m.direction !== "OUTBOUND") return "";

        const statusMap: Record<string, string> = {
            SENT: "✓",
            DELIVERED: "✓✓",
            READ: "✓✓",
            FAILED: "⚠",
        };

        return statusMap[m.status] || "…";
    };

    /* ==========================================
       FILTER CONVERSATIONS
    ========================================== */

    const filteredConvs = convs.filter(
        (c) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.toLowerCase().includes(search.toLowerCase())
    );

    /* ==========================================
       JSX
    ========================================== */

    return (
        <div className="wa-app">

            {/* SIDEBAR */}

            <aside className="wa-sidebar">

                <div className="wa-sidebar-top">
                    <div className="wa-profile">

                        <div className="wa-profile-avatar">
                            <i className="bi bi-person-fill"></i>
                        </div>

                        <div className="wa-profile-title">
                            <strong>WhatsApp Inbox</strong>
                            <span>Business conversations</span>
                        </div>

                        <div className="wa-top-actions">
                            <button type="button" title="New chat">
                                <i className="bi bi-chat-square-plus"></i>
                            </button>
                        </div>

                    </div>
                </div>

                <div className="wa-search-area">
                    <div className="wa-search-box">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search or start a new chat"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="wa-filter-area">
                    <span className="wa-filter-active">All</span>
                    <span>Unread</span>
                    <span>Favorites</span>
                </div>

                <div className="wa-conversation-list">

                    {filteredConvs.map((c) => {
                        const rem = remainingFor(c, now);

                        return (
                            <div
                                key={c.phone}
                                className={`wa-conversation ${
                                    active?.phone === c.phone
                                        ? "wa-conversation-active"
                                        : ""
                                }`}
                                onClick={() => open(c)}
                            >
                                <div className="wa-contact-avatar">
                                    {getInitials(c.name)}
                                </div>

                                <div className="wa-conversation-content">

                                    <div className="wa-conversation-heading">
                                        <strong>
                                            {c.name || c.phone}
                                        </strong>
                                    </div>

                                    <div className="wa-conversation-preview">
                                        <span>
                                            {c.lastDirection === "OUTBOUND" && (
                                                <i className="bi bi-check2-all wa-preview-tick"></i>
                                            )}

                                            {c.lastMessage || "No messages yet"}
                                        </span>

                                        {c.unreadCount > 0 && (
                                            <span className="wa-unread-badge">
                                                {c.unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="wa-conversation-phone">
                                        +{c.phone}

                                        <span
                                            className={`wa-window-tag ${
                                                rem > 0
                                                    ? "wa-window-tag-open"
                                                    : "wa-window-tag-closed"
                                            }`}
                                        >
                                            <i className="bi bi-clock"></i>

                                            {rem > 0
                                                ? `${formatRemaining(rem)} left`
                                                : "Window closed"}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {filteredConvs.length === 0 && (
                        <div className="wa-no-conversations">
                            <div className="wa-no-chat-icon">
                                <i className="bi bi-chat-dots"></i>
                            </div>

                            <strong>No conversations found</strong>

                            <span>
                                {search
                                    ? "Try searching with another name or number."
                                    : "Your conversations will appear here."}
                            </span>
                        </div>
                    )}

                </div>

                <div className="wa-sidebar-footer">
                    <i className="bi bi-lock-fill"></i>
                    Your conversations are private
                </div>

            </aside>

            {/* CHAT PANEL */}

            <section className="wa-chat-panel">

                {active ? (
                    <>

                        <header className="wa-chat-header">

                            <div className="wa-chat-contact">
                                <div className="wa-contact-avatar wa-header-avatar">
                                    {getInitials(active.name)}
                                </div>

                                <div className="wa-chat-contact-info">
                                    <strong>
                                        {active.name || active.phone}
                                    </strong>

                                    <span>
                                        +{active.phone}
                                        {" · "}
                                        {windowOpen
                                            ? `${formatRemaining(remainingMs)} left to reply`
                                            : "reply window closed"}
                                    </span>
                                </div>
                            </div>

                            <div className="wa-chat-header-actions">
                                <button
                                    type="button"
                                    title="Search messages"
                                >
                                    <i className="bi bi-search"></i>
                                </button>

                                <button
                                    type="button"
                                    title="More options"
                                >
                                    <i className="bi bi-three-dots-vertical"></i>
                                </button>
                            </div>

                        </header>

                        {/* CHAT MESSAGES */}

                        <div className="wa-chat-messages">

                            <div className="wa-encryption-notice">
                                <i className="bi bi-lock-fill"></i>
                                Messages are displayed in your WhatsApp Business inbox.
                            </div>

                            {msgs.map((m) => {
                                const isTemplate =
                                    m.messageType === "TEMPLATE";

                                const hasTemplateImage =
                                    isTemplate &&
                                    m.headerType?.toUpperCase() === "IMAGE" &&
                                    !!m.headerMediaUrl;

                                return (
                                    <div
                                        key={m.id}
                                        className={`wa-message-row ${
                                            m.direction === "OUTBOUND"
                                                ? "wa-message-outgoing"
                                                : "wa-message-incoming"
                                        }`}
                                    >

                                        <div
                                            className={`wa-message-bubble ${
                                                isTemplate
                                                    ? "wa-template-message-bubble"
                                                    : ""
                                            }`}
                                        >

                                            {/* TEMPLATE IMAGE HEADER */}

                                            {hasTemplateImage && (
                                                <TemplateHeaderMedia
                                                    imageUrl={m.headerMediaUrl!}
                                                />
                                            )}

                                            {/* NORMAL IMAGE / AUDIO / VIDEO */}

                                            {m.mediaId && (
                                                <MediaBubble m={m} />
                                            )}

                                            {/* ACTUAL MESSAGE BODY */}

                                            {m.text && (
                                                <div className="wa-message-text">
                                                    {m.text}
                                                </div>
                                            )}

                                            {m.errorMessage && (
                                                <div className="wa-message-error">
                                                    <i className="bi bi-exclamation-circle"></i>
                                                    {m.errorMessage}
                                                </div>
                                            )}

                                            <div className="wa-message-meta">
                                                <span>
                                                    {formatMessageTime(m.createdAt)}
                                                </span>

                                                {m.direction === "OUTBOUND" && (
                                                    <span
                                                        className={`wa-message-tick ${
                                                            m.status === "READ"
                                                                ? "wa-tick-read"
                                                                : m.status === "FAILED"
                                                                    ? "wa-tick-failed"
                                                                    : ""
                                                        }`}
                                                    >
                                                        {tick(m)}
                                                    </span>
                                                )}
                                            </div>

                                        </div>

                                    </div>
                                );
                            })}

                            <div ref={bottom} />

                        </div>

                        {error && (
                            <div className="wa-chat-error">
                                <i className="bi bi-exclamation-circle-fill"></i>
                                {error}
                            </div>
                        )}

                        {windowOpen ? (
                            <div className="wa-window-info">
                                <i className="bi bi-clock"></i>
                                Reply window open: {formatRemaining(remainingMs)} left
                            </div>
                        ) : (
                            <div className="wa-window-closed">
                                <i className="bi bi-clock-history"></i>
                                24-hour window closed. You can reply only after
                                the customer messages you again, or send an
                                approved template.
                            </div>
                        )}

                        {/* IMAGE PREVIEW */}

                        {pendingImage && (
                            <div className="wa-image-preview">
                                <img
                                    src={previewUrl}
                                    alt="Selected attachment"
                                />

                                <span>{pendingImage.name}</span>

                                <button
                                    type="button"
                                    onClick={clearImage}
                                    title="Remove image"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        )}

                        {/* COMPOSER */}

                        <footer className="wa-composer">

                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/jpeg,image/png"
                                hidden
                                onChange={pickImage}
                            />

                            {recording ? (
                                <>
                                    <button
                                        type="button"
                                        className="wa-composer-icon"
                                        title="Cancel recording"
                                        onClick={() => stopRecording(true)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>

                                    <div className="wa-recording">
                                        <span className="wa-rec-dot" />
                                        Recording {fmtSecs(recSecs)}
                                    </div>

                                    <button
                                        className="wa-send-button"
                                        title="Send voice message"
                                        onClick={() => stopRecording(false)}
                                    >
                                        <i className="bi bi-send-fill"></i>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="wa-composer-actions">

                                        <button
                                            type="button"
                                            title="Emoji"
                                            className="wa-composer-icon"
                                        >
                                            <i className="bi bi-emoji-smile"></i>
                                        </button>

                                        <button
                                            type="button"
                                            title="Attach image"
                                            className="wa-composer-icon"
                                            disabled={!windowOpen}
                                            onClick={() => fileInput.current?.click()}
                                        >
                                            <i className="bi bi-plus-lg"></i>
                                        </button>

                                        <button
                                            type="button"
                                            className="wa-template-bottom-button"
                                            title="Send approved WhatsApp template"
                                            onClick={openTemplateModal}
                                        >
                                            <i className="bi bi-file-earmark-text"></i>
                                            <span>Template</span>
                                            <i className="bi bi-chevron-down wa-template-bottom-arrow"></i>
                                        </button>

                                    </div>

                                    <div className="wa-input-wrapper">
                                        <input
                                            value={text}
                                            disabled={!windowOpen}
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    send();
                                                }
                                            }}
                                            placeholder={
                                                windowOpen
                                                    ? pendingImage
                                                        ? "Add a caption"
                                                        : "Type a message"
                                                    : "Window closed - template only"
                                            }
                                        />
                                    </div>

                                    {text.trim() || pendingImage ? (
                                        <button
                                            className="wa-send-button"
                                            onClick={send}
                                            disabled={!windowOpen}
                                            title="Send message"
                                        >
                                            <i className="bi bi-send-fill"></i>
                                        </button>
                                    ) : (
                                        <button
                                            className="wa-send-button"
                                            onClick={startRecording}
                                            disabled={!windowOpen}
                                            title="Record voice message"
                                        >
                                            <i className="bi bi-mic-fill"></i>
                                        </button>
                                    )}
                                </>
                            )}

                        </footer>

                    </>
                ) : (

                    <div className="wa-welcome-screen">
                        <div className="wa-welcome-content">

                            <div className="wa-welcome-icon">
                                <i className="bi bi-whatsapp"></i>
                            </div>

                            <h2>WhatsApp Business Inbox</h2>

                            <p>
                                Send and receive messages with your customers
                                directly from your business inbox.
                            </p>

                            <div className="wa-welcome-divider"></div>

                            <span>
                                <i className="bi bi-lock-fill"></i>
                                Your conversations are securely managed.
                            </span>

                        </div>

                        <div className="wa-welcome-bottom">
                            <i className="bi bi-laptop"></i>
                            Stay connected with your customers
                        </div>
                    </div>

                )}

            </section>

            {/* SEND TEMPLATE MODAL */}

            {showTemplateModal && active && (
                <div
                    className="wa-template-overlay"
                    onClick={() => {
                        if (!sendingTemplate) {
                            setShowTemplateModal(false);
                        }
                    }}
                >

                    <div
                        className="wa-template-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="wa-template-modal-header">
                            <div>
                                <h3>
                                    <i className="bi bi-file-earmark-text"></i>
                                    Send WhatsApp Template
                                </h3>

                                <p>
                                    Send an approved template to this customer.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={sendingTemplate}
                                onClick={() => setShowTemplateModal(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="wa-template-modal-body">

                            <div className="wa-template-recipient">
                                <i className="bi bi-person-circle"></i>

                                <div>
                                    <strong>
                                        {active.name || "Customer"}
                                    </strong>

                                    <span>+{active.phone}</span>
                                </div>
                            </div>

                            <div className="wa-template-field">
                                <label>Select approved template</label>

                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => selectTemplate(e.target.value)}
                                    disabled={loadingTemplates || sendingTemplate}
                                >
                                    <option value="">
                                        {loadingTemplates
                                            ? "Loading templates..."
                                            : "Choose a template"}
                                    </option>

                                    {approvedTemplates.map((template) => (
                                        <option
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {template.name} ({template.language})
                                        </option>
                                    ))}
                                </select>

                                {!loadingTemplates &&
                                    approvedTemplates.length === 0 && (
                                        <small className="wa-template-help">
                                            No approved templates found.
                                            Create and approve a template first.
                                        </small>
                                    )}
                            </div>

                            {selectedTemplate && (
                                <>
                                    <div className="wa-template-details">
                                        <div>
                                            <span>Template</span>
                                            <strong>{selectedTemplate.name}</strong>
                                        </div>

                                        <div>
                                            <span>Language</span>
                                            <strong>{selectedTemplate.language}</strong>
                                        </div>

                                        <div>
                                            <span>Category</span>
                                            <strong>{selectedTemplate.category}</strong>
                                        </div>
                                    </div>

                                    {/* TEXT HEADER */}

                                    {selectedTemplate.headerType?.toUpperCase() === "TEXT" &&
                                        selectedTemplate.headerText && (
                                            <div className="wa-template-preview">
                                                <span>HEADER</span>
                                                <strong>
                                                    {selectedTemplate.headerText}
                                                </strong>
                                            </div>
                                        )}

                                    {/* IMAGE HEADER */}

                                    {selectedTemplate.headerType?.toUpperCase() === "IMAGE" &&
                                        selectedTemplate.headerMediaUrl && (
                                            <div className="wa-template-preview">
                                                <span>IMAGE HEADER</span>

                                                <img
                                                    src={selectedTemplate.headerMediaUrl}
                                                    alt="Template header preview"
                                                    className="wa-media-image"
                                                />
                                            </div>
                                        )}

                                    {/* VIDEO HEADER */}

                                    {selectedTemplate.headerType?.toUpperCase() === "VIDEO" &&
                                        selectedTemplate.headerMediaUrl && (
                                            <div className="wa-template-preview">
                                                <span>VIDEO HEADER</span>

                                                <video
                                                    src={selectedTemplate.headerMediaUrl}
                                                    controls
                                                    className="wa-media-video"
                                                />
                                            </div>
                                        )}

                                    {/* DOCUMENT HEADER */}

                                    {selectedTemplate.headerType?.toUpperCase() === "DOCUMENT" && (
                                        <div className="wa-template-preview">
                                            <span>DOCUMENT HEADER</span>

                                            <div className="wa-document-link">
                                                <i className="bi bi-file-earmark-pdf" />
                                                {selectedTemplate.headerMediaUrl
                                                    ? "Document attached"
                                                    : "Document header"}
                                            </div>
                                        </div>
                                    )}

                                    {/* BODY PREVIEW */}

                                    <div className="wa-template-preview">
                                        <span>MESSAGE PREVIEW</span>

                                        <p>{templatePreview}</p>

                                        {selectedTemplate.footerText && (
                                            <small>{selectedTemplate.footerText}</small>
                                        )}
                                    </div>

                                    {/* BODY VARIABLES */}

                                    {bodyVariableNumbers.length > 0 && (
                                        <div className="wa-template-variables">
                                            <h4>
                                                <i className="bi bi-braces"></i>
                                                Template variables
                                            </h4>

                                            <p>
                                                Enter the values to replace
                                                each variable in the message.
                                            </p>

                                            {bodyVariableNumbers.map((number, index) => (
                                                <div
                                                    className="wa-template-field"
                                                    key={number}
                                                >
                                                    <label>
                                                        Variable {"{{"}{number}{"}}"}
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={templateParameters[index] || ""}
                                                        onChange={(e) =>
                                                            updateTemplateParameter(
                                                                index,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder={`Enter value for {{${number}}}`}
                                                        disabled={sendingTemplate}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {unsupportedTemplateReason && (
                                        <div className="wa-template-warning">
                                            <i className="bi bi-exclamation-triangle"></i>
                                            {unsupportedTemplateReason}
                                        </div>
                                    )}
                                </>
                            )}

                            {templateError && (
                                <div className="wa-template-error">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {templateError}
                                </div>
                            )}

                        </div>

                        <div className="wa-template-modal-footer">
                            <button
                                type="button"
                                className="wa-template-cancel"
                                disabled={sendingTemplate}
                                onClick={() => setShowTemplateModal(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="wa-template-send"
                                disabled={
                                    sendingTemplate ||
                                    loadingTemplates ||
                                    !selectedTemplate ||
                                    !!unsupportedTemplateReason ||
                                    templateParameters.some(
                                        (parameter) => !parameter.trim()
                                    )
                                }
                                onClick={sendTemplate}
                            >
                                {sendingTemplate ? (
                                    <>
                                        <span className="wa-template-spinner"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-send-fill"></i>
                                        Send Template
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}