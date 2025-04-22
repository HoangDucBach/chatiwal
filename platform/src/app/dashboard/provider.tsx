"use client"

import { DashboardGuard } from "./_components/DashboardGuard";

export function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <DashboardGuard>
            {children}
        </DashboardGuard>
    );
}