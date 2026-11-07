
import api from "./apiservice";

export interface WhatsappRequestDto {
    recipientName: string;
    recipientPhone: string;
    message?: string;
    templateName?: string;
    languageCode?: string;
}

export interface WhatsappResponseDto {
    id: number;
    recipientName: string;
    recipientPhone: string;
    status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    whatsappMessageId: string | null;
    errorMessage: string | null;
}

const whatsappService = {

    bulkSend: async (
        requests: WhatsappRequestDto[]
    ): Promise<WhatsappResponseDto[]> => {

        return await api.post<WhatsappResponseDto[]>(
            "/whatsapp/bulk-send",
            requests
        );
    },

    getAllMessages: async (): Promise<WhatsappResponseDto[]> => {

        return await api.get<WhatsappResponseDto[]>(
            "/whatsapp/all"
        );
    },

    getMessagesByStatus: async (
        status: "PENDING" | "PROCESSING" | "SENT" | "FAILED"
    ): Promise<WhatsappResponseDto[]> => {

        return await api.get<WhatsappResponseDto[]>(
            `/whatsapp/status/${status}`
        );
    },
};

export default whatsappService;
