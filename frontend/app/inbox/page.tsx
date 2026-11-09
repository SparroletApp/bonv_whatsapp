"use client";

import { useEffect, useRef, useState } from "react";
import { apiError } from "../utils/apiError";
import inboxService, {
    Conversation,
    InboxMessage,
} from "../apiservice/inboxservice";

import "./inbox.css";

export default function InboxPage() {
    const [convs, setConvs] = useState<Conversation[]>([]);
    const [active, setActive] = useState<Conversation | null>(null);
    const [msgs, setMsgs] = useState<InboxMessage[]>([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [now, setNow] = useState<number>(0);

    const bottom = useRef<HTMLDivElement>(null);

    const formatMessageTime = (value: string) => {
    if (!value) return "";
    const date = new Date(
        value.endsWith("Z") ? value : `${value}Z`
    );
    return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

    const loadConvs = () =>
        inboxService.conversations().then(setConvs).catch(() => { });

    const loadMsgs = (phone: string) =>
        inboxService.messages(phone).then(setMsgs).catch(() => { });



    useEffect(() => {
        loadConvs();

        const t = setInterval(() => {
            loadConvs();
            if (active) loadMsgs(active.phone);
        }, 5000);

        return () => clearInterval(t);
    }, [active?.phone]);

    useEffect(() => {
        setNow(Date.now());

        const t = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        bottom.current?.scrollIntoView({ behavior: "smooth" });
    }, [msgs.length]);

    const remainingFor = (c?: Conversation | null) => {
        if (!c?.windowExpiresAt || !now) return 0;

        let expiry: number;

        if (typeof c.windowExpiresAt === "number") {
            // Support Unix seconds and milliseconds
            expiry =
                c.windowExpiresAt < 1000000000000
                    ? c.windowExpiresAt * 1000
                    : c.windowExpiresAt;
        } else {
            expiry = new Date(c.windowExpiresAt).getTime();
        }

        if (!Number.isFinite(expiry)) {
            console.error("Invalid windowExpiresAt:", c.windowExpiresAt);
            return 0;
        }

        return expiry - now;
    };

    const formatRemaining = (ms: number) => {
        if (ms <= 0) return "0m";

        const totalSeconds = Math.floor(ms / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const activeConv = convs.find((c) => c.phone === active?.phone) ?? active;
    const remainingMs = remainingFor(activeConv);
    const windowOpen = remainingMs > 0;

    const open = async (c: Conversation) => {
        setActive(c);
        setError("");

        await loadMsgs(c.phone);

        if (c.unreadCount > 0) {
            await inboxService.markRead(c.phone);
            loadConvs();
        }
    };

    const send = async () => {
        if (!active || !text.trim() || !windowOpen) return;

        setError("");

        try {
            await inboxService.reply(active.phone, text.trim());

            setText("");
            loadMsgs(active.phone);
            loadConvs();
        } catch (e) {
            setError(apiError(e));
        }
    };

    const tick = (m: InboxMessage) =>
        m.direction === "OUTBOUND"
            ? ({
                SENT: "✓",
                DELIVERED: "✓✓",
                READ: "✓✓",
                FAILED: "⚠",
            } as any)[m.status] || "…"
            : "";

    const getInitials = (name: string) =>
        name
            ?.split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase() || "?";

    const filteredConvs = convs.filter(
        (c) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.toLowerCase().includes(search.toLowerCase())
    );

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

                {/* FILTER */}
                <div className="wa-filter-area">
                    <span className="wa-filter-active">All</span>
                    <span>Unread</span>
                    <span>Favorites</span>
                </div>

                {/* CONVERSATIONS */}
                <div className="wa-conversation-list">

                    {filteredConvs.map((c) => {
                        const rem = remainingFor(c);

                        return (
                            <div
                                key={c.phone}
                                className={`wa-conversation ${active?.phone === c.phone
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
                                        <strong>{c.name || c.phone}</strong>
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
                                            className={`wa-window-tag ${rem > 0
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

                        {/* CHAT HEADER */}
                        <header className="wa-chat-header">

                            <div className="wa-chat-contact">

                                <div className="wa-contact-avatar wa-header-avatar">
                                    {getInitials(active.name)}
                                </div>

                                <div className="wa-chat-contact-info">
                                    <strong>{active.name || active.phone}</strong>
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
                                <button type="button" title="Search messages">
                                    <i className="bi bi-search"></i>
                                </button>

                                <button type="button" title="More options">
                                    <i className="bi bi-three-dots-vertical"></i>
                                </button>
                            </div>

                        </header>

                        {/* CHAT BODY */}
                        <div className="wa-chat-messages">

                            <div className="wa-encryption-notice">
                                <i className="bi bi-lock-fill"></i>
                                Messages are displayed in your WhatsApp Business inbox.
                            </div>

                            {msgs.map((m) => (
                                <div
                                    key={m.id}
                                    className={`wa-message-row ${m.direction === "OUTBOUND"
                                        ? "wa-message-outgoing"
                                        : "wa-message-incoming"
                                        }`}
                                >
                                    <div className="wa-message-bubble">

                                        <div className="wa-message-text">
                                            {m.text}
                                        </div>

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
                                                    className={`wa-message-tick ${m.status === "READ"
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
                            ))}

                            <div ref={bottom} />

                        </div>

                        {/* ERROR */}
                        {error && (
                            <div className="wa-chat-error">
                                <i className="bi bi-exclamation-circle-fill"></i>
                                {error}
                            </div>
                        )}

                        {/* 24H WINDOW STATUS */}
                        {windowOpen ? (
                            <div className="wa-window-info">
                                <i className="bi bi-clock"></i>
                                Reply window open: {formatRemaining(remainingMs)} left
                            </div>
                        ) : (
                            <div className="wa-window-closed">
                                <i className="bi bi-clock-history"></i>
                                24-hour window closed. You can reply only after the
                                customer messages you again, or send an approved
                                template.
                            </div>
                        )}

                        {/* MESSAGE COMPOSER */}
                        <footer className="wa-composer">

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
                                    title="Attach"
                                    className="wa-composer-icon"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                            </div>

                            <div className="wa-input-wrapper">
                                <input
                                    value={text}
                                    disabled={!windowOpen}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && send()
                                    }
                                    placeholder={
                                        windowOpen
                                            ? "Type a message"
                                            : "Window closed - template only"
                                    }
                                />
                            </div>

                            <button
                                className="wa-send-button"
                                onClick={send}
                                disabled={!text.trim() || !windowOpen}
                                title="Send message"
                            >
                                <i className="bi bi-send-fill"></i>
                            </button>

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

        </div>
    );
}