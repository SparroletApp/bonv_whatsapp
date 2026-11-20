"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("access_token");
        const role = sessionStorage.getItem("role")?.toUpperCase();

        // Public routes
        const publicRoutes = [
            "/",
            "/super-admin/login",
            "/forget-password",
        ];

        if (publicRoutes.includes(pathname)) {
            if (token && role === "ADMIN") {
                router.replace("/super-admin/dashboard");
                return;
            }

            if (token && role !== "ADMIN") {
                sessionStorage.clear();
            }

            setIsChecking(false);
            return;
        }

        // Protected routes
        if (!token) {
            router.replace("/");
            return;
        }

        if (role !== "ADMIN") {
            sessionStorage.clear();
            router.replace("/super-admin/login");
            return;
        }

        setIsChecking(false);

    }, [pathname, router]);

    if (isChecking) {
        return null;
    }

    return <>{children}</>;
}