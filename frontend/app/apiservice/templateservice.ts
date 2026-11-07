import api from "./apiservice";

export interface TemplateButton {
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phoneNumber?: string;
}

export interface TemplateCreateRequest {
    name: string;
    language: string;
    category: "MARKETING" | "UTILITY";
    headerText?: string;
    body: string;
    footerText?: string;
    bodyExamples: string[];
    buttons: TemplateButton[];
}

export interface TemplateResponse {
    id: number;
    name: string;
    language: string;
    category: string;
    headerText: string | null;
    body: string;
    footerText: string | null;
    buttonsJson: string | null;
    variableCount: number;
    status: string; 
    rejectionReason: string | null;
    createdAt: string;
}

const templateService = {
    list: (status?: string) =>
        api.get<TemplateResponse[]>(`/templates${status ? `?status=${status}` : ""}`),
    create: (req: TemplateCreateRequest) =>
        api.post<TemplateResponse>("/templates", req),
    sync: () => api.post<TemplateResponse[]>("/templates/sync", {}),
};

export default templateService;