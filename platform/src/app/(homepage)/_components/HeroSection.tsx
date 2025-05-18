
"use client"

import { chakra, Heading, VStack, Text, Image, Highlight, Box, Span, HStack, Center, Group } from "@chakra-ui/react";
import { ChatNowButton } from "./ChatNowButton";
import { Tag } from "@/components/ui/tag";
import { siteConfig } from "@/config/site";
import { motion, useScroll } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { fadeSlideUp } from "./motion";

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
            ref={ref}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeSlideUp}
            id="hero" zIndex={"0"} w={"full"} h={"full"} overflow={"hidden"}
        >
            <VStack w="full" h={"full"} justify={"center"} align={"center"} pt={["4", "20", "24"]} gap={"8"} mx={"auto"}>
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
                    <Heading as="h1" size={["4xl", "4xl", "5xl", "6xl"]} fontWeight={"semibold"} textAlign={"center"}>
                        Sovereign Web3 Messaging
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
        </MotionSection >
    )
}