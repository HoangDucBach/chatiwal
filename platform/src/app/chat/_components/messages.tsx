"use client";

import { Box, BoxProps, Avatar as ChakraAvatar, HStack, Icon, Image, Text, VStack, Float, Circle, For, Heading, DataListRoot, DataListItem, DataListItemValue, DataListItemLabel, Link } from "@chakra-ui/react";
import { formatAddress, SUI_DECIMALS } from "@mysten/sui/utils";
import { useMemo, useCallback, useEffect } from "react";
import ReactPlayer from "react-player";
import { useChannel } from "ably/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { TbCalendar } from "react-icons/tb";
import { TbCalendarPause } from "react-icons/tb";
import { TiUserOutline } from "react-icons/ti";
import BigNumber from "bignumber.js";

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { formatTime, generateColorFromAddress, parseSuiError } from "@/libs";
import { MediaContent, MessageType, TMessage } from "@/types";
import { EAlreadyPaid, EHaveModulePrefix, EInsufficientPayment, EMaxReadsReached, ENoAccess, ENoFeesToWithdraw, ENotMatch, ENotMessageRecipient, EPaymentNotAllowed, ETimeLockExpired, ETimeLockTooEarly } from "@/sdk/contracts"; // Unified struct
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useSealClient } from "@/hooks/useSealClient";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { decode } from "@msgpack/msgpack";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { motion } from "framer-motion";
import { HiKey } from "react-icons/hi";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { useChannelName } from "../_hooks/useChannelName";
import { SessionKey } from "@mysten/seal";
import { SUI_EXPLORER_URL } from "@/utils/constants";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";

const MotionVStack = motion.create(VStack);
const MotionHStack = motion.create(HStack);

const ErrorMessages: Record<number, string> = {
    [ETimeLockExpired]: "Time lock expired",
    [ETimeLockTooEarly]: "Time lock too early",
    [EMaxReadsReached]: "Max reads reached",
    [EInsufficientPayment]: "Insufficient payment",
    [EAlreadyPaid]: "Already paid",
    [EPaymentNotAllowed]: "Payment not allowed",
    [ENoFeesToWithdraw]: "No fees to withdraw",
    [ENoAccess]: "No access",
    [ENotMessageRecipient]: "Not message recipient",
    [ENotMatch]: "Not match",
    [EHaveModulePrefix]: "Have module prefix",
};

interface ContentProps {
    self?: boolean;
    media: MediaContent;
}

