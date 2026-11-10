import api from "./apiservice";

export interface CampaignCreateRequest {
    name: string;
    templateId: number;
    categoryIds: number[];
    variableMapping: string[];
    scheduledAt?: string | null;   // "2026-11-10T18:30" (local time), null = send immediately
}

export interface CampaignResponse {
    id: number;
    name: string;
    templateName: string;
    status: "SCHEDULED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    replied: number;
    createdAt: string;
    completedAt: string | null;
    scheduledAt: string | null;
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
    create: (req: CampaignCreateRequest) =>
        api.post<CampaignResponse>("/campaigns", req),

    list: () =>
        api.get<CampaignResponse[]>("/campaigns"),

    get: (id: number) =>
        api.get<CampaignResponse>(`/campaigns/${id}`),

    messages: (id: number) =>
        api.get<CampaignMessage[]>(`/campaigns/${id}/messages`),

    resume: (id: number) =>
        api.post<CampaignResponse>(`/campaigns/${id}/resume`, {}),

    cancel: (id: number) =>
        api.post<CampaignResponse>(`/campaigns/${id}/cancel`, {}),
};

export default campaignService;