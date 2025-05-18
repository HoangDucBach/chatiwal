
"use client"

import { Box, Center, chakra, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { fadeSlideUp } from "./motion";
import NextImage from "next/image";
import { Image } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";

const MotionSection = motion(chakra.section);

interface IntroSectionProps extends React.HTMLAttributes<HTMLElement> {
}
export default function IntroSection(props: IntroSectionProps) {
    const brandLogos = [
        {
            src: "/logo-walrus.png",
            alt: "Walrus Logo",
            label: "Walrus"
        },
        {
            src: "/logo-sui.png",
            alt: "Sui Logo",
            label: "Sui"
        },
        {
            src: "/logo-seal.png",
            alt: "Seal Logo",
            label: "Seal"
        }
    ];

    return (
        <MotionSection
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeSlideUp}
            py={"64"}
            overflow={"hidden"} zIndex={"0"}
            id="intro" w={"full"} h={"auto"}
        >
            <Center position={"relative"} overflow="hidden" bg={"bg.100"} rounded={"3xl"}>
                <VStack p={"8"} zIndex={"1"} rounded={"4xl"} gap={"4"} justify={"center"} align={"center"} w={"full"} aspectRatio={"10/3"}>
                    <Text fontSize={"sm"} color={"primary"} textAlign={"center"}>
                        POWERED BY Y3 MODEL
                    </Text>
                    <Heading as="h2" size="4xl" textAlign={"center"} fontWeight={"bold"}>
                        Sovereign<br />
                        Web3 Messaging
                    </Heading>
                    <Text color={"fg.900"} maxW={"40%"} textAlign={"center"}>
                        Secure messaging with Seal, sovereign storage on Walrus, and dynamic control on Sui
                    </Text>
                    <HStack gap={"8"}>
                        {brandLogos.map((item, index) => (
                            <Tooltip
                                key={index}
                                content={item.label}
                                contentProps={{
                                    colorPalette: "primary",
                                }}
                            >
                                <Image
                                    key={index}
                                    rounded={"md"}
                                    asChild
                                >
                                    <NextImage
                                        src={item.src}
                                        alt={item.alt}
                                        width={32}
                                        height={32}
                                    />
                                </Image>
                            </Tooltip>
                        ))}
                    </HStack>
                </VStack>
                <Image
                    position={"absolute"}
                    bottom={"0"}
                    left={"0"}
                    h={"full"}
                    w={"full"}
                    pointerEvents={"none"}
                    zIndex={"0"}
                    asChild
                >
                    <NextImage
                        src={"/assets/effect-radial-gradient.png"}
                        alt={"Intro Section Background"}
                        width={64}
                        height={32}
                    />
                </Image>
            </Center>
        </MotionSection >
    )
}