"use client"

import { chakra } from "@chakra-ui/react";

interface PageLayoutProps extends React.PropsWithChildren {
}
export function PageLayout({ children }: PageLayoutProps) {
    return (
        <chakra.main w={"full"} h={"full"}>
            {children}
        </chakra.main>
    )
}