export function Content(props: ContentProps) {
    const { media, self } = props;

    const isImage = media.mimeType.startsWith("image/");
    const isVideo = media.mimeType.startsWith("video/");
    const isAudio = media.mimeType.startsWith("audio/");
    const isText = media.mimeType === "text/plain";


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

    const getAspectRatio = () => {
        if (isImage) {
            return "16/9";
        }
        if (isVideo) {
            return "16/9";
        }
        if (isAudio) {
            return "5/1";
        }

        return "auto";
    }


    const mediaNode = useMemo(() => {
        const decodedUrl = decodeMediaAsUrl?.url;
        if (!decodedUrl) return <Text color="fg.contrast" fontSize="sm">No preview available</Text>;

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

        if (isVideo) {
            return (
                <ReactPlayer
                    url={decodedUrl}
                    config={{
                        file: {
                            forceAudio: isAudio,
                            forceVideo: isVideo,
                            attributes: {
                                controls: true,
                            },
                        }
                    }}
                    width="100%"
                    height={"100%"}
                    controls
                    playing={false}
                    style={{
                        borderRadius: "inherit",
                    }}
                />
            );
        }

        if (isAudio) {
            return (
                <ReactPlayer
                    url={decodedUrl}
                    config={{
                        file: {
                            forceAudio: isAudio,
                            attributes: {
                                controls: true,
                            },
                        }
                    }}
                    width="100%"
                    height={"64px"}
                    controls
                    playing={false}
                    style={{
                        borderRadius: "inherit",
                    }}
                />
            );
        }
        if (isText && typeof media.raw === 'string') {
            return (
                <Text
                    fontSize={"sm"}
                    color={"fg"}
                    w={"fit"}
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

    if (!media) return null;

    return (
        <VStack
            align={"start"}
            justify={"start"}
            gap={"1"}
            w={"full"}
            h={"auto"}
        >
            {mediaNode}
        </VStack>
    )
}
interface MessageBaseProps extends BoxProps {
    message: TMessage;
    self?: boolean;
}
export function MessageBase(props: MessageBaseProps) {
    const { message, self = true } = props;
    const { channelName } = useChannelName();
    const { channel } = useChannel({ channelName });
    const channelType = AblyChannelManager.getChannelType(channelName);
    const { decrypt } = useSealClient();
    const { getSessionKey, sessionKeys } = useSessionKeys();
    const { read } = useWalrusClient();
    const currentAccount = useCurrentAccount();

    const sessionKey = useMemo(() => {
        let sessionKey;
        switch (message.type) {
            case MessageType.GROUP:
                sessionKey = getSessionKey(channelName);
                break;
            case MessageType.DIRECT:
                sessionKey = getSessionKey(channelName);
                break;
            case MessageType.SUPER_MESSAGE:
                sessionKey = getSessionKey(message.id);
                break;
            default:
                sessionKey = getSessionKey(channelName);
                break;
        }
        if (!sessionKey) {
            return null;
        }
        return sessionKey;
    }, [message, sessionKeys]);

    const { data: decryptedContent, isLoading: isDecrypting, error: decryptError, refetch } = useQuery({
        queryKey: ["messages::group::decrypt", message.id, sessionKey],
        queryFn: async (): Promise<MediaContent[] | null> => {
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
                    message.content = decode(res[0]) as Uint8Array;
                } catch (err) {
                    console.error(err);
                }
            }

            if (!sessionKey) {
                return null;
            }

            const decryptedBytes = await decrypt(message.content, sessionKey, {
                type: message.type,
                messageId: message.id,
                groupId: message.groupId,
                msgId: message.id,
            });
            const decodedData = decode(decryptedBytes) as MediaContent[];
            return decodedData;
        },
        enabled: !!message && !!sessionKey,
        refetchInterval: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const { data: isOnline } = useQuery({
        queryKey: ["messages::group::get::status", message.owner],
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
            <ChakraAvatar.Root size={"md"} bg={"transparent"}>
                <Icon as={ChatiwalMascotIcon} size={"lg"} color={generateColorFromAddress(message.owner)} />
                <Float placement="bottom-end" offsetX="1" offsetY="2">
                    <Circle
                        bg={isOnline ? "green.500" : "gray.500"}
                        size="8px"
                    />
                </Float>
            </ChakraAvatar.Root>
        )
    };

    const Header = () => {
        const formattedTime = formatTime(Number(message.createdAt));

        return (
            <HStack w={"full"} align="center" justify={"space-between"}>
                <Link href={`${SUI_EXPLORER_URL}/account/${message.owner}`} target="_blank" rel="noopener noreferrer">
                    <Text
                        fontSize={"md"}
                        color={generateColorFromAddress(message.owner)}
                        fontWeight={"medium"}
                    >
                        {self ? "You" : formatAddress(message.owner)}
                    </Text>
                </Link>
                <Text
                    fontSize={"xs"}
                    color={"fg.contrast"}
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
        <MotionHStack
            w={"full"}
            align={"start"}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
            }}
        >
            <Avatar />
            <VStack
                align={"start"}
                gap={"1"}
                w={"full"}
            >
                <Header />
                {renderContent()}
                {props.children}
            </VStack>
        </MotionHStack>
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
    const queryClient = useQueryClient();
    const { channelName } = useChannelName();
    const { channel } = useChannel({ channelName });

    const { data: message, isLoading, error } = useQuery({
        queryKey: ["messages::group::get::object", messageId],
        queryFn: async (): Promise<TMessage | null> => {
            if (!messageId) return null;
            const superMsg = await getSuperMessageData(messageId);

            try {
                const tMsg: TMessage = {
                    id: messageId,
                    type: MessageType.SUPER_MESSAGE,
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
                    createdAt: superMsg.created_at,
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
            let tx = new Transaction();
            tx = await readMessage(message.id, message.feePolicy?.fee_amount || 0, {tx});

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

            queryClient.invalidateQueries({
                queryKey: ["messages::group::get::object", messageId],
            });

            channel.publish(AblyChannelManager.EVENTS.MESSAGE_SUBSCRIBE, {})
        },

        onError: (error) => {
            const parsedError = parseSuiError(error.message);
            const errorCode = parsedError.code;
            const errorMessage = errorCode ? ErrorMessages[errorCode] : "Unknown error";

            toaster.error({
                title: "Error",
                description: errorMessage,
            });
        }
    })

    useEffect(() => {
        channel.subscribe(AblyChannelManager.EVENTS.MESSAGE_SUBSCRIBE, (message) => {
            queryClient.invalidateQueries({
                queryKey: ["messages::group::get::object", messageId],
            });
        });
        return () => {
            channel.unsubscribe(AblyChannelManager.EVENTS.MESSAGE_SUBSCRIBE);
        };

    }, [channel]);
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
            await createMessageKey();
            queryClient.invalidateQueries({
                queryKey: ["messages::group::decrypt", messageId],
            });
            return;
        }

        subscribe();
    }, [message]);

    const preCheckBeforeRead = useMemo<{
        disabled: boolean;
        label: string | null;
    }>(() => {
        if (!message) return { disabled: false, label: null };
        if (!currentAccount) return { disabled: false, label: null };

        if (message.readers.includes(currentAccount?.address)) return { disabled: false, label: null };

        let disabled = false;
        let label = null;

        if (message.timeLockPolicy) {
            const now = Date.now();
            if (message.timeLockPolicy.from && Number(message.timeLockPolicy.from) > now) {
                disabled = true;
                label = "Time lock not started";
            }

            if (message.timeLockPolicy.to && Number(message.timeLockPolicy.to) < now) {
                disabled = true;
                label = "Time lock expired";
            }
        }
        if (message.limitedReadPolicy) {
            if (message.limitedReadPolicy.max && message.readers.length >= Number(message.limitedReadPolicy.max)) {
                disabled = true;
                label = "Max readers reached";
            }
        }

        return { disabled, label };
    }, [message, new Date()]);
    const formatFee = useMemo(() => {
        if (!message) return "Free";
        if (!message.feePolicy) return "Free";
        const fee = new BigNumber(message.feePolicy.fee_amount).dividedBy(10 ** SUI_DECIMALS);
        return fee.isZero() ? "Free" : `${fee.toFormat()} SUI`;
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

    const items = [
        {
            label: "Time Lock",
            hasPolicy: message.timeLockPolicy !== undefined,
            fields: [
                {
                    label: "Start",
                    icon: <TbCalendarPause />,
                    value: message.timeLockPolicy?.from
                        ? formatTime(Number(message.timeLockPolicy.from))
                        : "-",
                },
                {
                    label: "End",
                    icon: <TbCalendar />,
                    value: message.timeLockPolicy?.to
                        ? formatTime(Number(message.timeLockPolicy.to))
                        : "-",
                },
            ]
        },
        {
            label: "Limited Read",
            hasPolicy: message.limitedReadPolicy !== undefined,
            fields: [
                {
                    label: "Readers",
                    icon: <TiUserOutline />,
                    value: message.readers.length,
                },
                {
                    label: "Max Readers",
                    icon: <TiUserOutline />,
                    value: message.limitedReadPolicy?.max || "No limit",
                },
            ]
        },
    ];


    return (
        <MessageBase message={message} self={self}>
            <VStack p={"3"} bg={"bg.200"} rounded={"3xl"} justify={"center"} shadow={"custom.md"} w={"full"}>
                <HStack rounded={"2xl"} w={"full"} bg={"bg.300"} p={"2"}>
                    <Heading as={"h6"} size={"md"} fontWeight={"medium"} textAlign={"start"} w={"full"}>
                        Super Message Policy
                    </Heading>
                </HStack>
                <VStack gap={"2"} align={"start"} w={"full"}>
                    {items.map((item, index) => (
                        item.hasPolicy && (
                            <DataListRoot w={"full"} orientation={"horizontal"} key={index}>
                                <HStack gap={"6"} justify={"space-between"} w={"full"}>
                                    {
                                        item.fields.map((field, fieldIndex) => (
                                            <DataListItem key={fieldIndex}>
                                                <DataListItemLabel minW={"fit"} color={"fg.contrast"}>
                                                    <Icon size={"sm"}>
                                                        {field.icon}
                                                    </Icon>
                                                    {field.label}
                                                </DataListItemLabel>
                                                <DataListItemValue>
                                                    {field.value}
                                                </DataListItemValue>
                                            </DataListItem>
                                        ))
                                    }
                                </HStack>
                            </DataListRoot>
                        )
                    ))}
                </VStack>
                <HStack justify={"space-between"} gap={"1"} w={"full"}>
                    <VStack align={"start"} gap={"0"}>
                        <Text fontSize={"sm"} fontWeight={"semibold"} color={"fg"}>
                            {formatFee}
                        </Text>
                        <Text fontSize={"xs"} color={"fg.contrast"}>
                            Fee per read
                        </Text>
                    </VStack>
                    <Button
                        size="sm"
                        variant={message.readers.includes(currentAccount.address) ? "outline" : "solid"}
                        colorPalette={preCheckBeforeRead.disabled ? "red" : "primary"}
                        disabled={preCheckBeforeRead.disabled}
                        loading={isLoading}
                        onClick={handleSubscribeOrRead}
                    >
                        {
                            message.readers.includes(currentAccount.address)
                                ? <HiKey />
                                : preCheckBeforeRead.disabled
                                    ? preCheckBeforeRead.label
                                    : "Subscribe"
                        }
                    </Button>
                </HStack>
            </VStack>
        </MessageBase>
    );
}