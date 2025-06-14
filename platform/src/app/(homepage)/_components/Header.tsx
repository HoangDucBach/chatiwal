"use client";

import { Header as HeaderComponent } from "@/components/global/bars"
import { siteConfig } from "@/config/site"
import { HStack, Link as ChakraLink } from "@chakra-ui/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
    return (
        <HeaderComponent pos={"fixed"} top={0}>
            <NavLinks />
        </HeaderComponent>
    )
}

const NavLinks = () => {
    const pathname = usePathname();
    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + "/");
    }

    return (
        <HStack align={"end"} justify={"end"} flex={1}>
            {
                Object.entries(siteConfig.navLinks).map(([key, value]) => (
                    <ChakraLink
                        as={Link}
                        href={value.href}
                        key={key}
                        fontSize={"md"}
                        color={isActive(value.href) ? "fg" : "fg.900"}
                        borderBottom={isActive(value.href) ? "2px solid" : "none"}
                        borderColor={isActive(value.href) ? "primary.500" : "transparent"}
                        _hover={{
                            textDecoration: "none",
                            color: "fg",
                            animation: "color 0.2s ease-in-out",
                        }}
                    >
                        {value.name}
                    </ChakraLink>
                ))
            }
        </HStack>
    )
}

const Tools = () => {
    return (
        <HStack align={"right"} justify={"right"} flex={"1 0"}>
        </HStack>
    )
}