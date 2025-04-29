"use client"

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heading, StackProps, Text, VStack, Center } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { MessageBase, SuperMessageFeeBased, SuperMessageLimitedRead } from "./messages";
import { MediaContent, TMessage, TMessageBase, TMessageNoPolicy, TProtocolMessage } from "@/types";
import { useSealClient } from "@/hooks/useSealClient";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { SuperMessageNoPolicy } from "@/sdk";
import { toaster } from "@/components/ui/toaster";
import { useGroup } from "../_hooks/useGroupId";
import { Tag } from "@/components/ui/tag";
import { ComposerInput } from "./ComposerInput";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
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
    const [messages, setMessages] = useState<TMessageBase[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { getGroupKey } = useSessionKeys();

    const onMessageSend = async (plainMessage: TMessageBase) => {
        console.log("Message received", plainMessage);
        setMessages((previousMessages: any) => [...previousMessages, plainMessage]);
    }

    useConnectionStateListener('connected', () => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);
    });

    useChannel({ channelName }, AblyChannelManager.EVENTS.MESSAGE_SEND, async (message) => {
        console.log("Message received", message);
        try {
            if (message.clientId === currentAccount?.address) {
                return;
            }

            const messageData = message.data as TProtocolMessage;
            const encryptedMessage = new SuperMessageNoPolicy({
                id: messageData.id,
                data: {
                    content: messageData.content,
                },
                groupId: messageData.groupId,
                owner: messageData.owner,
            });

            const sessionKey = getGroupKey(messageData.groupId);
            if (!sessionKey) {
                throw new Error("Session key not found");
            }
            const decryptedMessage = await decryptMessage(encryptedMessage, sessionKey);
            const decryptedMessageData: TMessageBase = {
                id: decryptedMessage.getId(),
                groupId: messageData.groupId,
                owner: messageData.owner,
                content: decode(decryptedMessage.getData().content) as MediaContent[],
                createdAt: Date.now(),
            }

            setMessages((previousMessages) => [...previousMessages, decryptedMessageData]);
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
                    {messages.map((message: TMessageBase) => (
                        <MessageBase
                            key={message.id}
                            message={message as TMessageNoPolicy}
                            self={message.owner === currentAccount?.address}
                        />
                    ))}
                    {/* <SuperMessageLimitedRead
                        messageId="0xe685eb1c36e677f59fdcc5e1db6934f064909c5e9d90e5e450ddb4a8cfca6726"
                    /> */}
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