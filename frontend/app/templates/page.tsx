"use client";

import "./template.css";
import { useEffect, useMemo, useState } from "react";
import templateService, { TemplateButton, TemplateResponse } from "@/app/apiservice/templateservice";
import Modal from "@/app/component/Modal";
import TemplatePreview from "@/app/component/TemplatePreview";
import TemplateForm from "@/app/templatepage/form/page";
import { apiError } from "@/app/utils/apiError";

const STATUSES = ["ALL", "APPROVED", "PENDING", "REJECTED", "PAUSED"] as const;
type StatusFilter = (typeof STATUSES)[number];

const LANG: Record<string, string> = {
    en: "English", en_US: "English (US)", en_GB: "English (UK)",
    hi: "Hindi", ml: "Malayalam", ta: "Tamil",
};

const parseButtons = (json: string | null): TemplateButton[] => {
    try { return json ? JSON.parse(json) : []; } catch { return []; }
};

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function Template() {
    const [items, setItems] = useState<TemplateResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const [q, setQ] = useState("");
    const [status, setStatus] = useState<StatusFilter>("ALL");
    const [category, setCategory] = useState("ALL");

    const [selected, setSelected] = useState<TemplateResponse | null>(null);
    const [showForm, setShowForm] = useState(false);

    const load = () => templateService.list().then(setItems);

    const syncNow = async (silent = false) => {
        setSyncing(true);
        setError("");
        try {
            await templateService.sync();
            await load();
            if (!silent) setInfo("Templates refreshed from Meta.");
        } catch (e) {
            setError("Could not refresh from Meta: " + apiError(e));
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        (async () => {
            try { await load(); } catch (e) { setError(apiError(e)); }
            setLoading(false);
            syncNow(true);                         
        })();
    }, []);

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: items.length };
        items.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
        return c;
    }, [items]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return items.filter((t) =>
            (status === "ALL" || t.status === status) &&
            (category === "ALL" || t.category === category) &&
            (!s || t.name.toLowerCase().includes(s) || t.body.toLowerCase().includes(s))
        );
    }, [items, q, status, category]);

    const buttons = selected ? parseButtons(selected.buttonsJson) : [];

    return (
        <div className="tpl-page">
            {/* ---------- header ---------- */}
            <div className="tpl-head">
                <div>
                    <h1>Message templates</h1>
                    <p>{items.length} template{items.length === 1 ? "" : "s"} in your WhatsApp account</p>
                </div>
                <div className="tpl-actions">
                    <button className="tpl-btn tpl-btn-ghost" disabled={syncing} onClick={() => syncNow()}>
                        {syncing ? "Refreshing…" : "↻ Refresh from Meta"}
                    </button>
                    <button className="tpl-btn tpl-btn-primary" onClick={() => setShowForm(true)}>
                        + Create template
                    </button>
                </div>
            </div>

            {error && <div className="tpl-alert tpl-alert-error">{error}</div>}
            {info && <div className="tpl-alert tpl-alert-info">{info}</div>}

            {/* ---------- toolbar ---------- */}
            <div className="tpl-toolbar">
                <input className="tpl-search" placeholder="Search by name or message…"
                       value={q} onChange={(e) => setQ(e.target.value)} />
                <select className="tpl-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="ALL">All categories</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                </select>
            </div>

            <div className="tpl-tabs">
                {STATUSES.map((s) => (
                    <button key={s} className={`tpl-tab ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>
                        {s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase()}
                        <span>{counts[s] || 0}</span>
                    </button>
                ))}
            </div>

            {/* ---------- list ---------- */}
            {loading ? (
                <div className="tpl-grid">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="tpl-card tpl-skeleton" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="tpl-empty">
                    <div className="tpl-empty-icon">💬</div>
                    <h3>No templates found</h3>
                    <p>{items.length === 0
                        ? "Create a template or refresh from Meta to load the ones in your account."
                        : "Try a different search or filter."}</p>
                </div>
            ) : (
                <div className="tpl-grid">
                    {filtered.map((t) => (
                        <article key={t.id} className="tpl-card" onClick={() => setSelected(t)}>
                            <div className="tpl-card-top">
                                <h3 className="tpl-name">{t.name}</h3>
                                <span className={`tpl-badge tpl-s-${t.status.toLowerCase()}`}>{t.status}</span>
                            </div>

                            <div className="tpl-meta">
                                <span className="tpl-chip">{t.category}</span>
                                <span className="tpl-chip">{LANG[t.language] || t.language}</span>
                            </div>

                            <p className="tpl-body-snippet">{t.body}</p>

                            <div className="tpl-card-foot">
                                <span>{t.variableCount} variable{t.variableCount === 1 ? "" : "s"}</span>
                                <span>{fmtDate(t.createdAt)}</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* ---------- view drawer ---------- */}
            {selected && (
                <>
                    <div className="tpl-overlay" onClick={() => setSelected(null)} />
                    <aside className="tpl-drawer">
                        <header className="tpl-drawer-head">
                            <div>
                                <h2>{selected.name}</h2>
                                <span className={`tpl-badge tpl-s-${selected.status.toLowerCase()}`}>{selected.status}</span>
                            </div>
                            <button className="tpl-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
                        </header>

                        <div className="tpl-drawer-body">
                            {selected.rejectionReason && (
                                <div className="tpl-alert tpl-alert-error">
                                    <strong>Rejected:</strong> {selected.rejectionReason}
                                </div>
                            )}

                            <h4 className="tpl-section">Preview</h4>
                            <div className="tpl-preview-wrap">
                                <TemplatePreview
                                    headerText={selected.headerText}
                                    body={selected.body}
                                    footerText={selected.footerText}
                                    values={[]}
                                    buttonsJson={selected.buttonsJson}
                                />
                            </div>

                            <h4 className="tpl-section">Details</h4>
                            <dl className="tpl-details">
                                <dt>Category</dt><dd>{selected.category}</dd>
                                <dt>Language</dt><dd>{LANG[selected.language] || selected.language}</dd>
                                <dt>Variables</dt><dd>{selected.variableCount}</dd>
                                <dt>Created</dt><dd>{fmtDate(selected.createdAt)}</dd>
                            </dl>

                            {selected.headerText && (<>
                                <h4 className="tpl-section">Header</h4>
                                <p className="tpl-text">{selected.headerText}</p>
                            </>)}

                            <h4 className="tpl-section">Body</h4>
                            <p className="tpl-text">{selected.body}</p>

                            {selected.footerText && (<>
                                <h4 className="tpl-section">Footer</h4>
                                <p className="tpl-text">{selected.footerText}</p>
                            </>)}

                            {buttons.length > 0 && (<>
                                <h4 className="tpl-section">Buttons</h4>
                                <ul className="tpl-buttons">
                                    {buttons.map((b: any, i) => (
                                        <li key={i}>
                                            <span className="tpl-chip">{b.type.replace("_", " ")}</span>
                                            <strong>{b.text}</strong>
                                            {b.url && <small>{b.url}</small>}
                                            {(b.phoneNumber || b.phone_number) && <small>{b.phoneNumber || b.phone_number}</small>}
                                        </li>
                                    ))}
                                </ul>
                            </>)}
                        </div>
                    </aside>
                </>
            )}
            {showForm && (
                <Modal title="Create template" onClose={() => setShowForm(false)}>
                    <TemplateForm onCreated={(t) => {
                        setShowForm(false);
                        setInfo(`Template “${t.name}” submitted (status: ${t.status}). Meta usually reviews it within minutes.`);
                        load();
                    }} />
                </Modal>
            )}
        </div>
    );
}