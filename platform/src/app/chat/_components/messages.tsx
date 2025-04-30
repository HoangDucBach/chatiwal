"use client";

import { Box, BoxProps, Avatar as ChakraAvatar, HStack, Icon, Image, Text, VStack, Float, Circle, For } from "@chakra-ui/react";
import { formatAddress, fromBase64 } from "@mysten/sui/utils";
import { useMemo, useCallback, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { useChannel } from "ably/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { generateColorFromAddress } from "@/libs";
import { getMessagePolicyType, MediaContent, MessageType, TMessage } from "@/types";
import { SuperMessageStruct } from "@/sdk/contracts"; // Unified struct
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useSealClient } from "@/hooks/useSealClient";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { decode } from "@msgpack/msgpack";
import { SessionKey } from "@mysten/seal";
import { useWalrusClient } from "@/hooks/useWalrusClient";

interface ContentProps {
    self?: boolean;
    media: MediaContent;
}

export function Content(props: ContentProps) {
    const { media, self } = props;

    const decodeMediaAsUrl = useMemo(() => {
        if (!media) return null;
        const raw = media.raw;
        const url = media.url;

        if (url) {
            return { url: media.url, cleanup: () => { } };
        }


        if (raw instanceof Uint8Array || typeof raw === 'string') {
            try {
                const blob = new Blob([raw], { type: media.mimeType });
                const url = URL.createObjectURL(blob);
                const cleanup = () => URL.revokeObjectURL(url);
                return { url, cleanup };
            } catch (e) {
                console.error("Error creating blob URL:", e);
                return null;
            }
        }


        return null;
    }, [media]);

    useMemo(() => {
        const decoded = decodeMediaAsUrl;
        return () => {
            decoded?.cleanup();
        };
    }, [decodeMediaAsUrl]);


    const mediaNode = useMemo(() => {
        const decodedUrl = decodeMediaAsUrl?.url;
        if (!decodedUrl) return <Text color="fg.contrast" fontSize="sm">No preview available</Text>;

        const isImage = media.mimeType.startsWith("image/");
        const isVideo = media.mimeType.startsWith("video/");
        const isAudio = media.mimeType.startsWith("audio/");
        const isText = media.mimeType === "text/plain";

        if (isImage) {
            return (
                <Image
                    src={decodedUrl}
                    alt={'Media preview'}
                    maxW={["full", "full", "full", "64"]}
                    h={"auto"}
                    objectFit={"contain"}
                    rounded={"2xl"}
                />
            );
        }

        if (isVideo || isAudio) {
            return (
                <Box
                    width={["full", "full", "full", "sm"]} // Adjust width
                    borderRadius="2xl"
                    overflow="hidden"
                >
                    <ReactPlayer
                        url={decodedUrl}
                        width="100%"
                        height="100%"
                        controls
                        playing={false}
                        style={{ borderRadius: "inherit", aspectRatio: "16/9" }}
                    />
                </Box>
            );
        }

        if (isText && typeof media.raw === 'string') {
            return (
                <Text
                    fontSize={"md"}
                    color={"fg"}
                    w={"full"}
                >
                    {media.raw}
                </Text>
            );
        }

        if (isText) {
            return <Text color="fg.contrast" fontSize="sm">[Text content]</Text>;
        }

        return <Text color="fg.contrast" fontSize="sm">[Unsupported media type: {media.mimeType}]</Text>;
    }, [media, decodeMediaAsUrl]);

    return (
        <VStack align={"start"} justify={"start"} gap={"1"} w={"full"}>
            {mediaNode}
        </VStack>
    )
}
interface MessageBaseProps extends BoxProps {
    message: TMessage;
    self?: boolean;
}
export function MessageBase(props: MessageBaseProps) {
    const { message, self = true, ...restBoxProps } = props;
    const channelName = message.groupId;
    const { channel } = useChannel({ channelName });
    const { decryptMessage } = useSealClient();
    const { getSessionKey, sessionKeys } = useSessionKeys();
    const currentAccount = useCurrentAccount();
    const { read } = useWalrusClient();

    console.log("Message:", message);
    const { data: decryptedContent, isLoading: isDecrypting, error: decryptError } = useQuery({
        queryKey: ["messages::group::decrypt", message.id, message.content], // Depend on content bytes
        queryFn: async (): Promise<MediaContent[] | null> => {
            const messageType = getMessagePolicyType(message);
            const sessionKey = getSessionKey(message.id);
            console.log("Session key:", sessionKey);
            console.log(sessionKeys)

            if (!currentAccount) {
                return null;
            }

            const blob_id = message.blobId;
            if (!message.content || message.content.length === 0) {
                if (!blob_id) {
                    return null;
                }

                try {
                    const res = await read([blob_id]);
                    message.content = new Uint8Array(res[0]);
                } catch (err) {
                    console.error(err);
                }
            }

            if (!sessionKey) {
                return null;
            }
            console.log("Decrypting message with session key:", sessionKey);
            const decryptedBytes = await decryptMessage(message, messageType, sessionKey);
            const decodedData = decode(decryptedBytes) as MediaContent[];
            console.log("Decoded data:", decodedData);
            return decodedData;
        },
        // enabled: !!message,
        // refetchOnMount: false,
        // retry: 0,
        // staleTime: Infinity
    });

    const { data: isOnline } = useQuery({
        queryKey: ["messages::group::get::status", message.owner], // Key by owner address
        queryFn: async () => {
            if (!channel) return false;
            try {
                const res = await channel.presence.get({ clientId: message.owner });
                return res.length > 0;
            } catch (err) {
                console.error("Failed to get presence:", err);
                return false;
            }
        },
        refetchInterval: 30000,
        staleTime: 25000,
    });


    if (!message) return null;

    const Avatar = () => {
        return (
            <ChakraAvatar.Root variant="subtle">
                <Icon as={ChatiwalMascotIcon} boxSize={"8"} color={generateColorFromAddress(message.owner)} />
                <Float placement="bottom-end" offsetX="1" offsetY="1">
                    <Circle
                        bg={isOnline ? "green.500" : "gray.500"}
                        size="8px"
                    />
                </Float>
            </ChakraAvatar.Root>
        )
    };

    const Header = () => {
        const formattedTime = message.createdAt
        new Date(message.createdAt || Date.now()).toLocaleString("en-US", {
            // month: "short", day: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        })

        return (
            <HStack flexDirection={self ? "row-reverse" : "row"} align="center">
                <Text
                    fontSize={"md"}
                    color={"fg"}
                    fontWeight={"medium"}
                >
                    {self ? "You" : formatAddress(message.owner)}
                </Text>
                <Text
                    fontSize={"sm"} // Smaller timestamp
                    color={"fg.contrast"} // Muted color
                    fontWeight={"normal"}
                >
                    {formattedTime}
                </Text>
            </HStack>
        )
    };

    const renderContent = () => {
        if (isDecrypting) {
            return <Text color={"fg.contrast"} fontSize="sm">Decrypting...</Text>;
        }
        if (decryptError) {
            return <Text color={"red.500"} fontSize="sm">Decryption failed</Text>;
        }
        if (!decryptedContent) {
            return <Text color={"fg.contrast"} fontSize="sm">***</Text>;
        }
        if (decryptedContent.length === 0) {
            return <Text color={"fg.contrast"} fontSize="sm">[Empty Content]</Text>;
        }

        return (
            <For each={decryptedContent} fallback={<Text color={"fg.contrast"} fontSize="sm">No content</Text>}>
                {(media, index) => (
                    <Content
                        self={self}
                        key={media.id || index} // Use media.id if available
                        media={media}
                    />
                )}
            </For>
        );
    }

    useEffect(() => {
        // log error
        if (decryptError) {
            console.error("Decryption error:", decryptError);
        }
    }, [decryptError]);
    return (
        <VStack
            w={"full"}
            align={self ? "end" : "start"}
            gap={2}
        >
            <Avatar />
            <VStack
                align={self ? "end" : "start"}
                justify={"start"}
                gap={"1"}
                maxW={["90%", "80%", "70%", "60%"]}
                p={3}
                rounded="xl"
            >
                <Header />
                {renderContent()}
                {props.children}
            </VStack>
        </VStack>
    )
}

interface SuperMessagePolicyProps extends Omit<MessageBaseProps, "message"> {
    messageId: string;
}

export function SuperMessagePolicy(props: SuperMessagePolicyProps) {
    const { messageId, self = true } = props;
    const suiClient = useSuiClient();
    const { readMessage, getSuperMessageData } = useChatiwalClient();
    const { getSessionKey, setSessionKey } = useSessionKeys();
    const { createSessionKey } = useSealClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();

    const { data: message, isLoading, error } = useQuery({
        queryKey: ["messages::group::get::object", messageId],
        queryFn: async (): Promise<TMessage | null> => {
            if (!messageId) return null;
            const superMsg = await getSuperMessageData(messageId);

            try {
                // Manually construct TMessage from parsed BCS data
                const tMsg: TMessage = {
                    id: messageId,
                    owner: superMsg.owner,
                    groupId: superMsg.group_id,
                    auxId: superMsg.aux_id, // Ensure conversion
                    blobId: superMsg.message_blob_id,
                    readers: superMsg.readers,
                    feeCollected: superMsg.fee_collected,
                    timeLockPolicy: superMsg.time_lock,
                    limitedReadPolicy: superMsg.limited_read,
                    feePolicy: superMsg.fee_policy,
                    content: new Uint8Array(),
                    createdAt: undefined,
                };

                return tMsg;

            } catch (parseError) {
                console.error("Failed to parse SuperMessage BCS:", parseError);
                return null;
            }
        },
        enabled: !!messageId,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // Stale after 5 minutes,
        throwOnError: false,
    });

    const { mutate: subscribe } = useMutation({
        mutationKey: ["messages::group::read"],
        mutationFn: async () => {
            if (!message) {
                throw new Error("Message not found");
            }

            const tx = await readMessage(message.id, "");

            const res = await signAndExecuteTransaction({
                transaction: tx,
            });

            const { errors } = await suiClient.waitForTransaction(res);

            if (errors) {
                throw new Error(errors.map((e) => e).join(", "));
            }

            return res;
        },

        onSuccess: (data) => {
            toaster.success({
                title: "Success",
                description: "Message read successfully",
            });
        },

        onError: (error) => {
            toaster.error({
                title: "Error",
                description: error.message,
            });
        }
    })

    const createMessageKey = useCallback(async () => {
        const sessionKey = await createSessionKey();
        setSessionKey(messageId, sessionKey);
    }, [messageId, message]);

    const handleSubscribeOrRead = useCallback(async () => {
        if (!currentAccount) {
            toaster.error({
                title: "Error",
                description: "Not connected",
            });
            return;
        }

        if (!message) {
            return;
        }

        const isReader = message.readers.includes(currentAccount.address);

        if (isReader) {
            subscribe();
            return;
        }

        await createMessageKey();
    }, [message]);

    if (isLoading) return <Box p={3}><Text color="fg.muted">Loading message...</Text></Box>;
    if (error) return <Box p={3}><Text color="red.500">Error loading message: {error.message}</Text></Box>;
    if (!message) return <Box p={3}><Text color="fg.muted">Message not found.</Text></Box>;

    if (!currentAccount) {
        return (
            <MessageBase message={message} self={self}>
                <Text color="fg.contrast" fontSize="sm">Please connect your wallet to subscribe or read.</Text>
            </MessageBase>
        );
    }
    return (
        <MessageBase message={message} self={self}>
            <Button
                size="sm"
                loading={isLoading}
                onClick={handleSubscribeOrRead}
            >
                {message.readers.includes(currentAccount.address) ? "Read" : "Subscribe"}
            </Button>
        </MessageBase>
    );
}