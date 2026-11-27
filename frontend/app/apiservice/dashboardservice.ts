
import api from "./apiservice";

export interface DashboardResponseDto {
    totalCompanies: number;
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
}

const dashboardService = {

    getDashboardCounts: async (): Promise<DashboardResponseDto> => {
        return await api.post<DashboardResponseDto>(
            "/dashboard/get-counts",
            {}
        );
    },

};

export default dashboardService;
