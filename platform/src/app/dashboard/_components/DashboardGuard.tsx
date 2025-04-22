"use client"

import { NotConnectedDialog } from "./NotConnectedDialog";

interface Props extends React.PropsWithChildren { }
export function DashboardGuard({ children }: Props) {
    return (
        <>
            <NotConnectedDialog />
            {children}
        </>
    )
}