
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "../sidebar/page";
import ProtectedRoute from "../component/ProtectedRoute";

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const hideSidebar = pathname === "/";

    return (
        <ProtectedRoute>
            <div className={`app-layout ${hideSidebar ? "no-sidebar" : ""}`}>
                {!hideSidebar && <Sidebar />}

                <main className="main-content">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
