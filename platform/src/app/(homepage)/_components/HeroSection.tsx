
"use client"

import { chakra, Heading, VStack, Text, Image, Highlight, Box, Span, HStack, Center, Group } from "@chakra-ui/react";
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
            <VStack w="full" h={"full"} justify={"center"} align={"center"} pt={["4", "24", "32"]} gap={"8"} mx={"auto"}>
                <Center w={"full"} h={"fit"} pos={"relative"}>
                    {visibleTags.map((feature, i) => (
                        <MotionTag
                            w="72"
                            pos="absolute"
                            key={i}
                            left={"1/2"}
                            transform={"translateX(-50%)"}
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
                </Center>
                <VStack w={"full"} h={"full"} align={"center"}>
                    <Heading as="h1" size={"4xl"} fontWeight={"semibold"} textAlign={"center"}>
                        Sovereign Programmable Messaging
                    </Heading>
                    <Text color={"fg.800"} fontSize={"lg"} textAlign={"center"} maxW={"md"}>
                        <Highlight
                            query={["Seal", "Walrus", "Sui"]}
                            styles={{ fontWeight: "semibold", color: "fg" }}
                        >
                            Secure messaging with Seal, sovereign storage on Walrus, and dynamic control on Sui                        </Highlight>
                    </Text>
                </VStack>
                <ChatNowButton />
            </VStack>
        </chakra.section >
    )
}