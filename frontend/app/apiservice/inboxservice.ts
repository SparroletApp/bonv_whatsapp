
import api from "./apiservice";

function getCompanyId(): number {
    const companyId = Number(sessionStorage.getItem("companyId"));

    if (!companyId || !Number.isInteger(companyId) || companyId <= 0) {
        throw new Error("Company ID not found. Please select a company.");
    }

    return companyId;
}

export interface Conversation {
    phone: string;
    name: string;
    lastMessage: string;
    lastMessageAt: string;
    lastDirection: "INBOUND" | "OUTBOUND";
    unreadCount: number;
    lastMessageStatus: string | null;
    lastInboundAt: string | null;
    windowExpiresAt: string | null;
}

export interface InboxMessage {
    id: number;
    direction: "INBOUND" | "OUTBOUND";
    text: string;
    status: string;
    templateName: string | null;
    messageType: string;
    errorMessage: string | null;
    createdAt: string;
    mediaId: string | null;
    mimeType: string | null;
    headerType: string | null;
    headerMediaUrl: string | null;
}

export interface InboxTemplateRequest {
    templateId: number;
    templateName: string;
    language: string;
    parameters: string[];
}

const inboxService = {

    conversations: () =>
        api.get<Conversation[]>(
            "/inbox/conversations",
            {
                params: { companyId: getCompanyId() },
            }
        ),

    messages: (phone: string) =>
        api.get<InboxMessage[]>(
            `/inbox/conversations/${encodeURIComponent(phone)}/messages`,
            {
                params: { companyId: getCompanyId() },
            }
        ),

    markRead: (phone: string) =>
        api.post<void>(
            `/inbox/conversations/${encodeURIComponent(phone)}/read`,
            {},
            {
                params: { companyId: getCompanyId() },
            }
        ),

    reply: (phone: string, message: string) =>
        api.post<InboxMessage>(
            `/inbox/conversations/${encodeURIComponent(phone)}/reply`,
            { message },
            {
                params: { companyId: getCompanyId() },
            }
        ),

    replyMedia: (
        phone: string,
        file: Blob,
        filename: string,
        caption?: string
    ) => {
        const fd = new FormData();

        fd.append("file", file, filename);

        if (caption) {
            fd.append("caption", caption);
        }

        return api.post<InboxMessage>(
            `/inbox/conversations/${encodeURIComponent(phone)}/reply-media`,
            fd,
            {
                params: { companyId: getCompanyId() },
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
    },

    sendTemplate: (
        phone: string,
        request: InboxTemplateRequest
    ) =>
        api.post<InboxMessage>(
            `/inbox/conversations/${encodeURIComponent(phone)}/send-template`,
            request,
            {
                params: { companyId: getCompanyId() },
            }
        ),

    media: (mediaId: string) =>
        api.get<Blob>(
            `/inbox/media/${encodeURIComponent(mediaId)}`,
            {
                params: { companyId: getCompanyId() },
                responseType: "blob",
            }
        ),
};

export default inboxService;
