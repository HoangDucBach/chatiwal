"use client"

import { Button, ButtonProps } from "@/components/ui/button";
import { Box, HStack, Icon, Span } from "@chakra-ui/react";
import { IoChatbubbles } from "react-icons/io5";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";

interface ChatNowButtonProps extends ButtonProps {
}

const iconVariants: Variants = {
    initial: {
        rotateY: 0,
        y: 0,
    },
    hover: {
        rotateZ: [0, -10, 10, -10, 10, 0],
        transition: {
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
        },
    },
};

const buttonWrapperVariants: Variants = {
    initial: {},
    hover: {}
};

const textVariants: Variants = {
    initial: {
        opacity: 1,
        y: 0,
        scale: 1,
        letterSpacing: "normal",
    },
    hover: {
        opacity: 1,
        y: -1,
        scale: 1.03,
        letterSpacing: "0.5px",
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
        },
    },
};

export function ChatNowButton({
    ...props
}: ChatNowButtonProps) {
    const router = useRouter();

    return (
        <motion.div
            variants={buttonWrapperVariants}
            initial="initial"
            whileHover="hover"
            style={{ display: "inline-flex" }}
        >
            <HStack>
                <Button
                    rounded={"full"}
                    variant={"plain"}
                    colorScheme={"primary"}
                    flexDirection={"column"}
                    size={"2xl"}
                    onClick={() => {
                        router.push("/chat");
                    }}
                    {...props}
                >
                    <Span bg={"primary/25"} backdropBlur={"2xl"} rounded={"full"} pos={"relative"} w={"fit"} aspectRatio={"square"} p={"2"} borderBottomWidth={"1px"} borderBottomColor={"fg"}>
                        <Box
                            pos={"absolute"}
                            bottom={0}
                            w={"1/2"}
                            left={"50%"}
                            transform={"translateX(-50%) translateY(50%)"}
                            aspectRatio={"square"}
                            bg={"primary"}
                            zIndex={"-1"}
                            rounded={"lg"}
                            filter={"blur(16px)"}
                        />
                        <motion.div variants={iconVariants}>
                            <Icon size={"lg"}>
                                <IoChatbubbles />
                            </Icon>
                        </motion.div>
                    </Span>
                    <motion.div variants={textVariants}>
                        <Span fontWeight={"semibold"}>
                            Chat Now
                        </Span>
                    </motion.div>
                </Button>
            </HStack >
        </motion.div>
    );
}