"use client"

import { chakra, Heading, HStack, Link, StackProps, Text, VStack } from "@chakra-ui/react";
import { Image } from "@chakra-ui/react"
import NextImage from "next/image"
import NextLink from "next/link"
import { siteConfig } from "@/config/site";
import { CgLoadbarDoc } from "react-icons/cg";
import { Tooltip } from "../ui/tooltip";
import { Button } from "../ui/button";


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
        <HStack asChild align={"center"} flex={"1 0"} cursor={"pointer"}>
            <NextLink href="/">
                <Image asChild>
                    <NextImage
                        src={"/Favicon.svg"}
                        alt={siteConfig.name}
                        width={32}
                        height={32}
                        priority
                    />
                </Image>
                <VStack align={"start"} gap={0}>
                    <Heading as={"h1"} size={"lg"} fontWeight={"semibold"}>
                        {siteConfig.name}
                    </Heading>
                    <Text fontSize={"sm"} color={"fg.700"}>
                        Y3 Model
                    </Text>
                </VStack>
            </NextLink>
        </HStack>
    )
}

interface LeftBarProps extends StackProps {
}

export function LeftBar({ children, ...props }: LeftBarProps) {
    const Brand = () => {
        return (

            <Image
                asChild
                outline={"1px solid"}
                outlineColor={"bg.300"}
                outlineOffset={"1px"}
                rounded={"lg"}
            >
                <NextImage
                    alt="logo"
                    width={40}
                    height={40}

                    src={"/BgFavicon.png"}
                >

                </NextImage>
            </Image>
        )
    }

    const links = [
        {
            label: "Docs",
            icon: <CgLoadbarDoc size={20} />,
            href: "/docs",
        }
    ]

    return (
        <chakra.aside
            w={"fit"}
            h={"full"}
            px={"4"}
            {...props}
        >
            <VStack align={"center"} w={"full"} h={"full"}>
                <Brand />
                <VStack>
                    {
                        links.map((link) => (
                            <Tooltip content={link.label} key={link.label} positioning={{
                                placement: "right",
                            }}>
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    asChild
                                >
                                    <Button
                                        rounded={"lg"}
                                        color={"fg.900"}
                                        _hover={{
                                            bg: "bg.200",
                                            color: "fg"
                                        }}
                                        variant={"plain"}
                                        p={"1"}
                                    >
                                        {link.icon}
                                    </Button>
                                </Link>
                            </Tooltip>
                        ))
                    }
                </VStack>
            </VStack>
        </chakra.aside>
    )
}