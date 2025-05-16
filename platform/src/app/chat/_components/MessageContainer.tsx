"use client";

import { MessageType, TMessage } from "@/types";
import { Center, CenterProps, VStack } from "@chakra-ui/react";
import { MessageBase, SuperMessagePolicy } from "./messages";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useGroup } from "../_hooks/useGroup";
import { useSupabase } from "@/hooks/useSupabase";
import { ChatHistoryBySnapshot } from "./ChatHistoryBySnapshot";
import { useMessageStore } from "../_hooks/useMessagesStore";
import { useChannelName } from "../_hooks/useChannelName";

const ScrollMotionVStack = motion.create(VStack);


interface Props extends CenterProps {
}
export function MessageContainer({ ...props }: Props) {
    const currentAccount = useCurrentAccount();
    const { channelName } = useChannelName();
    const { messagesByChannel, getMessages } = useMessageStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { group } = useGroup();
    const { getSuperMessages } = useSupabase();


    const messages = useMemo(() => {
        return getMessages(channelName) || [];
    }, [messagesByChannel, channelName]);

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
            <ScrollMotionVStack
                px={"2"}
                pos={"absolute"}
                gap={"6"}
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
                    message.type !== MessageType.SUPER_MESSAGE ?
                        (
                            <MessageBase
                                key={message.id}
                                message={message}
                                self={message.owner === currentAccount?.address}
                            />
                        ) : (
                            <SuperMessagePolicy
                                key={message.id}
                                messageId={message.id}
                            />
                        )
                ))}

                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
        </Center>
    )
}

export function MessageContainerForDirect(props: Props) {
    const currentAccount = useCurrentAccount();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { channelName } = useChannelName();
    const { messagesByChannel, getMessages } = useMessageStore();

    const messages = useMemo(() => {
        return getMessages(channelName) || [];
    }, [messagesByChannel, channelName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        console.log(messages)
    }, [messages]);

    return (
        <Center p={"6"} pos={"relative"} flex={"1"} w={"full"} h={"full"} {...props}>
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
                    message.type !== MessageType.SUPER_MESSAGE ?
                        (
                            <MessageBase
                                key={message.id}
                                message={message}
                                self={message.owner === currentAccount?.address}
                            />
                        ) : (
                            <SuperMessagePolicy
                                key={message.id}
                                messageId={message.id}
                            />
                        )
                ))}

                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
        </Center>
    )
}