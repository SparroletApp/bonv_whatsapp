import { useEffect, useState } from "react";

import { apiError } from "../utils/apiError";

import TemplatePreview from "../component/TemplatePreview";
import Modal from "../component/Modal";
import TemplateForm from "../component/TemplateForm";
import templateService, { TemplateResponse } from "../apiservice/templateservice";

export default function TemplatesPage() {
    const [items, setItems] = useState<TemplateResponse[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState("");

    const load = () => templateService.list().then(setItems).catch((e) => setError(apiError(e)));
    useEffect(() => { load(); }, []);

    const sync = async () => {
        setSyncing(true);
        try { setItems(await templateService.sync()); }
        catch (e) { setError(apiError(e)); }
        finally { setSyncing(false); }
    };

    return (
        <div className="wa-page">
            <div className="wa-row wa-between">
                <h2>Message Templates</h2>
                <div className="wa-row">
                    <button className="wa-btn wa-btn-secondary" onClick={sync} disabled={syncing}>
                        {syncing ? "Syncing…" : "Sync from Meta"}
                    </button>
                    <button className="wa-btn" onClick={() => setShowForm(true)}>+ New template</button>
                </div>
            </div>
            {error && <div className="wa-error">{error}</div>}

            <div className="wa-cards">
                {items.map((t) => (
                    <div className="wa-card" key={t.id}>
                        <div className="wa-row wa-between">
                            <strong>{t.name}</strong>
                            <span className={`wa-badge wa-${t.status.toLowerCase()}`}>{t.status}</span>
                        </div>
                        <small>{t.language} • {t.category} • {t.variableCount} variable(s)</small>
                        <TemplatePreview {...t} />
                        {t.rejectionReason && t.status === "REJECTED" &&
                            <div className="wa-error">Reason: {t.rejectionReason}</div>}
                    </div>
                ))}
                {items.length === 0 && <p>No templates yet. Create one or sync from Meta.</p>}
            </div>

            {showForm && (
                <Modal title="Create template" onClose={() => setShowForm(false)}>
                    <TemplateForm onCreated={() => { setShowForm(false); load(); }} />
                </Modal>
            )}
        </div>
    );
}