
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "./sidebar.css";

function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [collapsed, setCollapsed] = useState(true);
    const [role, setRole] = useState("");

    useEffect(() => {
        const userRole = sessionStorage.getItem("role") || "";
        setRole(userRole.toUpperCase());
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--sidebar-width",
            collapsed ? "78px" : "265px"
        );

        return () => {
            document.documentElement.style.removeProperty("--sidebar-width");
        };
    }, [collapsed]);

    const adminMenuItems = [
        {
            name: "Dashboard",
            icon: "bi-grid-1x2",
            path: "/super-admin/dashboard"
        },
        {
            name: "Companies",
            icon: "bi-buildings",
            path: "/super-admin/companies"
        }
    ];

    const userMenuItems = [
        {
            name: "Overview",
            icon: "bi-grid-1x2",
            path: "/dashboard"
        },
        {
            name: "Tags",
            icon: "bi-tags",
            path: "/tags"
        },
        {
            name: "Contacts",
            icon: "bi-people",
            path: "/contacts"
        },
        {
            name: "Campaigns",
            icon: "bi-megaphone",
            path: "/campaign"
        },
        {
            name: "Templates",
            icon: "bi-file-earmark-text",
            path: "/templates"
        },
        {
            name: "Inbox",
            icon: "bi-inbox",
            path: "/inbox"
        }
    ];

    const menuItems =
        role === "ADMIN"
            ? adminMenuItems
            : role === "MANAGER" || role === "STAFF"
                ? userMenuItems
                : [];

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(path + "/");
    };

    const handleLogout = async () => {

        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to logout from your account?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Logout",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#064e45",
            cancelButtonColor: "#899a94",
            reverseButtons: true,
            allowOutsideClick: false
        });

        if (result.isConfirmed) {

            const currentRole = sessionStorage.getItem("role") || "";

            sessionStorage.clear();
            localStorage.removeItem("access_token");

            await Swal.fire({
                title: "Logged Out!",
                text: "You have been successfully logged out.",
                icon: "success",
                confirmButtonColor: "#064e45",
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });

            if (currentRole.toUpperCase() === "ADMIN") {
                router.replace("/super-admin/login");
            } else {
                router.replace("/");
            }
        }
    };

    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : "expanded"}`}>

            {/* LOGO */}
            <div className={`sidebar-logo ${collapsed ? "logo-collapsed" : "logo-expanded"}`}>

                <div className="bonv-brand">
                    {collapsed ? (
                        <img
                            src="/logo-bonv.png"
                            alt="Bonv Logo"
                            className="bonv-icon-image"
                        />
                    ) : (
                        <img
                            src="/logo-02.png"
                            alt="Bonv"
                            className="bonv-full-image"
                        />
                    )}
                </div>

                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(prev => !prev)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} />
                </button>
            </div>

            {/* MENU */}
            <div className="sidebar-menu">

                {!collapsed && (
                    <p className="sidebar-heading">
                        {role === "ADMIN"
                            ? "SUPER ADMIN"
                            : role === "MANAGER"
                                ? "MANAGER MENU"
                                : role === "STAFF"
                                    ? "STAFF MENU"
                                    : "MENU"}
                    </p>
                )}

                <nav className="sidebar-nav">

                    {menuItems.map((item) => (
                        <Link
                            href={item.path}
                            key={item.path}
                            className={`sidebar-link ${
                                isActive(item.path) ? "active" : ""
                            }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <i className={`bi ${item.icon}`} />

                            {!collapsed && (
                                <span className="sidebar-link-text">
                                    {item.name}
                                </span>
                            )}

                            {collapsed && (
                                <span className="sidebar-tooltip">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    ))}

                </nav>
            </div>

            {/* LOGOUT */}
            <div className="sidebar-bottom">

                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={handleLogout}
                    title={collapsed ? "Logout" : undefined}
                >
                    <i className="bi bi-box-arrow-right" />

                    {!collapsed && (
                        <span className="sidebar-link-text">
                            Logout
                        </span>
                    )}

                    {collapsed && (
                        <span className="sidebar-tooltip">
                            Logout
                        </span>
                    )}
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;
