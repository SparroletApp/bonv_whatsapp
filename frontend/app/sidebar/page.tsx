
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

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--sidebar-width",
            collapsed ? "78px" : "265px"
        );

        return () => {
            document.documentElement.style.removeProperty("--sidebar-width");
        };
    }, [collapsed]);

       const menuItems = [
    { name: "Overview", icon: "bi-grid-1x2", path: "/dashboard" },
    { name: "Broadcasts", icon: "bi-tags", path: "/broadcasts" },
    { name: "Contacts", icon: "bi-people", path: "/contacts" },
    { name: "Campaigns", icon: "bi-megaphone", path: "/campaign" },
    { name: "Templates", icon: "bi-file-earmark-text", path: "/templates" },
    { name: "Inbox", icon: "bi-inbox", path: "/inbox" },

    ];

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
            allowOutsideClick: false,
        });

        if (result.isConfirmed) {
            sessionStorage.clear();
            localStorage.removeItem("access_token");

            await Swal.fire({
                title: "Logged Out!",
                text: "You have been successfully logged out.",
                icon: "success",
                confirmButtonColor: "#064e45",
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false,
            });

            router.replace("/");
        }
    };

    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : "expanded"}`}>



            <div className={`sidebar-logo ${collapsed ? "logo-collapsed" : "logo-expanded"}`}>

                {collapsed ? (
                    <div className="logo-icon">
                        <img src="/logo-replace.png" />
                    </div>
                ) : (
                    <div className="expanded-logo">
                        <img
                            src="/logo-bonv.png"
                            alt="WhatsAppPro Logo"
                            className="expanded-logo-img"
                        />

                    </div>
                )}

                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={() => setCollapsed((prev) => !prev)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} />
                </button>

            </div>


            <div className="sidebar-menu">
                {!collapsed && (
                    <p className="sidebar-heading">MENU</p>
                )}

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            href={item.path}
                            key={item.path}
                            className={`sidebar-link ${isActive(item.path) ? "active" : ""
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

        </aside >
    );
}

export default Sidebar;
