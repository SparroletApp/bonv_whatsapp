"use client";

import "./campaign.css";
import campaignService, { CampaignMessage, CampaignResponse } from "@/app/apiservice/campaignservice";
import { apiError } from "@/app/utils/apiError";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STATUSES = ["ALL", "RUNNING", "COMPLETED", "FAILED"];
const MSG_FILTERS = ["ALL", "PENDING", "SENT", "DELIVERED", "READ", "FAILED"];

const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

export default function CampaignsPage() {
    const [items, setItems] = useState<CampaignResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("ALL");

    // selected campaign (side panel)
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [msgs, setMsgs] = useState<CampaignMessage[]>([]);
    const [msgFilter, setMsgFilter] = useState("ALL");
    const [resuming, setResuming] = useState(false);

    const loadList = async () => {
        try { setItems(await campaignService.list()); setError(""); }
        catch (e) { setError(apiError(e)); }
        setLoading(false);
    };

    useEffect(() => {
        loadList();
        const t = setInterval(loadList, 5000);                  // live counts
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (selectedId == null) return;
        const load = () => campaignService.messages(selectedId).then(setMsgs).catch(() => {});
        load();
        const t = setInterval(load, 4000);
        return () => clearInterval(t);
    }, [selectedId]);

    const selected = items.find((c) => c.id === selectedId) || null;

    const open = (c: CampaignResponse) => { setSelectedId(c.id); setMsgs([]); setMsgFilter("ALL"); };
    const close = () => setSelectedId(null);

    const resume = async () => {
        if (!selected) return;
        setResuming(true);
        try { await campaignService.resume(selected.id); await loadList(); }
        catch (e) { setError(apiError(e)); }
        finally { setResuming(false); }
    };

    // totals across all campaigns (sent/delivered are cumulative on the backend)
    const t = useMemo(() => {
        const sum = (f: (c: CampaignResponse) => number) => items.reduce((s, c) => s + (f(c) || 0), 0);
        return {
            campaigns: items.length,
            contacts: sum((c) => c.total),
            sent: sum((c) => c.sent),
            unread: sum((c) => c.sent - c.read),
            read: sum((c) => c.read),
            replies: sum((c) => c.replied),
            failed: sum((c) => c.failed),
            pending: sum((c) => c.pending),
        };
    }, [items]);

    const cards = [
        { label: "Total campaigns", value: t.campaigns, hint: `${t.contacts} contacts targeted`, tone: "blue" },
        { label: "Messages sent", value: t.sent, hint: `${t.pending} still pending`, tone: "green" },
        { label: "Unread", value: t.unread, hint: "sent, not opened yet", tone: "amber" },
        { label: "Read", value: t.read, hint: "opened by contacts", tone: "green" },
        { label: "Responses", value: t.replies, hint: "replies received", tone: "purple" },
        { label: "Failed", value: t.failed, hint: "not delivered", tone: "red" },
    ];

    const shown = useMemo(() => {
        const s = q.trim().toLowerCase();
        return [...items]
            .sort((a, b) => b.id - a.id)
            .filter((c) =>
                (status === "ALL" || c.status === status) &&
                (!s || c.name.toLowerCase().includes(s) || (c.templateName || "").toLowerCase().includes(s))
            );
    }, [items, q, status]);

    const shownMsgs = msgFilter === "ALL" ? msgs : msgs.filter((m) => m.status === msgFilter);
    const pct = (c: CampaignResponse) => (c.total ? Math.round(((c.total - c.pending) / c.total) * 100) : 0);

    return (
        <div className="cmp-page">
            <div className="cmp-top">
                <h1 style={{ margin: 0 }}>Campaigns</h1>
                <Link href="/campaign/create" className="cmp-btn">+ Create campaign</Link>
            </div>

            {error && <div className="cmp-alert">{error}</div>}

            <div className="cmp-cards">
                {cards.map((x) => (
                    <div className={`cmp-card cmp-tone-${x.tone}`} key={x.label}>
                        <span className="cmp-card-label">{x.label}</span>
                        <b>{x.value}</b>
                        <small>{x.hint}</small>
                    </div>
                ))}
            </div>

            <div className="cmp-list-head">
                <input className="cmp-search" placeholder="Search campaign or template…"
                       value={q} onChange={(e) => setQ(e.target.value)} />
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* ---------- all campaigns ---------- */}
            <div className="cmp-table-wrap">
                <table className="cmp-table">
                    <thead>
                    <tr>
                        <th>Campaign</th><th>Template</th><th>Status</th><th>Progress</th>
                        <th>Total</th><th>Sent</th><th>Unread</th><th>Read</th><th>Replies</th><th>Failed</th><th>Created</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && <tr><td colSpan={11} className="cmp-empty">Loading…</td></tr>}
                    {!loading && shown.length === 0 && (
                        <tr><td colSpan={11} className="cmp-empty">
                            No campaigns yet. <Link href="/campaigns/create">Create your first campaign</Link>
                        </td></tr>
                    )}
                    {shown.map((c) => (
                        <tr key={c.id}
                            className={`cmp-row ${selectedId === c.id ? "on" : ""}`}
                            onClick={() => open(c)}>
                            <td><strong>{c.name}</strong></td>
                            <td className="cmp-mono">{c.templateName}</td>
                            <td><span className={`cmp-badge cmp-${c.status.toLowerCase()}`}>{c.status}</span></td>
                            <td>
                                <div className="cmp-mini"><div style={{ width: `${pct(c)}%` }} /></div>
                                <small>{pct(c)}%</small>
                            </td>
                            <td>{c.total}</td>
                            <td>{c.sent}</td>
                            <td>{c.sent - c.read}</td>
                            <td>{c.read}</td>
                            <td>{c.replied}</td>
                            <td className={c.failed ? "cmp-err" : ""}>{c.failed}</td>
                            <td className="cmp-mono">{fmt(c.createdAt)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* ---------- view panel ---------- */}
            {selected && (
                <>
                    <div className="cmp-overlay" onClick={close} />
                    <aside className="cmp-drawer">
                        <header className="cmp-drawer-head">
                            <div>
                                <h2>{selected.name}</h2>
                                <span className={`cmp-badge cmp-${selected.status.toLowerCase()}`}>{selected.status}</span>
                                <p className="cmp-sub">Template: <strong>{selected.templateName}</strong> · {fmt(selected.createdAt)}</p>
                            </div>
                            <button className="cmp-close" onClick={close} aria-label="Close">✕</button>
                        </header>

                        <div className="cmp-drawer-body">
                            <div className="cmp-progress"><div style={{ width: `${pct(selected)}%` }} /></div>
                            <p className="cmp-sub">
                                {pct(selected)}% processed · {selected.pending} pending
                                {selected.pending > 0 && selected.status !== "RUNNING" && (
                                    <button className="cmp-link" disabled={resuming} onClick={resume}>
                                        {resuming ? "Resuming…" : "Resume sending"}
                                    </button>
                                )}
                            </p>

                            <div className="cmp-mini-cards">
                                <div><b>{selected.total}</b><span>Total</span></div>
                                <div><b>{selected.sent}</b><span>Sent</span></div>
                                <div><b>{selected.sent - selected.read}</b><span>Unread</span></div>
                                <div><b>{selected.read}</b><span>Read</span></div>
                                <div><b>{selected.replied}</b><span>Replies</span></div>
                                <div><b>{selected.failed}</b><span>Failed</span></div>
                            </div>

                            <div className="cmp-list-head">
                                <h3>Recipients</h3>
                                <select value={msgFilter} onChange={(e) => setMsgFilter(e.target.value)}>
                                    {MSG_FILTERS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="cmp-table-wrap">
                                <table className="cmp-table">
                                    <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Sent</th><th>Error</th></tr></thead>
                                    <tbody>
                                    {shownMsgs.length === 0 && <tr><td colSpan={5} className="cmp-empty">No messages</td></tr>}
                                    {shownMsgs.map((m) => (
                                        <tr key={m.id}>
                                            <td>{m.recipientName}</td>
                                            <td>{m.recipientPhone}</td>
                                            <td><span className={`cmp-badge cmp-${m.status.toLowerCase()}`}>{m.status}</span></td>
                                            <td>{m.sentAt ? new Date(m.sentAt).toLocaleTimeString() : "-"}</td>
                                            <td className="cmp-err">{m.errorMessage}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
}