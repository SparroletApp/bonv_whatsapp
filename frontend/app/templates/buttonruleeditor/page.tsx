"use client";

import { useEffect, useMemo, useState } from "react";

import "./template-form.css";
import templateService, {
    ButtonRuleRequest,
    TemplateResponse,
} from "@/app/apiservice/templateservice";
import { apiError } from "@/app/utils/apiError";

interface Props {
    /** The template whose buttons should trigger replies (template A). */
    template: TemplateResponse;
    /** All templates of the company, used as reply choices. */
    templates: TemplateResponse[];
    onSaved?: () => void;
    onClose?: () => void;
}

interface QuickReplyButton {
    index: number; // position inside the template: 0, 1, 2
    text: string;
}

export default function ButtonRulesEditor({
    template,
    templates,
    onSaved,
    onClose,
}: Props) {
    // buttonIndex -> selected target template id ("" = no reply)
    const [selection, setSelection] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Only QUICK_REPLY buttons can trigger a bot reply.
    const quickReplies: QuickReplyButton[] = useMemo(() => {
        try {
            const all: { type: string; text: string }[] = template.buttonsJson
                ? JSON.parse(template.buttonsJson)
                : [];

            return all
                .map((b, index) => ({ ...b, index }))
                .filter((b) => b.type === "QUICK_REPLY")
                .map((b) => ({ index: b.index, text: b.text }));
        } catch {
            return [];
        }
    }, [template.buttonsJson]);

    // Reply templates must have no variables (backend rule).
    const targets = useMemo(
        () =>
            templates.filter(
                (t) => t.id !== template.id && (t.variableCount ?? 0) === 0
            ),
        [templates, template.id]
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const rules = await templateService.getButtonRules(template.id);

                if (cancelled) return;

                const next: Record<number, string> = {};

                rules.forEach((r) => {
                    next[r.buttonIndex] = String(r.targetTemplateId);
                });

                setSelection(next);
            } catch (e) {
                if (!cancelled) setError(apiError(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [template.id]);

    const save = async () => {
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const rules: ButtonRuleRequest[] = quickReplies
                .filter((b) => selection[b.index])
                .map((b) => ({
                    buttonIndex: b.index,
                    targetTemplateId: Number(selection[b.index]),
                }));

            await templateService.saveButtonRules(template.id, rules);

            setSuccess("Reply rules saved.");
            onSaved?.();
        } catch (e) {
            setError(apiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tf-form-card">
            <div className="tf-card-heading">
                <div>
                    <span className="tf-step">REPLY BOT</span>
                    <h3>Auto-reply rules for “{template.name}”</h3>
                    <p>
                        Choose which template is sent automatically when a
                        customer taps each button.
                    </p>
                </div>
                <i className="bi bi-robot tf-section-icon" />
            </div>

            {error && (
                <div className="tf-error">
                    <i className="bi bi-exclamation-circle-fill" />
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
            )}

            {success && (
                <div className="tf-button-info">
                    <i className="bi bi-check-circle-fill" />
                    {success}
                </div>
            )}

            {loading ? (
                <p>Loading rules...</p>
            ) : quickReplies.length === 0 ? (
                <div className="tf-button-info">
                    <i className="bi bi-info-circle-fill" />
                    This template has no Quick reply buttons. Only Quick reply
                    buttons can trigger an auto-reply.
                </div>
            ) : (
                <>
                    {quickReplies.map((b) => {
                        const chosen = targets.find(
                            (t) => String(t.id) === selection[b.index]
                        );

                        return (
                            <div className="tf-button-card" key={b.index}>
                                <div className="tf-button-card-header">
                                    <span>
                                        BUTTON {b.index + 1}: {b.text}
                                    </span>
                                </div>

                                <div className="tf-field">
                                    <label>When tapped, send template</label>
                                    <select
                                        value={selection[b.index] ?? ""}
                                        onChange={(e) =>
                                            setSelection((cur) => ({
                                                ...cur,
                                                [b.index]: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            No auto-reply
                                        </option>
                                        {targets.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.status})
                                            </option>
                                        ))}
                                    </select>

                                    {chosen && chosen.status !== "APPROVED" && (
                                        <small>
                                            This template is {chosen.status}.
                                            It will only be sent after Meta
                                            approves it.
                                        </small>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div className="tf-submit-area">
                        {onClose && (
                            <button
                                type="button"
                                className="tf-add-button"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        )}

                        <button
                            type="button"
                            className="tf-submit-btn"
                            disabled={saving}
                            onClick={save}
                        >
                            {saving ? (
                                <>
                                    <span className="tf-spinner" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Save reply rules
                                    <i className="bi bi-check2" />
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}