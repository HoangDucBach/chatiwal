
"use client"

import { chakra, Heading, VStack, Text, Image, Highlight, Box, Span, HStack, Center, Group } from "@chakra-ui/react";
import NextImage from "next/image";
import { ChatNowButton } from "./ChatNowButton";
import { Tag } from "@/components/ui/tag";
import { siteConfig } from "@/config/site";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const MotionTag = motion.create(Tag);

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
}
export default function HeroSection(props: HeroSectionProps) {
    const [currentTagIndex, setCurrentTagIndex] = useState(0);

    const slicedTags = siteConfig.hotFeatures.slice(1);
    const visibleTags = [slicedTags[(currentTagIndex + 1) % slicedTags.length]];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTagIndex(prev => (prev + 1) % slicedTags.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <chakra.section id="hero" zIndex={"0"} w={"full"} h={"full"} overflow={"hidden"}>
            <VStack w="full" h={"full"} justify={"start"} align={"start"} py={["4", "16", "20"]} gap={"8"} mx={"auto"}>
                <VStack w={"full"} h={"full"} align={"start"}>
                    <Tag fontSize={"lg"}>
                        E2EE Super Message
                    </Tag>
                    <Heading as="h1" size={"5xl"} fontWeight={"semibold"}>
                        Empower Evolving Conversations with <Span color={"primary"}>E2EE</Span> and <Span color={"secondary"}>Full Control</Span>
                    </Heading>
                    <Text color={"fg.800"} fontSize={"lg"}>
                        <Highlight
                            query={["Seal", "Walrus", "Sui"]}
                            styles={{ fontWeight: "semibold", color: "fg" }}
                        >
                            Chatiwal ensures secure, encrypted messaging with Seal, full control over storage on Walrus, and seamless integration with Sui, empowering you with privacy, ownership, and evolving message policies
                        </Highlight>
                    </Text>
                </VStack>
                <ChatNowButton />
                <HStack pos={"relative"} justify={"space-between"} align={"center"} w={"full"} h={"full"}>
                    <Heading as="h2" size={"4xl"} fontWeight={"bold"} color={"fg/15"} maxW={"50%"}>
                        Your Chat,
                        Your Key,
                        Your Storage
                    </Heading>
                    <VStack w={"full"} h={"fit"} pos={"relative"}>
                        {visibleTags.map((feature, i) => (
                            <MotionTag
                                w="72"
                                pos="absolute"
                                key={feature}
                                left={0}
                                textAlign="center"
                                colorPalette={["yellow", "pink", "secondary"][currentTagIndex % 3]}
                                fontSize="lg"
                                fontWeight="semibold"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                            >
                                {feature}
                            </MotionTag>
                        ))}
                    </VStack>
                </HStack>
            </VStack>
        </chakra.section >
    )
}