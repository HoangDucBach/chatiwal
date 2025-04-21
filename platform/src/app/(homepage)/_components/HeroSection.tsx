
"use client"

import { chakra, Heading, VStack, Text } from "@chakra-ui/react";

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
}
export default function HeroSection(props: HeroSectionProps) {
    return (
        <chakra.section id="hero" bg={"bg.100"} w={"full"} h={"full"} borderRadius={"3xl"} p={"8"} justifyContent={"center"}>
            <VStack w={"full"} justify={"center"}>
                <Heading as="h1" size={"5xl"} maxW={"1/2"} textAlign={"center"} fontWeight={"semibold"}>
                    Empower Evolving Conversations with E2EE and Full Control
                </Heading>
                <Text maxW={"3/4"} color={"fg.700"} textAlign={"center"} fontSize={"lg"}>
                    Chatiwal ensures secure, encrypted messaging with <chakra.b color={"fg"}>SEAL</chakra.b> , full control over storage on <chakra.b color={"fg"}>Walrus</chakra.b>, and seamless integration with <chakra.b color={"fg"}>SUI</chakra.b>, empowering you with privacy, ownership, and evolving message policies.
                </Text>
            </VStack>
        </chakra.section>
    )
}