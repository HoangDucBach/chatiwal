"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Icon, Span } from "@chakra-ui/react";
import { IoChatbubbles } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ChatNowButtonProps { }

const MotionButton = motion.create(Button);

export function ChatNowButton({ ...props }: ChatNowButtonProps) {
    const router = useRouter();

    return (
        <MotionButton
            initial={{ scale: 0.95 }}
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 0.98 }}
            animate={{ transition: { type: "spring", stiffness: 300, damping: 20 } }}
            variant={"plain"}
            size={"md"}
            bgGradient={"to-t"}
            gradientFrom={"primary/50"}
            gradientVia={"primary/25"}
            gradientTo={"primary/10"}
            backdropBlur={"2xl"}
            border={"none"}
            onClick={() => {
                router.push("/chat");
            }}
            {...props}
        >
            <Icon as={IoChatbubbles} boxSize={5} mr={2} />
            <Span fontWeight={"semibold"}>Chat Now</Span>
        </MotionButton>
    );
}