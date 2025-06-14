
"use client"

import { chakra, Heading, VStack, Text, Image, Highlight, Box, Span, HStack, Center, Group, Icon, Link, Stack } from "@chakra-ui/react";
import { siteConfig } from "@/config/site";
import { motion, useScroll } from "framer-motion";
import { LuBoxes } from "react-icons/lu";
import { useState, useEffect, useRef } from "react";

import { Tag } from "@/components/ui/tag";

import { ChatNowButton } from "./ChatNowButton";
import { fadeSlideUp } from "./motion";
import { SupportedBrands } from "./SupportedBrands";

const MotionTag = motion.create(Tag);
const MotionSection = motion.create(chakra.section);

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
}
export default function HeroSection(props: HeroSectionProps) {
    const [currentTagIndex, setCurrentTagIndex] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end",
            "end start"],
    });
    const slicedTags = siteConfig.hotFeatures.slice(1);
    const visibleTags = [slicedTags[(currentTagIndex + 1) % slicedTags.length]];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTagIndex(prev => (prev + 1) % slicedTags.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <MotionSection
            pos={"relative"}
            ref={ref}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeSlideUp}
            pt={["4", "16", "32"]}
            pb={"8"}
            id="hero" zIndex={"0"} w={"full"} h={"full"} overflow={"hidden"}
        >
            <VStack w={"full"} h={"full"} align={"start"} justify={"space-between"} gap={"8"}>
                <VStack w="full" h={"fit"} justify={"center"} align={"start"} gap={"8"}>
                    <HStack>
                        <Icon as={LuBoxes} boxSize={"4"} color={"primary"} />
                        <Text color={"primary"}>Your Chat, Your Key, Your Storage | <Span color={"primary.300"}>Model</Span></Text>
                    </HStack>
                    <VStack w={"full"} h={"full"} align={"start"} justify={"center"}>
                        <Heading as="h1" size={["lg", "2xl", "3xl", "4xl"]} fontWeight={"semibold"} textAlign={"center"}>
                            Sovereign Web3 Messaging
                        </Heading>
                        <Text color={"fg.800"} fontSize={"lg"} maxW={"md"}>
                            <Highlight
                                query={["Seal", "Walrus", "Sui"]}
                                styles={{ fontWeight: "semibold", color: "fg" }}
                            >
                                Secure messaging with Seal, sovereign storage on Walrus, and dynamic control on Sui                        </Highlight>
                        </Text>
                        <HStack gap={"4"}>
                            <ChatNowButton />
                            <Link href={siteConfig.navLinks.doc.href} color={"primary"} colorPalette={"primary"} target="_blank" rel="noopener noreferrer">
                                Learn More
                            </Link>
                        </HStack>
                    </VStack>
                </VStack>
                {/* <Stack w={"full"} h={"fit"} pos={"relative"}>
                    {visibleTags.map((feature, i) => (
                        <MotionTag
                            w="72"
                            pos="absolute"
                            key={i}
                            textAlign="center"
                            colorPalette={["yellow", "purple", "secondary"][currentTagIndex % 3]}
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
                </Stack> */}
                <SupportedBrands />
            </VStack>
        </MotionSection >
    )
}