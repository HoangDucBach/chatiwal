
"use client"

import { chakra, Heading, VStack, Text, Image, Highlight, Box, Span, HStack, Center } from "@chakra-ui/react";
import NextImage from "next/image";
import { ChatNowButton } from "./ChatNowButton";
import { Tag } from "@/components/ui/tag";
import { siteConfig } from "@/config/site";
import { motion } from "framer-motion";

const MotionTag = motion.create(Tag);

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
}
export default function HeroSection(props: HeroSectionProps) {
    return (
        <chakra.section position={"relative"} id="hero" zIndex={"0"} bg={"bg.100"} w={"full"} h={"full"} borderRadius={"4xl"} p={"8"} justifyContent={"center"} alignItems={"center"} overflow={"hidden"}>
            <>
                <Image asChild position={"absolute"} top={"-30%"} right={0} scale={"2"} pointerEvents={"none"}>
                    <NextImage
                        src={"/assets/effect-glow-1.svg"}
                        alt={"Background Effect"}
                        width={700}
                        height={300}
                    />
                </Image>
                <Box
                    pos={"absolute"}
                    bottom={0}
                    left={0}
                    transform={"translate(-50%, 50%)"}
                    w={"64"}
                    h={"64"}
                    bg={"primary"}
                    zIndex={"-1"}
                    borderRadius={"full"}
                    filter={"blur(128px)"}
                    pointerEvents={"none"}
                />
                <Heading as="h2" size={"4xl"} fontWeight={"bold"} color={"fg/15"} pos={"absolute"} left={"8"} bottom={"32"}>
                    Your Chat, <br />
                    Your Key, <br />
                    Your Storage
                </Heading>
            </>
            <VStack w="full" h={"full"} justify={"start"} gap={"8"}>
                <VStack w={"full"} justify={"center"}>
                    <Box borderRadius={"full"} px={"2"} py={"1"} borderWidth={"1.5px"} borderColor={"fg"} w={"fit"} h={"fit"} bg={"bg.emphasized/75"} backdropBlur={"2xl"} textAlign={"center"}>
                        Y3 Protocol on <Span color={"primary"}>Chatiwal</Span>
                    </Box>
                    <Heading as="h1" size={"5xl"} maxW={"1/2"} textAlign={"center"} fontWeight={"semibold"}>
                        Empower Evolving Conversations with E2EE and Full Control
                    </Heading>
                    <Text maxW={"1/2"} color={"fg.800"} textAlign={"center"} fontSize={"lg"}>
                        <Highlight
                            query={["Seal", "Walrus", "Sui"]}
                            styles={{ fontWeight: "semibold", color: "fg" }}
                        >
                            Chatiwal ensures secure, encrypted messaging with Seal, full control over storage on Walrus, and seamless integration with Sui, empowering you with privacy, ownership, and evolving message policies
                        </Highlight>
                    </Text>
                </VStack>
                <Center w={"full"} flex={"1 0"}>
                    <ChatNowButton />
                </Center>
                <HStack justify={"space-between"} w={"full"}>
                    {siteConfig.hotFeatures.map((feature, i) => (
                        <MotionTag key={feature} colorPalette={["yellow", "white", "secondary", "primary"][i % 4]} fontSize={"lg"} fontWeight={"semibold"} whileHover={{
                            rotateZ: -7.5,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            },
                        }}>
                            {feature}
                        </MotionTag>
                    ))}
                </HStack>
            </VStack>
        </chakra.section>
    )
}