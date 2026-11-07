export const renderBody = (body: string, values: string[] = []) =>
    body.replace(/\{\{(\d+)\}\}/g, (_, n) => values[Number(n) - 1] || `{{${n}}}`);

interface Props {
    headerText?: string | null;
    body: string;
    footerText?: string | null;
    buttonsJson?: string | null;
    values?: string[];
}

export default function TemplatePreview({ headerText, body, footerText, buttonsJson, values }: Props) {
    let buttons: { type: string; text: string }[] = [];
    try { buttons = buttonsJson ? JSON.parse(buttonsJson) : []; } catch { /* ignore */ }

    return (
        <div className="wa-bubble-wrap">
            <div className="wa-bubble">
                {headerText && <div className="wa-bubble-header">{headerText}</div>}
                <div style={{ whiteSpace: "pre-wrap" }}>{renderBody(body, values)}</div>
                {footerText && <div className="wa-bubble-footer">{footerText}</div>}
            </div>
            {buttons.map((b, i) => (
                <div key={i} className="wa-bubble-btn">{b.text}</div>
            ))}
        </div>
    );
}