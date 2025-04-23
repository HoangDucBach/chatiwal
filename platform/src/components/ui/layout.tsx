"use client"

import { Center, CenterProps, chakra } from "@chakra-ui/react";

interface PageLayoutProps extends CenterProps {
}
export function PageLayout({ children, ...props }: PageLayoutProps) {
    return (
        <chakra.main w={"full"} h={"full"} overflowY={"auto"}>
            <Center {...props} w={"full"} h={"full"}>
                {children}
            </Center>
        </ chakra.main>
    )
}