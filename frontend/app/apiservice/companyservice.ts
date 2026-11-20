
import api from "./apiservice";

export interface CompanyRequestDto {
    companyName: string;

    // Email Configuration
    mailUsername: string;
    mailPassword: string;

    // WhatsApp Configuration
    whatsappAccessToken: string;
    whatsappApiVersion: string;
    whatsappAppId: string;
    whatsappBusinessAccountId: string;
    whatsappPhoneNumberId: string;
    whatsappVerifyToken: string;
    whatsappAppSecret: string;
}

export interface CompanyIdDto {
    id: number;
}

export interface CompanyUpdateDto {
    id: number;
    companyName: string;

    // Email Configuration
    mailUsername: string;
    mailPassword: string;

    // WhatsApp Configuration
    whatsappAccessToken: string;
    whatsappApiVersion: string;
    whatsappAppId: string;
    whatsappBusinessAccountId: string;
    whatsappPhoneNumberId: string;
    whatsappVerifyToken: string;
    whatsappAppSecret: string;
}

export interface CompanyResponseDto {
    id: number;
    companyName: string;

    // Email Configuration
    mailUsername: string;
    mailPassword: string;

    // WhatsApp Configuration
    whatsappAccessToken: string;
    whatsappApiVersion: string;
    whatsappAppId: string;
    whatsappBusinessAccountId: string;
    whatsappPhoneNumberId: string;
    whatsappVerifyToken: string;
    whatsappAppSecret: string;

    createdAt: string;
    updatedAt: string;
}

const companyService = {

    createCompany: async (
        dto: CompanyRequestDto
    ): Promise<CompanyResponseDto> => {
        return api.post<CompanyResponseDto>(
            "/companies/create",
            dto
        );
    },

    getAllCompanies: async (): Promise<CompanyResponseDto[]> => {
        return api.post<CompanyResponseDto[]>(
            "/companies/get-all",
            {}
        );
    },

    getCompanyById: async (
        dto: CompanyIdDto
    ): Promise<CompanyResponseDto> => {
        return api.post<CompanyResponseDto>(
            "/companies/get-by-id",
            dto
        );
    },

    updateCompany: async (
        dto: CompanyUpdateDto
    ): Promise<CompanyResponseDto> => {
        return api.post<CompanyResponseDto>(
            "/companies/update",
            dto
        );
    },

    deleteCompany: async (
        dto: CompanyIdDto
    ): Promise<string> => {
        return api.post<string>(
            "/companies/delete",
            dto
        );
    },
};

export default companyService;
