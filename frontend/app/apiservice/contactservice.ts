
import api from "./apiservice";
export interface ContactCreateDto {
    name: string;
    phone: string;
    email?: string;
    categoryIds: number[];
}

export interface ContactResponseDto {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    categoryIds: number[];
    createdAt: string;
    updatedAt: string | null;
}


export interface ContactUpdateDto {
    id: number;
    name: string;
    phone: string;
    email: string;
    categoryIds: number[];
}

export interface CategoryIdDto {
    id: number;
}

export interface ContactIdDto {
    id: number;
}

export interface BroadcastAssignContactsDto {
    broadcastId: number;
    contactIds: number[];
}

export interface ApiErrorResponse {
    status: number;
    message: string;
}

export interface BroadcastIdDto {
    id: number;
}

const contactService = {

    createContact: async (
        data: ContactCreateDto
    ): Promise<ContactResponseDto> => {
        return await api.post<ContactResponseDto>(
            "/contacts/create",
            data
        );
    },


    getAllContacts: async (): Promise<ContactResponseDto[]> => {
        return await api.post<ContactResponseDto[]>(
            "/contacts/get-all",
            {}
        );
    },


    getContactById: async (
        data: ContactIdDto
    ): Promise<ContactResponseDto> => {
        return await api.post<ContactResponseDto>(
            "/contacts/get-by-id",
            data
        );
    },

    updateContact: async (
        data: ContactUpdateDto
    ): Promise<ContactResponseDto> => {
        return await api.post<ContactResponseDto>(
            "/contacts/update",
            data
        );
    },

    deleteContact: async (
        data: ContactIdDto
    ): Promise<string> => {
        return await api.post<string>(
            "/contacts/delete",
            data
        );
    },

    assignContactsToBroadcast: async (
        data: BroadcastAssignContactsDto
    ): Promise<string> => {
        return api.post<string>(
            "/contacts/assign-broadcast",
            data
        );
    },

        getContactsByCategoryId: async (
        data: CategoryIdDto
    ): Promise<ContactResponseDto[]> => {
        return await api.post<ContactResponseDto[]>(
            "/contacts/get-by-category",
            data
        );
    },

getContactsByBroadcastId: async (
    data: BroadcastIdDto
): Promise<ContactResponseDto[]> => {
    return await api.post<ContactResponseDto[]>(
        "/contacts/get-by-broadcast",
        data
    );
},
};




export default contactService;
