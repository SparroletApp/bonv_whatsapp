import { useEffect, useRef, useState } from "react";
import { apiError } from "../utils/apiError";
import inboxService, { Conversation, InboxMessage } from "../apiservice/inboxservice";

export default function InboxPage() {
    const [convs, setConvs] = useState<Conversation[]>([]);
    const [active, setActive] = useState<Conversation | null>(null);
    const [msgs, setMsgs] = useState<InboxMessage[]>([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const bottom = useRef<HTMLDivElement>(null);

    const loadConvs = () => inboxService.conversations().then(setConvs).catch(() => {});
    const loadMsgs = (phone: string) => inboxService.messages(phone).then(setMsgs).catch(() => {});

    // poll every 5s (swap for WebSocket/SSE later if you want true real-time)
    useEffect(() => {
        loadConvs();
        const t = setInterval(() => {
            loadConvs();
            if (active) loadMsgs(active.phone);
        }, 5000);
        return () => clearInterval(t);
    }, [active?.phone]);

    useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

    const open = async (c: Conversation) => {
        setActive(c);
        setError("");
        await loadMsgs(c.phone);
        if (c.unreadCount > 0) { await inboxService.markRead(c.phone); loadConvs(); }
    };

    const send = async () => {
        if (!active || !text.trim()) return;
        setError("");
        try {
            await inboxService.reply(active.phone, text.trim());
            setText("");
            loadMsgs(active.phone);
            loadConvs();
        } catch (e) { setError(apiError(e)); }
    };

    const tick = (m: InboxMessage) =>
        m.direction === "OUTBOUND"
            ? ({ SENT: "✓", DELIVERED: "✓✓", READ: "✓✓ (read)", FAILED: "⚠ failed" } as any)[m.status] || "…"
            : "";

    return (
        <div className="wa-inbox">
            <aside className="wa-inbox-list">
                <h3>Inbox</h3>
                {convs.map((c) => (
                    <div key={c.phone} className={`wa-conv ${active?.phone === c.phone ? "on" : ""}`} onClick={() => open(c)}>
                        <div className="wa-row wa-between">
                            <strong>{c.name}</strong>
                            {c.unreadCount > 0 && <span className="wa-unread">{c.unreadCount}</span>}
                        </div>
                        <small>{c.phone}</small>
                        <div className="wa-conv-last">{c.lastDirection === "OUTBOUND" ? "You: " : ""}{c.lastMessage}</div>
                    </div>
                ))}
                {convs.length === 0 && <p>No conversations yet.</p>}
            </aside>

            <section className="wa-chat">
                {active ? (
                    <>
                        <header><strong>{active.name}</strong> <small>+{active.phone}</small></header>
                        <div className="wa-chat-body">
                            {msgs.map((m) => (
                                <div key={m.id} className={`wa-msg ${m.direction === "OUTBOUND" ? "out" : "in"}`}>
                                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                                    {m.errorMessage && <div className="wa-err-cell">{m.errorMessage}</div>}
                                    <small>{new Date(m.createdAt).toLocaleTimeString()} {tick(m)}</small>
                                </div>
                            ))}
                            <div ref={bottom} />
                        </div>
                        {error && <div className="wa-error">{error}</div>}
                        <footer>
                            <input value={text} onChange={(e) => setText(e.target.value)}
                                   onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a reply…" />
                            <button className="wa-btn" onClick={send}>Send</button>
                        </footer>
                    </>
                ) : <div className="wa-empty">Select a conversation</div>}
            </section>
        </div>
    );
}