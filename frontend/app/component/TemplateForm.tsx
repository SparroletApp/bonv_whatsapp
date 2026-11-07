import { useMemo, useState } from "react";
import TemplatePreview from "./TemplatePreview";
import { apiError } from "../utils/apiError";
import templateService, { TemplateButton, TemplateResponse } from "../apiservice/templateservice";

const LANGUAGES = [
    { code: "en_US", label: "English (US)" },
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "ml", label: "Malayalam" },
    { code: "ta", label: "Tamil" },
];

export default function TemplateForm({ onCreated }: { onCreated: (t: TemplateResponse) => void }) {
    const [name, setName] = useState("");
    const [language, setLanguage] = useState("en_US");
    const [category, setCategory] = useState<"MARKETING" | "UTILITY">("MARKETING");
    const [headerText, setHeaderText] = useState("");
    const [body, setBody] = useState("");
    const [footerText, setFooterText] = useState("");
    const [examples, setExamples] = useState<string[]>([]);
    const [buttons, setButtons] = useState<TemplateButton[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const varCount = useMemo(() => {
        const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
        return nums.length ? Math.max(...nums) : 0;
    }, [body]);

    const setExample = (i: number, v: string) => {
        const next = [...examples];
        next[i] = v;
        setExamples(next);
    };

    const addVariable = () => setBody((b) => `${b}{{${varCount + 1}}}`);

    const addButton = () => {
        if (buttons.length >= 3) return;
        setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
    };
    const updateButton = (i: number, patch: Partial<TemplateButton>) =>
        setButtons(buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

    const submit = async () => {
        setError("");
        if (!/^[a-z0-9_]+$/.test(name)) return setError("Name: lowercase letters, numbers, underscore only");
        if (!body.trim()) return setError("Body is required");
        if (varCount > 0 && examples.slice(0, varCount).filter(Boolean).length < varCount)
            return setError("Provide an example value for every variable");

        setSaving(true);
        try {
            const created = await templateService.create({
                name, language, category,
                headerText: headerText || undefined,
                body,
                footerText: footerText || undefined,
                bodyExamples: examples.slice(0, varCount),
                buttons: buttons.filter((b) => b.text.trim()),
            });
            onCreated(created);
        } catch (e) {
            setError(apiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="wa-grid-2">
            <div>
                {error && <div className="wa-error">{error}</div>}

                <label>Template name</label>
                <input value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                       placeholder="diwali_offer_2026" />

                <div className="wa-row">
                    <div style={{ flex: 1 }}>
                        <label>Language</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                            <option value="MARKETING">Marketing</option>
                            <option value="UTILITY">Utility</option>
                        </select>
                    </div>
                </div>

                <label>Header (optional)</label>
                <input value={headerText} maxLength={60} onChange={(e) => setHeaderText(e.target.value)} />

                <label>Body <button type="button" className="wa-btn-link" onClick={addVariable}>+ variable</button></label>
                <textarea rows={5} value={body} maxLength={1024} onChange={(e) => setBody(e.target.value)}
                          placeholder="Hi {{1}}, our festive offer starts today!" />

                {Array.from({ length: varCount }).map((_, i) => (
                    <input key={i} placeholder={`Example for {{${i + 1}}}`} value={examples[i] || ""}
                           onChange={(e) => setExample(i, e.target.value)} />
                ))}

                <label>Footer (optional)</label>
                <input value={footerText} maxLength={60} onChange={(e) => setFooterText(e.target.value)} />

                <label>Buttons (max 3)</label>
                {buttons.map((b, i) => (
                    <div className="wa-row" key={i}>
                        <select value={b.type} onChange={(e) => updateButton(i, { type: e.target.value as any })}>
                            <option value="QUICK_REPLY">Quick reply</option>
                            <option value="URL">URL</option>
                            <option value="PHONE_NUMBER">Phone</option>
                        </select>
                        <input placeholder="Button text" value={b.text} maxLength={25}
                               onChange={(e) => updateButton(i, { text: e.target.value })} />
                        {b.type === "URL" && <input placeholder="https://..." value={b.url || ""}
                               onChange={(e) => updateButton(i, { url: e.target.value })} />}
                        {b.type === "PHONE_NUMBER" && <input placeholder="+919876543210" value={b.phoneNumber || ""}
                               onChange={(e) => updateButton(i, { phoneNumber: e.target.value })} />}
                        <button type="button" className="wa-btn-link"
                                onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                ))}
                {buttons.length < 3 && <button type="button" className="wa-btn-link" onClick={addButton}>+ add button</button>}

                <button className="wa-btn" disabled={saving} onClick={submit} style={{ marginTop: 16 }}>
                    {saving ? "Submitting to Meta…" : "Submit for approval"}
                </button>
            </div>

            <div>
                <label>Preview</label>
                <TemplatePreview headerText={headerText} body={body || "Your message…"}
                                 footerText={footerText} values={examples}
                                 buttonsJson={JSON.stringify(buttons.filter((b) => b.text))} />
                <p className="wa-hint">
                    Meta reviews every template (usually minutes, sometimes 24h). Variables must be
                    sequential ({"{{1}}"}, {"{{2}}"}…) and the body cannot start or end with a variable.
                </p>
            </div>
        </div>
    );
}