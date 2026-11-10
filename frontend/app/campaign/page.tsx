
"use client";

import "./campaign.css";
import campaignService, {
    CampaignMessage,
    CampaignResponse,
} from "@/app/apiservice/campaignservice";
import { apiError } from "@/app/utils/apiError";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STATUSES = ["ALL", "RUNNING", "COMPLETED", "FAILED"];
const MSG_FILTERS = ["ALL", "PENDING", "SENT", "DELIVERED", "READ", "FAILED"];

const fmt = (d: string | null) =>
    d
        ? new Date(d).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "-";

export default function CampaignsPage() {
    const [items, setItems] = useState<CampaignResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("ALL");
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [msgs, setMsgs] = useState<CampaignMessage[]>([]);
    const [msgFilter, setMsgFilter] = useState("ALL");
    const [resuming, setResuming] = useState(false);

    const loadList = async () => {
        try {
            setItems(await campaignService.list());
            setError("");
        } catch (e) {
            setError(apiError(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadList();

        const interval = setInterval(loadList, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedId == null) return;

        const loadMessages = () => {
            campaignService
                .messages(selectedId)
                .then(setMsgs)
                .catch(() => {});
        };

        loadMessages();

        const interval = setInterval(loadMessages, 4000);

        return () => clearInterval(interval);
    }, [selectedId]);

    const selected =
        items.find((c) => c.id === selectedId) || null;

    const open = (c: CampaignResponse) => {
        setSelectedId(c.id);
        setMsgs([]);
        setMsgFilter("ALL");
    };

    const close = () => setSelectedId(null);

    const resume = async () => {
        if (!selected) return;

        setResuming(true);

        try {
            await campaignService.resume(selected.id);
            await loadList();

            const updatedMessages = await campaignService.messages(
                selected.id
            );

            setMsgs(updatedMessages);
        } catch (e) {
            setError(apiError(e));
        } finally {
            setResuming(false);
        }
    };

    const stats = useMemo(() => {
        const sum = (
            fn: (c: CampaignResponse) => number
        ) =>
            items.reduce(
                (total, c) => total + (fn(c) || 0),
                0
            );

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
        {
            label: "Total campaigns",
            value: stats.campaigns,
            hint: `${stats.contacts} contacts targeted`,
            tone: "blue",
        },
        {
            label: "Messages sent",
            value: stats.sent,
            hint: `${stats.pending} still pending`,
            tone: "green",
        },
        {
            label: "Unread",
            value: stats.unread,
            hint: "Sent, not opened yet",
            tone: "amber",
        },
        {
            label: "Read",
            value: stats.read,
            hint: "Opened by contacts",
            tone: "green",
        },
        {
            label: "Responses",
            value: stats.replies,
            hint: "Replies received",
            tone: "purple",
        },
        {
            label: "Failed",
            value: stats.failed,
            hint: "Not delivered",
            tone: "red",
        },
    ];

    const shown = useMemo(() => {
        const search = q.trim().toLowerCase();

        return [...items]
            .sort((a, b) => b.id - a.id)
            .filter(
                (c) =>
                    (status === "ALL" || c.status === status) &&
                    (!search ||
                        c.name.toLowerCase().includes(search) ||
                        (c.templateName || "")
                            .toLowerCase()
                            .includes(search))
            );
    }, [items, q, status]);

    const shownMsgs =
        msgFilter === "ALL"
            ? msgs
            : msgs.filter((m) => m.status === msgFilter);

    const pct = (c: CampaignResponse) =>
        c.total
            ? Math.round(
                  ((c.total - c.pending) / c.total) * 100
              )
            : 0;

    return (
        <div className="cmp-page">
            <div className="cmp-top">
                <h1 style={{ margin: 0 }}>Campaigns</h1>

                <Link
                    href="/campaign/create"
                    className="cmp-btn"
                >
                    + Create campaign
                </Link>
            </div>

            {error && (
                <div className="cmp-alert">
                    {error}
                </div>
            )}

            <div className="cmp-cards">
                {cards.map((card) => (
                    <div
                        className={`cmp-card cmp-tone-${card.tone}`}
                        key={card.label}
                    >
                        <span className="cmp-card-label">
                            {card.label}
                        </span>

                        <b>{card.value}</b>

                        <small>{card.hint}</small>
                    </div>
                ))}
            </div>

            <div className="cmp-list-head">
                <input
                    className="cmp-search"
                    placeholder="Search campaign or template…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            <div className="cmp-table-wrap">
                <table className="cmp-table">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Template</th>
                            <th>Status</th>
                            <th>Progress</th>
                            <th>Total</th>
                            <th>Sent</th>
                            <th>Unread</th>
                            <th>Read</th>
                            <th>Replies</th>
                            <th>Failed</th>
                            <th>Launch time</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={11} className="cmp-empty">
                                    Loading…
                                </td>
                            </tr>
                        )}

                        {!loading && shown.length === 0 && (
                            <tr>
                                <td colSpan={11} className="cmp-empty">
                                    No campaigns yet.{" "}
                                    <Link href="/campaign/create">
                                        Create your first campaign
                                    </Link>
                                </td>
                            </tr>
                        )}

                        {shown.map((c) => (
                            <tr
                                key={c.id}
                                className={`cmp-row ${
                                    selectedId === c.id ? "on" : ""
                                }`}
                                onClick={() => open(c)}
                            >
                                <td>
                                    <strong>{c.name}</strong>
                                </td>

                                <td className="cmp-mono">
                                    {c.templateName}
                                </td>

                                <td>
                                    <span
                                        className={`cmp-badge cmp-${c.status.toLowerCase()}`}
                                    >
                                        {c.status}
                                    </span>
                                </td>

                                <td>
                                    <div className="cmp-mini">
                                        <div
                                            style={{
                                                width: `${pct(c)}%`,
                                            }}
                                        />
                                    </div>
                                    <small>{pct(c)}%</small>
                                </td>

                                <td>{c.total}</td>
                                <td>{c.sent}</td>
                                <td>{c.sent - c.read}</td>
                                <td>{c.read}</td>
                                <td>{c.replied}</td>

                                <td className={c.failed ? "cmp-err" : ""}>
                                    {c.failed}
                                </td>

                                <td className="cmp-mono">
                                    {fmt(c.createdAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected && (
                <>
                    <div
                        className="cmp-overlay"
                        onClick={close}
                    />

                    <aside className="cmp-drawer">
                        <header className="cmp-drawer-head">
                            <div>
                                <h2>{selected.name}</h2>

                                <span
                                    className={`cmp-badge cmp-${selected.status.toLowerCase()}`}
                                >
                                    {selected.status}
                                </span>

                                <p className="cmp-sub">
                                    Template:{" "}
                                    <strong>
                                        {selected.templateName}
                                    </strong>
                                    {" · "}
                                    Created {fmt(selected.createdAt)}
                                </p>

                                <p className="cmp-sub">
                                    Launch time:{" "}
                                    <strong>
                                        {fmt(selected.createdAt)}
                                    </strong>
                                </p>
                            </div>

                            <button
                                className="cmp-close"
                                onClick={close}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </header>

                        <div className="cmp-drawer-body">
                            <div className="cmp-progress">
                                <div
                                    style={{
                                        width: `${pct(selected)}%`,
                                    }}
                                />
                            </div>

                            <p className="cmp-sub">
                                {pct(selected)}% processed ·{" "}
                                {selected.pending} pending

                                {selected.pending > 0 &&
                                    selected.status !== "RUNNING" &&
                                    selected.status !== "COMPLETED" && (
                                        <button
                                            className="cmp-link"
                                            disabled={resuming}
                                            onClick={resume}
                                        >
                                            {resuming
                                                ? "Resuming…"
                                                : "Resume sending"}
                                        </button>
                                    )}
                            </p>

                            <div className="cmp-mini-cards">
                                <div>
                                    <b>{selected.total}</b>
                                    <span>Total</span>
                                </div>

                                <div>
                                    <b>{selected.sent}</b>
                                    <span>Sent</span>
                                </div>

                                <div>
                                    <b>{selected.sent - selected.read}</b>
                                    <span>Unread</span>
                                </div>

                                <div>
                                    <b>{selected.read}</b>
                                    <span>Read</span>
                                </div>

                                <div>
                                    <b>{selected.replied}</b>
                                    <span>Replies</span>
                                </div>

                                <div>
                                    <b>{selected.failed}</b>
                                    <span>Failed</span>
                                </div>
                            </div>

                            <div className="cmp-list-head">
                                <h3>Recipients</h3>

                                <select
                                    value={msgFilter}
                                    onChange={(e) =>
                                        setMsgFilter(e.target.value)
                                    }
                                >
                                    {MSG_FILTERS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="cmp-table-wrap">
                                <table className="cmp-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Sent</th>
                                            <th>Error</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {shownMsgs.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="cmp-empty"
                                                >
                                                    No messages
                                                </td>
                                            </tr>
                                        )}

                                        {shownMsgs.map((m) => (
                                            <tr key={m.id}>
                                                <td>{m.recipientName}</td>
                                                <td>{m.recipientPhone}</td>

                                                <td>
                                                    <span
                                                        className={`cmp-badge cmp-${m.status.toLowerCase()}`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </td>

                                                <td>
                                                    {m.sentAt
                                                        ? new Date(
                                                              m.sentAt
                                                          ).toLocaleTimeString()
                                                        : "-"}
                                                </td>

                                                <td className="cmp-err">
                                                    {m.errorMessage || "-"}
                                                </td>
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
