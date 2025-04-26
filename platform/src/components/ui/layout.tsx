"use client"

import { CenterProps, chakra, StackProps, VStack } from "@chakra-ui/react";

interface PageLayoutProps extends CenterProps {
}
export function PageLayout({ children, ...props }: PageLayoutProps) {
    return (
        <chakra.main w={"full"} h={"full"}  {...props}>
            {children}
        </ chakra.main>
    )
}

interface LayoutLayoutProps extends StackProps {
}
export function LayoutLayout({ children, ...props }: LayoutLayoutProps) {
    return (
        <VStack zIndex={"0"} w={"full"} h={"full"} gap={"6"} {...props}>
            {children}
        </VStack>
    )
}