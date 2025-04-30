"use client"

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heading, StackProps, Text, VStack, Center } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { getMessagePolicyType, TMessage } from "@/types";
import { useSealClient } from "@/hooks/useSealClient";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { toaster } from "@/components/ui/toaster";
import { useGroup } from "../_hooks/useGroupId";
import { Tag } from "@/components/ui/tag";
import { ComposerInput } from "./ComposerInput";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { MessageBase } from "./messages";
import { decode } from "@msgpack/msgpack";

const ScrollMotionVStack = motion.create(VStack);

interface Props extends StackProps {
}
export function Chat(props: Props) {
    const { group } = useGroup();
    const channelName = group.id;
    const currentAccount = useCurrentAccount();
    const { decryptMessage } = useSealClient();
    const { channel } = useChannel({ channelName });
    const [messages, setMessages] = useState<TMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { getSessionKey } = useSessionKeys();

    const onMessageSend = async (plainMessage: TMessage) => {
        // setMessages((previousMessages: any) => [...previousMessages, plainMessage]);
    }

    useConnectionStateListener('connected', () => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);
    });

    useChannel({ channelName }, AblyChannelManager.EVENTS.MESSAGE_SEND, async (message) => {
        try {

            const messageData = decode(message.data) as TMessage;
            if (messageData.owner === currentAccount?.address) {
                return;
            }

            setMessages((previousMessages) => [...previousMessages, messageData]);
        } catch (error) {

        }
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);

        return () => {
            channel.presence.leaveClient(currentAccount?.address);
        }
    }, [channel, currentAccount]);

    return (
        <VStack
            pos={"relative"}
            bg={"bg.200/75"}
            h={"full"}
            p={"6"}
            backdropFilter={"blur(256px)"}
            rounded={"4xl"}
            shadow={"custom.lg"}
            zIndex={"0"} {...props}
        >
            <Center p={"6"} pos={"relative"} flex={"1"} w={"full"}>
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
                    <div ref={messagesEndRef} />
                </ScrollMotionVStack>
            </Center>
            <ComposerInput
                messageInputProps={{
                    channelName,
                    onMessageSend
                }}
            />
        </VStack>
    )
}

export function ChatWelcomePlaceholder(props: Props) {
    return (
        <VStack
            pos={"relative"}
            bg={"bg.200/75"}
            h={"full"}
            rounded={"4xl"}
            p={"4"}
            gap={"4"}
            justifyContent={"center"}
            alignItems={"center"}
            backdropFilter={"blur(256px)"}
            overflow={"hidden"}
            {...props}
        >
            <Heading as="h3" size={"4xl"} fontWeight={"semibold"}>Welcome to Chatiwal</Heading>
            <Text color={"fg.900"}>Select group to chat and chill</Text>
            <Tag colorPalette={"white"} fontSize={"lg"} outlineWidth={"8px"} py="1" px={"2"}>
                Your chat, your key, your storage
            </Tag>
        </VStack>
    )
}