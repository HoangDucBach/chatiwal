"use client"

import { useCurrentAccount } from "@mysten/dapp-kit";
import { NotConnectedDialog } from "./_components/NotConnectedDialog";

function DashboardGuard({ children }: React.PropsWithChildren) {
    const currentAccount = useCurrentAccount();
    console.log("currentAccount", currentAccount);
    return (
        <>
            <NotConnectedDialog
                open={!currentAccount}
            />
            {
                currentAccount ? (
                    <>{children}</>
                ) : null
            }
        </>
    )

}

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