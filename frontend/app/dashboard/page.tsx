
import "./dashboard.css";

function Dashboard() {
    const stats = [
        {
            title: "Total Contacts",
            value: "12,450",
            change: "+12.5%",
            icon: "bi-people",
            type: "green",
            description: "Compared to last month",
        },
        {
            title: "Messages Sent",
            value: "48,290",
            change: "+18.2%",
            icon: "bi-send",
            type: "blue",
            description: "Compared to last month",
        },
        {
            title: "Messages Delivered",
            value: "45,820",
            change: "+9.8%",
            icon: "bi-check2-circle",
            type: "purple",
            description: "Compared to last month",
        },
        {
            title: "Unread Messages",
            value: "128",
            change: "12 new",
            icon: "bi-chat-dots",
            type: "orange",
            description: "Awaiting your response",
        },
    ];

    const activities = [
        {
            name: "Welcome Campaign",
            type: "Broadcast",
            date: "Today, 10:30 AM",
            status: "Completed",
            sent: "2,450",
        },
        {
            name: "New Product Update",
            type: "Template",
            date: "Today, 09:15 AM",
            status: "Completed",
            sent: "1,820",
        },
        {
            name: "Customer Follow-up",
            type: "Broadcast",
            date: "Yesterday, 04:20 PM",
            status: "In Progress",
            sent: "850",
        },
        {
            name: "Order Confirmation",
            type: "Template",
            date: "Yesterday, 11:45 AM",
            status: "Completed",
            sent: "1,250",
        },
    ];

    return (
        <section className="dashboard">
            <div className="dashboard-header">
                <div>
                    <span className="dashboard-subtitle">
                        OVERVIEW
                    </span>
                    <h1>Dashboard</h1>
                    <p>
                        Welcome back! Here's what's happening with your WhatsApp account.
                    </p>
                </div>

                <div className="dashboard-header-actions">
                    <button className="dashboard-date-btn">
                        <i className="bi bi-calendar3"></i>
                        Last 30 Days
                        <i className="bi bi-chevron-down"></i>
                    </button>

                    <button className="dashboard-refresh-btn" aria-label="Refresh">
                        <i className="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>

            <div className="dashboard-stats">
                {stats.map((item) => (
                    <div className="stat-card" key={item.title}>
                        <div className="stat-card-top">
                            <div className={`stat-icon ${item.type}`}>
                                <i className={`bi ${item.icon}`}></i>
                            </div>

                            <span className="stat-change">
                                <i className="bi bi-arrow-up-right"></i>
                                {item.change}
                            </span>
                        </div>

                        <div className="stat-info">
                            <p>{item.title}</p>
                            <h2>{item.value}</h2>
                            <span>{item.description}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="dashboard-middle">
                <div className="dashboard-panel analytics-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Message Analytics</h3>
                            <p>Overview of your message performance</p>
                        </div>

                        <button className="panel-menu-btn" aria-label="More options">
                            <i className="bi bi-three-dots"></i>
                        </button>
                    </div>

                    <div className="analytics-summary">
                        <div>
                            <span>Total Messages</span>
                            <h2>48,290</h2>
                        </div>

                        <div className="analytics-legend">
                            <span><i className="legend-dot sent-dot"></i> Sent</span>
                            <span><i className="legend-dot delivered-dot"></i> Delivered</span>
                            <span><i className="legend-dot read-dot"></i> Read</span>
                        </div>
                    </div>

                    <div className="analytics-chart">
                        <div className="chart-y-axis">
                            <span>5k</span>
                            <span>4k</span>
                            <span>3k</span>
                            <span>2k</span>
                            <span>1k</span>
                            <span>0</span>
                        </div>

                        <div className="chart-content">
                            <div className="chart-grid">
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <span key={item}></span>
                                ))}
                            </div>

                            <div className="chart-bars">
                                {[
                                    [42, 35, 28],
                                    [55, 46, 38],
                                    [38, 32, 25],
                                    [70, 58, 48],
                                    [62, 52, 43],
                                    [85, 72, 60],
                                    [58, 49, 39],
                                    [92, 80, 68],
                                    [72, 61, 50],
                                    [100, 87, 75],
                                    [82, 70, 58],
                                    [90, 78, 65],
                                ].map((values, index) => (
                                    <div className="chart-bar-group" key={index}>
                                        {values.map((height, i) => (
                                            <div
                                                key={i}
                                                className={`chart-bar bar-${i}`}
                                                style={{ height: `${height}%` }}
                                            ></div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="chart-x-axis">
                                {["01", "03", "05", "07", "09", "11", "13", "15", "17", "19", "21", "23"].map((day) => (
                                    <span key={day}>{day}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="chart-footer">
                        <span>Message activity throughout the month</span>
                        <span>November 2026</span>
                    </div>
                </div>
                <div className="dashboard-panel quick-actions-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Quick Actions</h3>
                            <p>Manage your WhatsApp easily</p>
                        </div>
                    </div>

                    <div className="quick-actions-list">
                        <button className="quick-action">
                            <div className="quick-action-icon green">
                                <i className="bi bi-person-plus"></i>
                            </div>
                            <div>
                                <h4>Add Contact</h4>
                                <p>Add a new customer</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>

                        <button className="quick-action">
                            <div className="quick-action-icon blue">
                                <i className="bi bi-megaphone"></i>
                            </div>
                            <div>
                                <h4>Create Broadcast</h4>
                                <p>Send messages in bulk</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>

                        <button className="quick-action">
                            <div className="quick-action-icon purple">
                                <i className="bi bi-file-earmark-plus"></i>
                            </div>
                            <div>
                                <h4>Create Template</h4>
                                <p>Create a message template</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>

                        <button className="quick-action">
                            <div className="quick-action-icon orange">
                                <i className="bi bi-chat-left-text"></i>
                            </div>
                            <div>
                                <h4>Open Inbox</h4>
                                <p>View customer conversations</p>
                            </div>
                            <i className="bi bi-arrow-up-right action-arrow"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div className="dashboard-bottom">
                <div className="dashboard-panel recent-activity-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Recent Activity</h3>
                            <p>Latest WhatsApp activities</p>
                        </div>

                        <button className="view-all-btn">
                            View All <i className="bi bi-arrow-right"></i>
                        </button>
                    </div>

                    <div className="activity-table-wrapper">
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>TYPE</th>
                                    <th>DATE</th>
                                    <th>MESSAGES</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {activities.map((item) => (
                                    <tr key={item.name}>
                                        <td>
                                            <div className="activity-name">
                                                <div className="activity-icon">
                                                    <i className="bi bi-whatsapp"></i>
                                                </div>
                                                <strong>{item.name}</strong>
                                            </div>
                                        </td>
                                        <td>{item.type}</td>
                                        <td>{item.date}</td>
                                        <td>{item.sent}</td>
                                        <td>
                                            <span className={`activity-status ${
                                                item.status === "Completed" ? "completed" : "progress"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="dashboard-panel delivery-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Delivery Overview</h3>
                            <p>Message delivery performance</p>
                        </div>
                    </div>

                    <div className="delivery-chart">
                        <div className="delivery-circle">
                            <div className="delivery-circle-inner">
                                <h2>95%</h2>
                                <span>Delivered</span>
                            </div>
                        </div>
                    </div>

                    <div className="delivery-details">
                        <div>
                            <span><i className="legend-dot sent-dot"></i> Delivered</span>
                            <strong>45,820</strong>
                        </div>
                        <div>
                            <span><i className="legend-dot failed-dot"></i> Failed</span>
                            <strong>2,470</strong>
                        </div>
                    </div>
                </div>

            </div>

        </section>
    );
}

export default Dashboard;
