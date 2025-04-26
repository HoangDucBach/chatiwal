"use client"

import { chakra, Heading, HStack, Link, StackProps, Text, VStack } from "@chakra-ui/react";
import { Image as ChakraImage } from "@chakra-ui/react"
import NextImage from "next/image"
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { ConnectButton } from "./wallet";

interface Props extends StackProps { }

export function Header({ children, ...props }: Props) {
    return (
        <chakra.header w={"full"} bg={"bg.100"} shadow={"custom.md"} rounded={"2xl"} py={"1"} px={"2"}>
            <HStack justifyContent={"space-between"} alignItems={"center"}>
                <Brand />
                {children}
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
                    width={32}
                    height={32}
                    priority
                />
            </ChakraImage>
            <VStack align={"start"} gap={0}>
                <Heading as={"h1"} size={"lg"} fontWeight={"semibold"}>
                    {siteConfig.name}
                </Heading>
                <Text fontSize={"sm"} color={"fg.700"}>
                    Y3 Model
                </Text>
            </VStack>
        </HStack>
    )
}