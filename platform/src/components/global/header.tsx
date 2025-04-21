"use client"

import { chakra, Heading, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { Image as ChakraImage } from "@chakra-ui/react"
import NextImage from "next/image"
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { ConnectButton } from "./wallet";

interface Props { }

export function Header({ }: Props) {
    return (
        <chakra.header w={"full"}>
            <HStack justifyContent={"space-between"} alignItems={"center"}>
                <Brand />
                <NavLinks />
                <Tools />
            </HStack>
        </chakra.header>
    )
}

const Brand = () => {
    return (
        <HStack align={"center"} flex={"1 0"}>
            <ChakraImage asChild>
                <NextImage
                    src={"/Favicon.svg"}
                    alt={siteConfig.name}
                    width={64}
                    height={64}
                />
            </ChakraImage>
            <VStack align={"start"} gap={0}>
                <Heading as={"h1"} size={"2xl"} fontWeight={"bold"}>
                    {siteConfig.name}
                </Heading>
                <Text fontSize={"sm"} color={"fg.700"}>
                    Y3 Protocol
                </Text>
            </VStack>
        </HStack>
    )
}

const NavLinks = () => {
    return (
        <HStack flexGrow={"1"} align={"center"} justify={"center"} flex={"1 0"}>
            {siteConfig.navLinks.map((link) => (
                <Link asChild key={link.href} variant={"plain"} color={"fg.700"} _hover={{ color: "fg", transition: "color ease-in-out 0.5s" }}>
                    <NextLink href={link.href}>
                        {link.name}
                    </NextLink>
                </Link>
            ))}
        </HStack>
    )
}

const Tools = () => {
    return (
        <HStack align={"right"} justify={"right"} flex={"1 0"}>
            <ConnectButton />
        </HStack>
    )
}