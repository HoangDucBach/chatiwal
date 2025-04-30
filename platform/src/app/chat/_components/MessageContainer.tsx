"use client";

import { TMessage } from "@/types";
import { Center, CenterProps, VStack } from "@chakra-ui/react";
import { MessageBase, SuperMessagePolicy } from "./messages";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import EmptyContent from "@/components/ui/empty-content";

const ScrollMotionVStack = motion.create(VStack);


interface Props extends CenterProps {
    messages: TMessage[];
}
export function MessageContainer({ messages, ...props }: Props) {
    const currentAccount = useCurrentAccount();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    return (
        <Center p={"6"} pos={"relative"} flex={"1"} w={"full"} h={"full"} {...props}>
            {messages.length === 0 && (
                <EmptyContent
                    emptyText={"No messages yet"}
                />
            )}
            <ScrollMotionVStack
                px={"6"}
                pos={"absolute"}
                flex={"1"}
                w={"full"}
                h={"full"}
                overflowY={"auto"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
            >
                {messages.map((message: TMessage) => (
                    <MessageBase
                        key={message.id}
                        message={message}
                        self={message.owner === currentAccount?.address}
                    />
                ))}
                <SuperMessagePolicy
                    messageId="0x81af0ef33574a44c6f665d2771d0541d6297d71bf7b1ee1065a2d9c143bd4035"
                />

                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
        </Center>
    )
}