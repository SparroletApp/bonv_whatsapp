
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

        if (pathname === "/") {
            if (token) {
                router.replace("/dashboard");
                return;
            }

            setIsChecking(false);
            return;
        }

        if (!token) {
            router.replace("/");
            return;
        }

        setIsChecking(false);

    }, [pathname, router]);

    if (isChecking) {
        return null;
    }

    return <>{children}</>;
}
