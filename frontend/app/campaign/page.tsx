
"use client";

import campaignService, { CampaignMessage, CampaignResponse } from "@/app/apiservice/campaignservice";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const cid = Number(id);
    const [c, setC] = useState<CampaignResponse | null>(null);
    const [msgs, setMsgs] = useState<CampaignMessage[]>([]);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        const load = async () => {
            try {
                setC(await campaignService.get(cid));
                setMsgs(await campaignService.messages(cid));
            } catch { /* ignore */ }
        };
        load();
        const t = setInterval(load, 4000);   // live progress
        return () => clearInterval(t);
    }, [cid]);

    if (!c) return <div className="wa-page">Loading…</div>;

    const pct = c.total ? Math.round(((c.total - c.pending) / c.total) * 100) : 0;
    const shown = filter === "ALL" ? msgs : msgs.filter((m) => m.status === filter);

    return (
        <div className="wa-page">
           <Link href="/campaigns">← Campaigns</Link>
            <h2>{c.name} <span className={`wa-badge wa-${c.status.toLowerCase()}`}>{c.status}</span></h2>
            <small>Template: {c.templateName}</small>

            <div className="wa-progress"><div style={{ width: `${pct}%` }} /></div>
            <small>{pct}% processed</small>

            <div className="wa-stats">
                {[["Total", c.total], ["Pending", c.pending], ["Sent", c.sent],
                  ["Delivered", c.delivered], ["Read", c.read], ["Failed", c.failed]].map(([l, v]) => (
                    <div className="wa-stat" key={l as string}><b>{v}</b><span>{l}</span></div>
                ))}
            </div>

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                {["ALL", "PENDING", "SENT", "DELIVERED", "READ", "FAILED"].map((s) => <option key={s}>{s}</option>)}
            </select>

            <table className="wa-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Sent</th><th>Error</th></tr></thead>
                <tbody>
                {shown.map((m) => (
                    <tr key={m.id}>
                        <td>{m.recipientName}</td><td>{m.recipientPhone}</td>
                        <td><span className={`wa-badge wa-${m.status.toLowerCase()}`}>{m.status}</span></td>
                        <td>{m.sentAt ? new Date(m.sentAt).toLocaleTimeString() : "-"}</td>
                        <td className="wa-err-cell">{m.errorMessage}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}