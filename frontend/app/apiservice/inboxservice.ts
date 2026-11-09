import api from "./apiservice";

export interface Conversation {
    phone: string;
    name: string;
    lastMessage: string;
    lastMessageAt: string;
    lastDirection: "INBOUND" | "OUTBOUND";
    unreadCount: number;
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
}

const inboxService = {
    conversations: () => api.get<Conversation[]>("/inbox/conversations"),
    messages: (phone: string) =>
        api.get<InboxMessage[]>(`/inbox/conversations/${phone}/messages`),

    markRead: (phone: string) => api.post<void>(`/inbox/conversations/${phone}/read`, {}),
    reply: (phone: string, message: string) =>
        api.post<InboxMessage>(`/inbox/conversations/${phone}/reply`, { message }),

  replyMedia: (phone: string, file: Blob, filename: string, caption?: string) => {
    const fd = new FormData();
    fd.append("file", file, filename);
    if (caption) fd.append("caption", caption);
    return api.post<InboxMessage>(
        `/inbox/conversations/${phone}/reply-media`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
},

sendTemplate: (
    phone: string,
    request: {
        templateId: number;
        templateName: string;
        language: string;
        parameters: string[];
    }
) =>
    api.post<InboxMessage>(
        `/inbox/conversations/${phone}/send-template`,
        request
),

    media: (mediaId: string) =>
        api.get<Blob>(`/inbox/media/${mediaId}`, { responseType: "blob" } as any),
};

export default inboxService;