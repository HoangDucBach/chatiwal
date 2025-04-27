"use client"

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heading, StackProps, Text, VStack, Center } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { MessageBase } from "./messages";
import { TMessage, TMessageBase } from "@/types";
import { useSealClient } from "@/hooks/useSealClient";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { SuperMessageNoPolicy } from "@/sdk";
import { toaster } from "@/components/ui/toaster";
import { useGroup } from "../_hooks/useGroupId";
import { Tag } from "@/components/ui/tag";
import { ComposerInput } from "./ComposerInput";

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
    const onMessageSend = async (plainMessage: TMessageBase) => {
        setMessages((previousMessages: any) => [...previousMessages, plainMessage]);
    }

    useConnectionStateListener('connected', () => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);
    });

    useChannel({ channelName }, AblyChannelManager.EVENTS.MESSAGE_SEND, async (message) => {
        try {
            if (message.clientId === currentAccount?.address) {
                return;
            }

            const messageData = message.data as TMessage;
            const encryptedMessage = new SuperMessageNoPolicy({
                id: messageData.id,
                data: {
                    content: messageData.content,
                },
                groupId: messageData.groupId,
                owner: messageData.owner,
            });
            const decryptedMessage = await decryptMessage(encryptedMessage);
            const decryptedMessageData: TMessageBase = {
                id: decryptedMessage.getId(),
                groupId: messageData.groupId,
                owner: messageData.owner,
                content: decryptedMessage.getData().content,
                createdAt: Date.now(),
            }

            setMessages((previousMessages: any) => [...previousMessages, decryptedMessageData]);
        } catch (error) {
            toaster.error({
                title: "Error",
                description: error,
            })
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
                    <MessageBase
                        self={false}
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            content: [
                                {
                                    id: "media-001",
                                    url: "https://img.freepik.com/premium-photo/nature-background-people-animal-game-architecture-logo-mockup_1086760-37566.jpg?semt=ais_hybrid&w=740",
                                    dimensions: {
                                        width: 300,
                                        height: 200,
                                    },
                                    mimeType: "image/jpeg",
                                },
                            ],
                            createdAt: Date.now(),
                        }} />
                    <MessageBase
                        self={false}
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            createdAt: Date.now(),
                        }} />
                    <MessageBase
                        self={false}
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            createdAt: Date.now(),
                        }} />
                    <MessageBase
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            content: [
                                {
                                    id: "media-001",
                                    raw: new TextEncoder().encode("Hello world"),
                                    name: "Cute kitten",
                                    mimeType: "text/plain",
                                }
                            ],
                            createdAt: Date.now(),
                        }} />
                    {messages.map((message: TMessageBase) => (
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