"use client"

import { Center, CenterProps, chakra, HStack, StackProps, VStack, Text } from "@chakra-ui/react";

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
        <VStack zIndex={"0"} w={"full"} h={"full"} {...props}>
            {children}
        </VStack>
    )
}


interface MenuGroupItemProps extends StackProps {
    label?: string;
    icon?: React.ReactNode;
    endContent?: React.ReactNode;
}
export function MenuGroupItem({
    label,
    icon,
    endContent,
    children,
    ...props
}: MenuGroupItemProps) {
    return (
        <VStack w={"full"} {...props}>
            <HStack justify={"space-between"} w={"full"}>
                <Text pl={"2"} fontSize={"sm"} fontWeight={"medium"} color={"fg.900"} textTransform="uppercase">
                    {icon}
                    {label}
                </Text>
                {endContent}
            </HStack>
            {children}
        </VStack>
    )
}

interface MenuItemProps extends StackProps {
}
export function MenuItem({ children, ...props }: MenuItemProps) {
    return (
        <Center
            w={"full"}
        >
            {children}
        </Center>
    )
}