import api from "./apiservice";

export interface TemplateButton {
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phoneNumber?: string;
}

export type TemplateCreateHeaderType = "NONE" | "TEXT" | "IMAGE";

export interface TemplateCreateRequest {
    name: string;
    language: string;
    category: "MARKETING" | "UTILITY";
    headerType?: TemplateCreateHeaderType;
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
    headerType?: TemplateCreateHeaderType;
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

// ---------- Reply bot rules ----------

export interface ButtonRule {
    id: number;
    sourceTemplateId: number;
    sourceTemplateName: string;
    buttonIndex: number;
    buttonText: string;
    targetTemplateId: number;
    targetTemplateName: string;
    targetTemplateStatus: string;
}

export interface ButtonRuleRequest {
    buttonIndex: number;
    targetTemplateId: number;
}

const getCompanyHeaders = () => {
    if (typeof window === "undefined") {
        throw new Error("Company ID is not available");
    }

    const companyId = sessionStorage.getItem("companyId");

    if (!companyId) {
        throw new Error("Company ID not found in session. Please select a company.");
    }

    return {
        "X-Company-Id": companyId,
    };
};

const templateService = {
    list: (status?: string) =>
        api.get<TemplateResponse[]>(
            `/templates${status ? `?status=${encodeURIComponent(status)}` : ""}`,
            {
                headers: getCompanyHeaders(),
            }
        ),

    create: (req: TemplateCreateRequest) =>
        api.post<TemplateResponse>(
            "/templates",
            req,
            {
                headers: getCompanyHeaders(),
            }
        ),

    uploadMediaSample: (type: "IMAGE", file: File) => {
        const formData = new FormData();

        formData.append("type", type);
        formData.append("file", file);

        return api.post<TemplateMediaUploadResponse>(
            "/templates/media-sample",
            formData,
            {
                headers: getCompanyHeaders(),
                timeout: 120000,
            }
        );
    },

    sync: () =>
        api.post<TemplateResponse[]>(
            "/templates/sync",
            {},
            {
                headers: getCompanyHeaders(),
            }
        ),

    // ---------- Reply bot rules ----------

    getButtonRules: (templateId: number) =>
        api.get<ButtonRule[]>(
            `/templates/${templateId}/button-rules`,
            {
                headers: getCompanyHeaders(),
            }
        ),

    saveButtonRules: (templateId: number, rules: ButtonRuleRequest[]) =>
        api.put<ButtonRule[]>(
            `/templates/${templateId}/button-rules`,
            { rules },
            {
                headers: getCompanyHeaders(),
            }
        ),
};

export default templateService;