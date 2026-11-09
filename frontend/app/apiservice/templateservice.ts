
import api from "./apiservice";

export interface TemplateButton {
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phoneNumber?: string;
}

export type TemplateHeaderType =
    | "NONE"
    | "TEXT"
    | "IMAGE"
    | "VIDEO"
    | "DOCUMENT"
    | "LOCATION";

export interface TemplateCreateRequest {
    name: string;
    language: string;
    category: "MARKETING" | "UTILITY";

    headerType?: TemplateHeaderType;
    headerText?: string;
    headerMediaHandle?: string;

    body: string;
    bodyExamples: string[];
    footerText?: string;
    buttons: TemplateButton[];
}

export interface TemplateResponse {
    id: number;
    name: string;
    language: string;
    category: string;

    headerText: string | null;
    headerType: TemplateHeaderType;
    headerMediaHandle: string | null;
    headerMediaUrl: string | null;

    body: string;
    footerText: string | null;
    buttonsJson: string | null;
    variableCount: number;
    status: string;
    rejectionReason: string | null;
    createdAt: string;
}

export interface TemplateMediaUploadResponse {
    handle: string;
}

const templateService = {

    list: (status?: string) =>
        api.get<TemplateResponse[]>(
            `/templates${status ? `?status=${encodeURIComponent(status)}` : ""}`
        ),

    create: (req: TemplateCreateRequest) =>
        api.post<TemplateResponse>("/templates", req),

    uploadMediaSample: (
        type: "IMAGE" | "VIDEO" | "DOCUMENT",
        file: File
    ) => {
        const formData = new FormData();

        formData.append("type", type);
        formData.append("file", file);

        return api.post<TemplateMediaUploadResponse>(
            "/templates/media-sample",
            formData,
            {
                headers: {
                    "Content-Type": undefined,
                },
            }
        );
    },

    sync: () =>
        api.post<TemplateResponse[]>("/templates/sync", {}),
};

export default templateService;
