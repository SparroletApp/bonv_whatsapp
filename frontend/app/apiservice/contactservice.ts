
import api from "./apiservice";

export interface ContactResponseDto {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    categoryId: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string | null;
}

export interface ContactCreateDto {
    name: string;
    phone: string;
    email?: string;
    categoryId: number;
}

export interface ContactUpdateDto {
    id: number;
    name: string;
    phone: string;
    email?: string;
    categoryId: number;
}

export interface ContactIdDto {
    id: number;
}

export interface ApiErrorResponse {
    status: number;
    message: string;
}

const contactService = {

    // Create Contact
    createContact: async (
        data: ContactCreateDto
    ): Promise<ContactResponseDto> => {
        return await api.post<ContactResponseDto>(
            "/contacts/create",
            data
        );
    },

    // Get All Contacts
    getAllContacts: async (): Promise<ContactResponseDto[]> => {
        return await api.post<ContactResponseDto[]>(
            "/contacts/get-all",
            {}
        );
    },

    // Get Contact By ID
    getContactById: async (
        data: ContactIdDto
    ): Promise<ContactResponseDto> => {
        return await api.post<ContactResponseDto>(
            "/contacts/get-by-id",
            data
        );
    },

    // Update Contact
    updateContact: async (
        data: ContactUpdateDto
    ): Promise<ContactResponseDto> => {
        return await api.post<ContactResponseDto>(
            "/contacts/update",
            data
        );
    },

    // Delete Contact
    deleteContact: async (
        data: ContactIdDto
    ): Promise<string> => {
        return await api.post<string>(
            "/contacts/delete",
            data
        );
    },
};

export default contactService;
