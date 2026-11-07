"use client";

import campaignService from "@/app/apiservice/campaignservice";
import categoryInsightService, { CategorySummary } from "@/app/apiservice/categoryinsightservice";
import templateService, { TemplateResponse } from "@/app/apiservice/templateservice";
import Modal from "@/app/component/Modal";
import TemplateForm from "@/app/component/TemplateForm";
import TemplatePreview from "@/app/component/TemplatePreview";
import { apiError } from "@/app/utils/apiError";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";



type Kind = "NAME" | "PHONE" | "EMAIL" | "TEXT";
interface VarMap { kind: Kind; text: string }

const SAMPLE: Record<Exclude<Kind, "TEXT">, string> = {
    NAME: "Rahul", PHONE: "919876543210", EMAIL: "rahul@example.com",
};

export default function CampaignCreatePage() {
    const nav = useRouter();

    const [name, setName] = useState("");
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [templates, setTemplates] = useState<TemplateResponse[]>([]);
    const [templateId, setTemplateId] = useState<number | "">("");
    const [mapping, setMapping] = useState<VarMap[]>([]);
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const template = templates.find((t) => t.id === templateId);

    const loadTemplates = () => templateService.list("APPROVED").then(setTemplates);

    useEffect(() => {
        categoryInsightService.list().then(setCategories).catch((e) => setError(apiError(e)));
        loadTemplates().catch((e) => setError(apiError(e)));
    }, []);

    const totalContacts = useMemo(
        () => categories.filter((c) => selected.includes(c.id)).reduce((s, c) => s + c.contactCount, 0),
        [categories, selected]
    );

    const toggle = (id: number) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

    const pickTemplate = (id: number | "") => {
        setTemplateId(id);
        const t = templates.find((x) => x.id === id);
        setMapping(Array.from({ length: t?.variableCount ?? 0 },
            (_, i) => ({ kind: i === 0 ? "NAME" : "TEXT", text: "" } as VarMap)));
    };

    const updateMap = (i: number, patch: Partial<VarMap>) =>
        setMapping(mapping.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

    const previewValues = mapping.map((m) => (m.kind === "TEXT" ? m.text : SAMPLE[m.kind]));

    const sync = async () => {
        try {
            await templateService.sync();
            await loadTemplates();
            setInfo("Templates refreshed from Meta.");
        } catch (e) { setError(apiError(e)); }
    };

    const launch = async () => {
        setError("");

        if (!name.trim()) return setError("Enter a campaign name");
        if (selected.length === 0) return setError("Select at least one category");
        if (!template) return setError("Select an approved template");

        if (mapping.some((m) => m.kind === "TEXT" && !m.text.trim())) {
            return setError("Fill in all custom variable values");
        }

        setLaunching(true);

        try {
            const c = await campaignService.create({
                name,
                templateId: template.id,
                categoryIds: selected,
                variableMapping: mapping.map((m) =>
                    m.kind === "TEXT" ? `TEXT:${m.text}` : m.kind
                ),
            });

            nav.push(`/campaigns/${c.id}`);

        } catch (e) {
            setError(apiError(e));
            setLaunching(false);
        }
    };

    return (
        <div className="wa-page">
            <h2>Create Campaign</h2>
            {error && <div className="wa-error">{error}</div>}
            {info && <div className="wa-info">{info}</div>}

            <section className="wa-card">
                <h3>1. Campaign name</h3>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Diwali offer – Nov 2026" />
            </section>

            <section className="wa-card">
                <h3>2. Select categories</h3>
                <div className="wa-chips">
                    {categories.map((c) => (
                        <label key={c.id} className={`wa-chip ${selected.includes(c.id) ? "on" : ""}`}>
                            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                            {c.name} <small>({c.contactCount})</small>
                        </label>
                    ))}
                </div>
                <p><strong>{totalContacts}</strong> contact(s) will receive this campaign.</p>
            </section>

            <section className="wa-card">
                <div className="wa-row wa-between">
                    <h3>3. Select template</h3>
                    <div className="wa-row">
                        <button className="wa-btn-link" onClick={sync}>Refresh from Meta</button>
                        <button className="wa-btn wa-btn-secondary" onClick={() => setShowTemplateForm(true)}>
                            + Create new template
                        </button>
                    </div>
                </div>

                <select value={templateId} onChange={(e) => pickTemplate(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">— choose an approved template —</option>
                    {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                    ))}
                </select>

                {template && (
                    <div className="wa-grid-2">
                        <div>
                            {template.variableCount > 0 && <h4>Fill variables</h4>}
                            {mapping.map((m, i) => (
                                <div className="wa-row" key={i}>
                                    <span style={{ width: 50 }}>{`{{${i + 1}}}`}</span>
                                    <select value={m.kind} onChange={(e) => updateMap(i, { kind: e.target.value as Kind })}>
                                        <option value="NAME">Contact name</option>
                                        <option value="PHONE">Contact phone</option>
                                        <option value="EMAIL">Contact email</option>
                                        <option value="TEXT">Custom text</option>
                                    </select>
                                    {m.kind === "TEXT" &&
                                        <input value={m.text} onChange={(e) => updateMap(i, { text: e.target.value })}
                                            placeholder="Value for everyone" />}
                                </div>
                            ))}
                        </div>
                        <TemplatePreview {...template} values={previewValues} />
                    </div>
                )}
                {templates.length === 0 &&
                    <p className="wa-hint">No approved templates. Create one, wait for approval, then click “Refresh from Meta”.</p>}
            </section>

            <button className="wa-btn wa-btn-big" disabled={launching} onClick={launch}>
                {launching ? "Launching…" : `Launch to ${totalContacts} contact(s)`}
            </button>

            {showTemplateForm && (
                <Modal title="Create template" onClose={() => setShowTemplateForm(false)}>
                    <TemplateForm onCreated={(t) => {
                        setShowTemplateForm(false);
                        setInfo(`Template “${t.name}” submitted (status: ${t.status}). It appears in the list once Meta approves it.`);
                        loadTemplates();
                    }} />
                </Modal>
            )}
        </div>
    );
}