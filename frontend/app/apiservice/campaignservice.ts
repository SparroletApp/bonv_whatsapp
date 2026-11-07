import api from "./apiservice";

export interface CampaignCreateRequest {
    name: string;
    templateId: number;
    categoryIds: number[];
    variableMapping: string[]; 
}

export interface CampaignResponse {
    id: number;
    name: string;
    templateName: string;
    status: "RUNNING" | "COMPLETED";
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
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
    create: (req: CampaignCreateRequest) => api.post<CampaignResponse>("/api/campaigns", req),
    list: () => api.get<CampaignResponse[]>("/api/campaigns"),
    get: (id: number) => api.get<CampaignResponse>(`/api/campaigns/${id}`),
    messages: (id: number) => api.get<CampaignMessage[]>(`/api/campaigns/${id}/messages`),
};

export default campaignService;