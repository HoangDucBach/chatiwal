"use client"

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Input, InputProps, StackProps, VStack } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { MessageBase } from "./messages";
import { MediaType, TMessage, TMessageBase } from "@/types";
import { useSealClient } from "@/hooks/useSealClient";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { SuperMessageNoPolicy } from "@/sdk";
import { toaster } from "@/components/ui/toaster";

const ScrollMotionVStack = motion.create(VStack);

interface Props extends StackProps {
    channelName: string;
}
export function Chat(props: Props) {
    const { channelName } = props;
    const currentAccount = useCurrentAccount();
    const [messages, setMessages] = useState<TMessage[]>([]);
    const { decryptMessage } = useSealClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { channel } = useChannel({ channelName });
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

    return (
        <VStack bg={"bg.100"} h={"full"} rounded={"4xl"} p={"4"} overflowY={"auto"} {...props}>
            <ScrollMotionVStack
                h={"full"} overflowY={"auto"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
            >
                <MessageBase
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "Hello! Here's an image and a video.",
                            media: [
                                {
                                    id: "media-002",
                                    type: MediaType.VIDEO,
                                    url: "https://www.w3schools.com/html/mov_bbb.mp4",
                                    name: "Sample video",
                                    duration: 10,
                                    size: 1048576,
                                    mimeType: "video/mp4",
                                }
                            ],
                        },
                        createdAt: Date.now(),
                    }} />
                <MessageBase
                    self={false}
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "Hello! Here's an image and a video.",
                            media: [
                                {
                                    id: "media-001",
                                    type: MediaType.IMAGE,
                                    url: "https://img.freepik.com/premium-photo/nature-background-people-animal-game-architecture-logo-mockup_1086760-37566.jpg?semt=ais_hybrid&w=740",
                                    name: "Cute kitten",
                                    dimensions: {
                                        width: 300,
                                        height: 200,
                                    },
                                    mimeType: "image/jpeg",
                                },
                            ],
                        },
                        createdAt: Date.now(),
                    }} />
                <MessageBase
                    self={false}
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "A example encrypted message, try it with Chatiwal",
                        },
                        createdAt: Date.now(),
                    }} />
                <MessageBase
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "Chatiwal ensures secure, encrypted messaging with SEAL, full control over storage on Walrus, and seamless integration with Sui",
                        },
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
            <MessageInput channelName={channelName} onMessageSend={onMessageSend} />
        </VStack>
    )
}

interface MessageInputProps extends InputProps {
    channelName: string;
    onMessageSend: (plainMessage: TMessageBase, encryptedMessage: TMessageBase) => void;
}
function MessageInput({ channelName, onMessageSend, ...props }: MessageInputProps) {

    const { channel } = useChannel({ channelName });
    const [message, setMessage] = useState<string>("");
    const { encryptMessage } = useSealClient();
    const currentAccount = useCurrentAccount();

    const handlePublish = async () => {
        if (!message) return;
        if (!currentAccount) return;

        const messageBase = new SuperMessageNoPolicy({
            groupId: channelName,
            owner: currentAccount.address,
            data: {
                content: {
                    text: message,
                    media: [],
                },
            }
        })
        const selfMessageData: TMessageBase = {
            id: messageBase.getId(),
            groupId: channelName,
            owner: currentAccount.address,
            content: {
                text: message,
            },
            createdAt: Date.now(),
        }

        const encryptedMessage = await encryptMessage(messageBase);

        const encryptedMessageData: TMessageBase = {
            id: encryptedMessage.getId(),
            groupId: channelName,
            owner: currentAccount.address,
            content: messageBase.getData().content,
            createdAt: Date.now(),
        }

        channel.publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encryptedMessageData)

        onMessageSend(selfMessageData, encryptedMessageData);
    }

    return (
        <Input
            bg={"bg.200"}
            placeholder="Message"
            rounded={"full"}
            variant={"subtle"}
            size={"lg"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    handlePublish();
                    setMessage("");
                }
            }}
            {...props}
        />
    )
}
