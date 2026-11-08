"use client";

import "./dashboard.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import campaignService, { CampaignResponse } from "@/app/apiservice/campaignservice";
import templateService, { TemplateResponse } from "@/app/apiservice/templateservice";
import inboxService, { Conversation } from "@/app/apiservice/inboxservice";
import categoryInsightService, { CategorySummary } from "@/app/apiservice/categoryinsightservice";

// change these if your page paths are different
const ROUTES = {
    campaigns: "/campaign",
    createCampaign: "/campaign/create",
    templates: "/templatepage",
    inbox: "/inbox",
    contacts: "/contacts",
};

const RANGES = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
    { label: "All time", days: 0 },
];

const num = (n: number) => n.toLocaleString("en-IN");

const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

function Dashboard() {
    const nav = useRouter();

    const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
    const [templates, setTemplates] = useState<TemplateResponse[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [days, setDays] = useState(30);

    const load = useCallback(async () => {
        setRefreshing(true);
        const [c, t, i, k] = await Promise.allSettled([
            campaignService.list(),
            templateService.list(),
            inboxService.conversations(),
            categoryInsightService.list(),
        ]);

        // one failing source must not blank the whole dashboard
        if (c.status === "fulfilled") setCampaigns(c.value);
        if (t.status === "fulfilled") setTemplates(t.value);
        if (i.status === "fulfilled") setConversations(i.value);
        if (k.status === "fulfilled") setCategories(k.value);

        const failed = [c, t, i, k].filter((r) => r.status === "rejected").length;
        setError(failed ? `${failed} of 4 data sources could not be loaded.` : "");
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(load, 15000);
        return () => clearInterval(timer);
    }, [load]);

    // campaigns inside the selected date range
    const inRange = useMemo(() => {
        if (!days) return campaigns;
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        return campaigns.filter((c) => new Date(c.createdAt).getTime() >= since);
    }, [campaigns, days]);

    const totals = useMemo(() => {
        const sum = (f: (c: CampaignResponse) => number) =>
            inRange.reduce((s, c) => s + (f(c) || 0), 0);
        const sent = sum((c) => c.sent);
        const delivered = sum((c) => c.delivered);
        const failed = sum((c) => c.failed);
        return {
            sent,
            delivered,
            failed,
            read: sum((c) => c.read),
            pending: sum((c) => c.pending),
            deliveryPct: sent ? Math.round((delivered / sent) * 100) : 0,
        };
    }, [inRange]);

    const contacts = useMemo(
        () => categories.reduce((s, c) => s + (c.contactCount || 0), 0),
        [categories]
    );
    const unread = useMemo(
        () => conversations.reduce((s, c) => s + (c.unreadCount || 0), 0),
        [conversations]
    );
    const unreadChats = conversations.filter((c) => c.unreadCount > 0).length;

    const approved = templates.filter((t) => t.status === "APPROVED").length;
    const pendingTpl = templates.filter((t) => t.status === "PENDING").length;

    const recent = useMemo(
        () => [...campaigns].sort((a, b) => b.id - a.id).slice(0, 5),
        [campaigns]
    );

    const stats = [
        {
            title: "Total Contacts",
            value: num(contacts),
            icon: "bi-people",
            type: "green",
            description: `Across ${categories.length} categor${categories.length === 1 ? "y" : "ies"}`,
            badge: `${categories.length} categories`,
        },
        {
            title: "Messages Sent",
            value: num(totals.sent),
            icon: "bi-send",
            type: "blue",
            description: `${inRange.length} campaign${inRange.length === 1 ? "" : "s"} in this period`,
            badge: `${num(totals.pending)} pending`,
        },
        {
            title: "Messages Delivered",
            value: num(totals.delivered),
            icon: "bi-check2-circle",
            type: "purple",
            description: `${num(totals.read)} read by contacts`,
            badge: `${totals.deliveryPct}%`,
        },
        {
            title: "Unread Messages",
            value: num(unread),
            icon: "bi-chat-dots",
            type: "orange",
            description: "Awaiting your response",
            badge: `${unreadChats} chat${unreadChats === 1 ? "" : "s"}`,
        },
    ];

    const failedPct = totals.sent + totals.failed
        ? Math.round((totals.failed / (totals.sent + totals.failed)) * 100)
        : 0;
    const circlePct = totals.sent + totals.failed
        ? Math.round((totals.delivered / (totals.sent + totals.failed)) * 100)
        : 0;

    return (
        <section className="dashboard">
            {/* ---------- header ---------- */}
            <div className="dashboard-header">
                <div>
                    <span className="dashboard-subtitle">OVERVIEW</span>
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's what's happening with your WhatsApp account.</p>
                </div>

                <div className="dashboard-header-actions">
                    <select
                        className="dashboard-date-btn dashboard-range"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                    >
                        {RANGES.map((r) => (
                            <option key={r.days} value={r.days}>{r.label}</option>
                        ))}
                    </select>

                    <button
                        className="dashboard-refresh-btn"
                        aria-label="Refresh"
                        onClick={load}
                        disabled={refreshing}
                    >
                        <i className={`bi bi-arrow-clockwise ${refreshing ? "spin" : ""}`}></i>
                    </button>
                </div>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            {/* ---------- stat cards ---------- */}
            <div className="dashboard-stats">
                {stats.map((item) => (
                    <div className="stat-card" key={item.title}>
                        <div className="stat-card-top">
                            <div className={`stat-icon ${item.type}`}>
                                <i className={`bi ${item.icon}`}></i>
                            </div>
                            <span className="stat-change">{item.badge}</span>
                        </div>

                        <div className="stat-info">
                            <p>{item.title}</p>
                            <h2>{loading ? "…" : item.value}</h2>
                            <span>{item.description}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ---------- create buttons + quick actions ---------- */}
            <div className="dashboard-middle">
                <div className="dashboard-panel analytics-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Get Started</h3>
                            <p>Create something new for your customers</p>
                        </div>
                    </div>

                    <div className="create-actions">
                        <button className="create-card campaign" onClick={() => nav.push(ROUTES.createCampaign)}>
                            <div className="create-card-icon">
                                <i className="bi bi-megaphone"></i>
                            </div>
                            <h4>Create Campaign</h4>
                            <p>Send an approved template to a group of contacts.</p>
                            <span className="create-card-meta">
                                {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} so far
                            </span>
                            <span className="create-card-cta">
                                + New campaign <i className="bi bi-arrow-right"></i>
                            </span>
                        </button>

                        <button className="create-card template" onClick={() => nav.push(ROUTES.templates)}>
                            <div className="create-card-icon">
                                <i className="bi bi-file-earmark-plus"></i>
                            </div>
                            <h4>Create Template</h4>
                            <p>Design a message and submit it to Meta for approval.</p>
                            <span className="create-card-meta">
                                {templates.length} total · {approved} approved · {pendingTpl} pending
                            </span>
                            <span className="create-card-cta">
                                + New template <i className="bi bi-arrow-right"></i>
                            </span>
                        </button>
                    </div>
                </div>

                <div className="dashboard-panel quick-actions-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Quick Actions</h3>
                            <p>Manage your WhatsApp easily</p>
                        </div>
                    </div>

                    <div className="quick-actions-list">
                        <button className="quick-action" onClick={() => nav.push(ROUTES.contacts)}>
                            <div className="quick-action-icon green"><i className="bi bi-person-plus"></i></div>
                            <div>
                                <h4>Contacts</h4>
                                <p>{num(contacts)} saved contacts</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>

                        <button className="quick-action" onClick={() => nav.push(ROUTES.campaigns)}>
                            <div className="quick-action-icon blue"><i className="bi bi-megaphone"></i></div>
                            <div>
                                <h4>All Campaigns</h4>
                                <p>View counts and recipients</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>

                        <button className="quick-action" onClick={() => nav.push(ROUTES.templates)}>
                            <div className="quick-action-icon purple"><i className="bi bi-file-earmark-text"></i></div>
                            <div>
                                <h4>All Templates</h4>
                                <p>{templates.length} in your account</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>

                        <button className="quick-action" onClick={() => nav.push(ROUTES.inbox)}>
                            <div className="quick-action-icon orange"><i className="bi bi-chat-left-text"></i></div>
                            <div>
                                <h4>Open Inbox</h4>
                                <p>{unread} unread message{unread === 1 ? "" : "s"}</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* ---------- recent activity + delivery ---------- */}
            <div className="dashboard-bottom">
                <div className="dashboard-panel recent-activity-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Recent Activity</h3>
                            <p>Latest campaigns</p>
                        </div>

                        <button className="view-all-btn" onClick={() => nav.push(ROUTES.campaigns)}>
                            View All <i className="bi bi-arrow-right"></i>
                        </button>
                    </div>

                    <div className="activity-table-wrapper">
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>TEMPLATE</th>
                                    <th>DATE</th>
                                    <th>MESSAGES</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {!loading && recent.length === 0 && (
                                    <tr><td colSpan={5} className="activity-empty">
                                        No campaigns yet. Create your first campaign above.
                                    </td></tr>
                                )}

                                {recent.map((item) => (
                                    <tr key={item.id} className="activity-row" onClick={() => nav.push(ROUTES.campaigns)}>
                                        <td>
                                            <div className="activity-name">
                                                <div className="activity-icon">
                                                    <i className="bi bi-whatsapp"></i>
                                                </div>
                                                <strong>{item.name}</strong>
                                            </div>
                                        </td>
                                        <td>{item.templateName}</td>
                                        <td>{fmtDate(item.createdAt)}</td>
                                        <td>{num(item.sent)} / {num(item.total)}</td>
                                        <td>
                                            <span className={`activity-status ${
                                                item.status === "COMPLETED" ? "completed"
                                                    : item.status === "FAILED" ? "failed" : "progress"
                                            }`}>
                                                {item.status === "COMPLETED" ? "Completed"
                                                    : item.status === "FAILED" ? "Failed" : "In Progress"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="dashboard-panel delivery-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Delivery Overview</h3>
                            <p>Message delivery performance</p>
                        </div>
                    </div>

                    <div className="delivery-chart">
                        <div
                            className="delivery-circle"
                            style={{
                                background: `conic-gradient(#25d366 ${circlePct * 3.6}deg, #fde2e2 0deg)`,
                            }}
                        >
                            <div className="delivery-circle-inner">
                                <h2>{circlePct}%</h2>
                                <span>Delivered</span>
                            </div>
                        </div>
                    </div>

                    <div className="delivery-details">
                        <div>
                            <span><i className="legend-dot sent-dot"></i> Delivered</span>
                            <strong>{num(totals.delivered)}</strong>
                        </div>
                        <div>
                            <span><i className="legend-dot failed-dot"></i> Failed ({failedPct}%)</span>
                            <strong>{num(totals.failed)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Dashboard;