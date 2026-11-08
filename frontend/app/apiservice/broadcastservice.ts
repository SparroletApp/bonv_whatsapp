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
    // Create broadcast
    createBroadcast: async (
        data: BroadcastRequest
    ): Promise<BroadcastResponse> => {
        return api.post<BroadcastResponse>(
            "/broadcasts/create",
            data
        );
    },

    // Get all broadcasts
    getAllBroadcasts: async (): Promise<BroadcastResponse[]> => {
        return api.get<BroadcastResponse[]>(
            "/broadcasts/all"
        );
    },

    // Get broadcast by ID
    getBroadcastById: async (
        id: number
    ): Promise<BroadcastResponse> => {
        return api.post<BroadcastResponse>(
            "/broadcasts/get",
            { id }
        );
    },

    // Update broadcast
    updateBroadcast: async (
        data: BroadcastResponse
    ): Promise<BroadcastResponse> => {
        return api.post<BroadcastResponse>(
            "/broadcasts/update",
            data
        );
    },

    // Delete broadcast
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