
import type { TemplateHeaderType } from "@/app/apiservice/templateservice";

export const renderBody = (body: string, values: string[] = []) =>
    body.replace(/\{\{(\d+)\}\}/g, (_, n) =>
        values[Number(n) - 1] || `{{${n}}}`
    );

interface Props {
    headerType?: TemplateHeaderType | null;
    headerText?: string | null;
    headerMediaUrl?: string | null;
    body: string;
    footerText?: string | null;
    buttonsJson?: string | null;
    values?: string[];
}

export default function TemplatePreview({
    headerType,
    headerText,
    headerMediaUrl,
    body,
    footerText,
    buttonsJson,
    values
}: Props) {
    let buttons: { type: string; text: string }[] = [];

    try {
        buttons = buttonsJson ? JSON.parse(buttonsJson) : [];
    } catch {
        buttons = [];
    }

    return (
        <div className="wa-bubble-wrap">
            <div className="wa-bubble">

                {/* Text Header */}
                {headerType === "TEXT" && headerText && (
                    <div className="wa-bubble-header">
                        {headerText}
                    </div>
                )}

                {/* Image Header */}
                {headerType === "IMAGE" && (
                    <div className="wa-bubble-media">
                        {headerMediaUrl ? (
                            <img
                                src={headerMediaUrl}
                                alt="Template header"
                                className="wa-bubble-image"
                            />
                        ) : (
                            <div className="wa-bubble-media-placeholder">
                                <i className="bi bi-image" />
                                <span>Image header</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Video Header */}
                {headerType === "VIDEO" && (
                    <div className="wa-bubble-media wa-bubble-media-placeholder">
                        <i className="bi bi-play-circle" />
                        <span>Video header</span>
                    </div>
                )}

                {/* Document Header */}
                {headerType === "DOCUMENT" && (
                    <div className="wa-bubble-media wa-bubble-media-placeholder">
                        <i className="bi bi-file-earmark-pdf" />
                        <span>Document header</span>
                    </div>
                )}

                {/* Backward compatibility for old templates */}
                {!headerType && headerText && (
                    <div className="wa-bubble-header">
                        {headerText}
                    </div>
                )}

                {/* Message Body */}
                <div style={{ whiteSpace: "pre-wrap" }}>
                    {renderBody(body, values)}
                </div>

                {/* Footer */}
                {footerText && (
                    <div className="wa-bubble-footer">
                        {footerText}
                    </div>
                )}
            </div>

            {/* Buttons */}
            {buttons.map((b, i) => (
                <div key={i} className="wa-bubble-btn">
                    {b.text}
                </div>
            ))}
        </div>
    );
}
