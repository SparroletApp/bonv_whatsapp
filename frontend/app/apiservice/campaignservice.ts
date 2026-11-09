import api from "./apiservice";

export interface CampaignCreateRequest {
    name: string;
    templateId: number;
    categoryIds: number[];
    variableMapping: string[];
    headerMediaUrl?: string;
}

export interface CampaignResponse {
    id: number;
    name: string;
    templateName: string;
    status: "RUNNING" | "COMPLETED" | "FAILED";
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    replied: number;
    createdAt: string;
    completedAt: string | null;
}

export interface CampaignMessage {
    id: number;
    recipientName: string;
    recipientPhone: string;
    status: string;
    errorMessage: string | null;
    sentAt: string | null;
    deliveredAt: string | null;
    readAt: string | null;
}

const campaignService = {
    create: (req: CampaignCreateRequest) => api.post<CampaignResponse>("/campaigns", req),
    list: () => api.get<CampaignResponse[]>("/campaigns"),
    get: (id: number) => api.get<CampaignResponse>(`/campaigns/${id}`),
    messages: (id: number) => api.get<CampaignMessage[]>(`/campaigns/${id}/messages`),
    resume: (id: number) => api.post<CampaignResponse>(`/campaigns/${id}/resume`, {}),
    uploadMedia: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return api.post<{ url: string }>("/campaigns/media", form);
    },
};

export default campaignService;