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
                {/* <SuperMessagePolicy
                    messageId="0x48d90d98dc150e38d2c55b5f96591893a2a47b4e274401acdb135b7f4f09f6ba"
                /> */}

                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
        </Center>
    )
}