
import api from "./apiservice";

export interface TourConnectRequestDto {
    id?: number;
    companyId?: number;
    companyTourId?: number;
    companyName?: string;
}

export interface TourConnectResponseDto {
    id: number;
    companyId: number;
    companyTourId: number | null;
    companyName: string;
    connectedAt: string;
}

const tourConnectService = {
    create: async (
        data: TourConnectRequestDto
    ): Promise<TourConnectResponseDto> => {
        return api.post<TourConnectResponseDto>(
            "/tour-connect/create",
            data
        );
    },

    getAll: async (): Promise<TourConnectResponseDto[]> => {
        return api.post<TourConnectResponseDto[]>(
            "/tour-connect/get-all",
            {}
        );
    },

    getById: async (
        id: number
    ): Promise<TourConnectResponseDto> => {
        return api.post<TourConnectResponseDto>(
            "/tour-connect/get-by-id",
            { id }
        );
    },

    getByCompanyId: async (
        companyId: number
    ): Promise<TourConnectResponseDto> => {
        return api.post<TourConnectResponseDto>(
            "/tour-connect/get-by-company-id",
            { companyId }
        );
    },

    update: async (
        data: TourConnectRequestDto
    ): Promise<TourConnectResponseDto> => {
        return api.post<TourConnectResponseDto>(
            "/tour-connect/update",
            data
        );
    },

    delete: async ( 
        id: number
    ): Promise<string> => {
        return api.post<string>(
            "/tour-connect/delete",
            { id }
        );
    },
};

export default tourConnectService;
