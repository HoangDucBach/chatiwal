"use client";

import { TMessage } from "@/types";
import { Center, CenterProps, VStack } from "@chakra-ui/react";
import { MessageBase, SuperMessagePolicy } from "./messages";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import EmptyContent from "@/components/ui/empty-content";
import { fromHex } from "@mysten/sui/utils";

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
    console.log(fromHex("2c45b864339ac44a70fff4db6b01e35fff797c0705b18ce9f23a3ee0307d6401b5372d567553794639634c4f7153452d41315f792d6f"))

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
                    messageId="0x90a0b821a1047131dbf7fa41971f67edd84c32144d64ce435062e0cc2b3293be"
                />

                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
        </Center>
    )
}