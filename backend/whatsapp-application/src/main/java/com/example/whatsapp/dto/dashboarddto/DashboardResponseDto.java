
package com.example.whatsapp.dto.dashboarddto;

import lombok.Data;

@Data
public class DashboardResponseDto {

    private long totalCompanies;
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
}
