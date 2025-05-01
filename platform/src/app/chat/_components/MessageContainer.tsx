"use client";

import { TMessage } from "@/types";
import { Center, CenterProps, VStack } from "@chakra-ui/react";
import { MessageBase, SuperMessagePolicy } from "./messages";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import EmptyContent from "@/components/ui/empty-content";
import { fromHex } from "@mysten/sui/utils";
import { useQuery } from "@tanstack/react-query";
import { useGroup } from "../_hooks/useGroupId";
import { useSupabase } from "@/hooks/useSupabase";
import { ChatHistoryBySnapshot } from "./ChatHistoryBySnapshot";

const ScrollMotionVStack = motion.create(VStack);


interface Props extends CenterProps {
    messages: TMessage[];
}
export function MessageContainer({ messages, ...props }: Props) {
    const currentAccount = useCurrentAccount();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { group } = useGroup();
    const { getSuperMessages } = useSupabase();

    const { data: superMessagesIds, isLoading: isSuperMessagesLoading } = useQuery({
        queryKey: ["group::get_super_message_policy", group.id],
        queryFn: async () => {
            const superMessagesIds = await getSuperMessages(group.id);

            return superMessagesIds;
        },
        enabled: !!group.id,
        refetchOnWindowFocus: true,
        staleTime: 30_000,
        refetchOnReconnect: true,
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Center p={"6"} pos={"relative"} flex={"1"} w={"full"} h={"full"} {...props}>
            {messages.length === 0 && superMessagesIds?.length === 0 && (
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
                <ChatHistoryBySnapshot />
                {superMessagesIds && superMessagesIds.length > 0 && (
                    superMessagesIds.map((id) => (
                        <SuperMessagePolicy
                            key={id}
                            messageId={id}
                        />
                    ))
                )}
                {messages.map((message: TMessage) => (
                    <MessageBase
                        key={message.id}
                        message={message}
                        self={message.owner === currentAccount?.address}
                    />
                ))}

                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
        </Center>
    )
}