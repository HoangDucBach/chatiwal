"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Center, Icon, Span } from "@chakra-ui/react";
import { IoChatbubbles } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useWalletStatus } from "@/hooks/useWalletStatus";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { toaster } from "@/components/ui/toaster";

interface ChatNowButtonProps { }

const MotionButton = motion.create(Button);
const MotionIcon = motion.create(Icon);
const MotionSpan = motion.create(Span);

export function ChatNowButton({ ...props }: ChatNowButtonProps) {
    const router = useRouter();
    const iconRef = useRef<SVGSVGElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [iconWidth, setIconWidth] = useState(0);
    const [spanWidth, setSpanWidth] = useState(0);
    const account = useCurrentAccount();

    useEffect(() => {
        if (iconRef.current) {
            setIconWidth(iconRef.current.width.baseVal.value);
        }
        if (spanRef.current) {
            setSpanWidth(spanRef.current.offsetWidth);
        }
    }, [iconRef, spanRef]);

    useEffect(() => {
        if (account) {
            queueMicrotask(() => {

                toaster.loading({
                    id: "redirecting-to-chat",
                    title: "Connected",
                    description: "You are now being redirected to the chat.",
                })
            })
            router.push("/chat")
        };
    }, [account]);

    if (!account) {
        return (
            <>
                <ConnectModal
                    trigger={
                        <MotionButton
                            rounded={"full"}
                            variant={"solid"}
                            colorPalette={"primary"}
                            size={"md"}
                            whileHover="hover"
                            whileTap={{
                                scale: 0.95,
                                transition: { duration: 0.2, ease: "easeInOut" },
                            }}
                            initial="rest"
                            animate="rest"
                            transition={{
                                type: "spring",
                                stiffness: 300,
                            }}
                            {...props}
                        >
                            <MotionIcon
                                ref={iconRef}
                                as={IoChatbubbles}
                                color="primary.200"
                                variants={{
                                    hover: { x: spanWidth + 8 },
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            />
                            <MotionSpan
                                ref={spanRef}
                                fontWeight="semibold"
                                variants={{
                                    hover: { x: - iconWidth - 16 },
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                Chat Now
                            </MotionSpan>
                        </MotionButton>
                    }
                />
            </>
        )
    }

    return (
        <Center w={"64"}>
            <MotionButton
                rounded={"full"}
                variant={"solid"}
                colorPalette={"primary"}
                size={"md"}
                whileHover="hover"
                whileTap={{
                    scale: 0.95,
                    transition: { duration: 0.2, ease: "easeInOut" },
                }}
                initial="rest"
                animate="rest"
                transition={{
                    type: "spring",
                    stiffness: 300,
                }}
                onClick={() => {
                    router.push("/chat");
                }}
                {...props}
            >
                <MotionIcon
                    ref={iconRef}
                    as={IoChatbubbles}
                    color="primary.200"
                    variants={{
                        hover: { x: spanWidth + 8 },
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />
                <MotionSpan
                    ref={spanRef}
                    fontWeight="semibold"
                    variants={{
                        hover: { x: - iconWidth - 16 },
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    Chat Now
                </MotionSpan>
            </MotionButton>
        </Center>
    );
}
