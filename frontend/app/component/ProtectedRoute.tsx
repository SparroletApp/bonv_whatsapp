
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
        const role = (
            sessionStorage.getItem("role") || ""
        ).toUpperCase();

        const isAdmin = role === "ADMIN";
        const isManager = role === "MANAGER";
        const isStaff = role === "STAFF";

        const isValidRole = isAdmin || isManager || isStaff;

        const isSuperAdminRoute =
            pathname === "/super-admin" ||
            pathname.startsWith("/super-admin/");

        if (pathname === "/forget-password") {
            setIsChecking(false);
            return;
        }

        if (
            pathname === "/" ||
            pathname === "/super-admin/login"
        ) {

            if (token && isValidRole) {

                if (isAdmin) {
                    router.replace("/super-admin/dashboard");
                } else {
                    router.replace("/dashboard");
                }

                return;
            }

            if (token && !isValidRole) {
                sessionStorage.clear();
            }

            setIsChecking(false);
            return;
        }

        if (!token) {

            sessionStorage.clear();

            router.replace(
                isSuperAdminRoute
                    ? "/super-admin/login"
                    : "/"
            );

            return;
        }

        if (!isValidRole) {

            sessionStorage.clear();
            router.replace("/");

            return;
        }

        if (isAdmin) {

            if (!isSuperAdminRoute) {
                router.replace("/super-admin/dashboard");
                return;
            }

            setIsChecking(false);
            return;
        }

        if (isManager || isStaff) {

            if (isSuperAdminRoute) {
                router.replace("/dashboard");
                return;
            }

            setIsChecking(false);
            return;
        }

    }, [pathname, router]);

    if (isChecking) {
        return (
            <div className="route-loader">
                <div className="users-loader"></div>
                <p>Checking authentication...</p>
            </div>
        );
    }

    return <>{children}</>;
}
