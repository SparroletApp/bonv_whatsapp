import api from "./apiservice";

export interface BroadcastResponse {
    id: number;
    name: string;
}

export interface BroadcastRequest {
    name: string;
}

export interface BroadcastIdRequest {
    id: number;
}

const broadcastService = {
    createBroadcast: async (
        data: BroadcastRequest
    ): Promise<BroadcastResponse> => {
        return api.post<BroadcastResponse>(
            "/broadcasts/create",
            data
        );
    },

    getAllBroadcasts: async (): Promise<BroadcastResponse[]> => {
        return api.get<BroadcastResponse[]>(
            "/broadcasts/all"
        );
    },

    getBroadcastById: async (
        id: number
    ): Promise<BroadcastResponse> => {
        return api.post<BroadcastResponse>(
            "/broadcasts/get",
            { id }
        );
    },

    updateBroadcast: async (
        data: BroadcastResponse
    ): Promise<BroadcastResponse> => {
        return api.post<BroadcastResponse>(
            "/broadcasts/update",
            data
        );
    },

    deleteBroadcast: async (
        id: number
    ): Promise<string> => {
        return api.post<string>(
            "/broadcasts/delete",
            { id }
        );
    },
};

export default broadcastService;