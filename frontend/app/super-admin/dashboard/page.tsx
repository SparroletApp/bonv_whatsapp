
"use client";

import { useEffect, useState } from "react";
import "./admin-dashboard.css";

import dashboardService, {
    DashboardResponseDto
} from "@/app/apiservice/dashboardservice";

function AdminDashboard() {

    const [dashboard, setDashboard] = useState<DashboardResponseDto>({
        totalCompanies: 0,
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);

            const response = await dashboardService.getDashboardCounts();

            setDashboard(response);

        } catch (error) {
            console.error("Dashboard loading failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        {
            title: "Total Companies",
            value: dashboard.totalCompanies,
            icon: "bi-buildings",
            color: "purple",
            description: "Total registered companies"
        },
        {
            title: "Total Users",
            value: dashboard.totalUsers,
            icon: "bi-people",
            color: "blue",
            description: "Total registered users"
        },
        {
            title: "Active Users",
            value: dashboard.activeUsers,
            icon: "bi-person-check",
            color: "green",
            description: "Currently active users"
        },
        {
            title: "Inactive Users",
            value: dashboard.inactiveUsers,
            icon: "bi-person-x",
            color: "orange",
            description: "Currently inactive users"
        }
    ];

    const activePercentage = dashboard.totalUsers > 0
        ? (dashboard.activeUsers / dashboard.totalUsers) * 100
        : 0;

    const inactivePercentage = dashboard.totalUsers > 0
        ? (dashboard.inactiveUsers / dashboard.totalUsers) * 100
        : 0;

    return (
        <section className="admin-dashboards">

            <div className="admin-dashboard-header">

                <div>
                    <span className="admin-dashboard-label">
                        ADMINISTRATION
                    </span>

                    <h2>Dashboard Overview</h2>

                    <p>
                        Monitor your companies and user activities from one place.
                    </p>
                </div>

                <button
                    className="admin-dashboard-refresh"
                    onClick={fetchDashboard}
                    disabled={loading}
                >
                    <i className={`bi bi-arrow-clockwise ${loading ? "refresh-spin" : ""}`}></i>
                    Refresh
                </button>

            </div>

            <div className="admin-dashboard-stats">

                {stats.map((item, index) => (

                    <div className="admin-stat-card" key={index}>

                        <div className="admin-stat-top">

                            <div className="admin-stat-icon-wrapper">

                                <div className={`admin-stat-icon ${item.color}`}>
                                    <i className={`bi ${item.icon}`}></i>
                                </div>

                            </div>

                            <span className="admin-stat-indicator">
                                <i className="bi bi-graph-up-arrow"></i>
                                Overview
                            </span>

                        </div>

                        <div className="admin-stat-info">

                            <p>{item.title}</p>

                            <h3>
                                {loading
                                    ? "..."
                                    : item.value.toLocaleString("en-IN")}
                            </h3>

                            <span>{item.description}</span>

                        </div>

                    </div>

                ))}

            </div>

            <div className="admin-dashboard-bottom">

                <div className="admin-overview-card">

                    <div className="admin-overview-header">

                        <div>
                            <h4>User Overview</h4>
                            <p>Account status distribution</p>
                        </div>

                        <div className="admin-overview-icon">
                            <i className="bi bi-pie-chart"></i>
                        </div>

                    </div>

                    <div className="admin-overview-total">

                        <span>Total Users</span>

                        <h2>
                            {loading
                                ? "..."
                                : dashboard.totalUsers.toLocaleString("en-IN")}
                        </h2>

                    </div>

                    <div className="admin-overview-progress">

                        <div
                            className="admin-overview-active-progress"
                            style={{
                                width: `${activePercentage}%`
                            }}
                        ></div>

                        <div
                            className="admin-overview-inactive-progress"
                            style={{
                                width: `${inactivePercentage}%`
                            }}
                        ></div>

                    </div>

                    <div className="admin-overview-legend">

                        <div className="admin-legend-item">

                            <div className="admin-legend-label">
                                <span className="admin-legend-dot active"></span>
                                Active Users
                            </div>

                            <strong>
                                {loading
                                    ? "..."
                                    : `${activePercentage.toFixed(1)}%`}
                            </strong>

                            <small>
                                {loading ? "..." : dashboard.activeUsers}
                            </small>

                        </div>

                        <div className="admin-legend-item">

                            <div className="admin-legend-label">
                                <span className="admin-legend-dot inactive"></span>
                                Inactive Users
                            </div>

                            <strong>
                                {loading
                                    ? "..."
                                    : `${inactivePercentage.toFixed(1)}%`}
                            </strong>

                            <small>
                                {loading ? "..." : dashboard.inactiveUsers}
                            </small>

                        </div>

                    </div>

                </div>

                <div className="admin-summary-card">

                    <div className="admin-overview-header">

                        <div>
                            <h4>Quick Summary</h4>
                            <p>Platform statistics</p>
                        </div>

                        <div className="admin-overview-icon">
                            <i className="bi bi-bar-chart-line"></i>
                        </div>

                    </div>

                    <div className="admin-summary-item">

                        <div className="admin-summary-icon company">
                            <i className="bi bi-buildings"></i>
                        </div>

                        <div>
                            <span>Registered Companies</span>
                            <strong>
                                {loading ? "..." : dashboard.totalCompanies}
                            </strong>
                        </div>

                    </div>

                    <div className="admin-summary-item">

                        <div className="admin-summary-icon users">
                            <i className="bi bi-people"></i>
                        </div>

                        <div>
                            <span>Total User Accounts</span>
                            <strong>
                                {loading ? "..." : dashboard.totalUsers}
                            </strong>
                        </div>

                    </div>

                    <div className="admin-summary-item">

                        <div className="admin-summary-icon active">
                            <i className="bi bi-person-check"></i>
                        </div>

                        <div>
                            <span>Active Accounts</span>
                            <strong>
                                {loading ? "..." : dashboard.activeUsers}
                            </strong>
                        </div>

                    </div>

                    <div className="admin-summary-item">

                        <div className="admin-summary-icon inactive">
                            <i className="bi bi-person-x"></i>
                        </div>

                        <div>
                            <span>Inactive Accounts</span>
                            <strong>
                                {loading ? "..." : dashboard.inactiveUsers}
                            </strong>
                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
}

export default AdminDashboard;
