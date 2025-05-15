"use client"

import { Heading, HStack, VStack, Text, StackProps } from "@chakra-ui/react";

import { useGroup } from "../_hooks/useGroup";
import AddMember from "./AddMember";
import { formatAddress } from "@mysten/sui/utils";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { toaster } from "@/components/ui/toaster";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { useSealClient } from "@/hooks/useSealClient";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HiKey } from "react-icons/hi";
import { SessionKey } from "@mysten/seal";
import { useMemo } from "react";
import { MessagesSnapshotButton } from "./MessagesSnapshotButton";
import { useDirectMessageId } from "../_hooks/useDirectMessageId";
import { useChannelName } from "../_hooks/useChannelName";

interface Props extends StackProps {
    channelType: "DIRECT_CHAT" | "GROUP_CHAT";
}
export function ChatControlPanel({ channelType, ...props }: Props) {
    return (
        <HStack bg={"bg.200"} w={"full"} p={"4"} rounded={"3xl"} {...props}>
            {
                channelType === "GROUP_CHAT" ? <GroupProfile /> :
                    channelType === "DIRECT_CHAT" ? <DirectProfile /> : null
            }
        </HStack>
    )
}

export function GroupProfile() {
    const { group } = useGroup();
    const currentAccount = useCurrentAccount();
    const { setSessionKey, getSessionKey, sessionKeys } = useSessionKeys();
    const { createSessionKey } = useSealClient();
    const { channelName } = useChannelName();

    const currentSessionKey = useMemo<SessionKey | null>(() => {
        const s = getSessionKey(group.id);
        return s instanceof SessionKey ? s : null;
    }, [currentAccount, group, getSessionKey, sessionKeys]);

    const handleSessionKeyCreation = async (
        currentAccount: ReturnType<typeof useCurrentAccount>,
        createSessionKey: () => Promise<any>,
        setSessionKey: (id: string, key: any) => void
    ) => {
        if (!currentAccount) {
            toaster.error({ title: "Error", description: "Not connected." });
            return;
        }

        try {
            const sessionKey = await createSessionKey();
            setSessionKey(channelName, sessionKey);
            toaster.success({ title: "Success", description: "Session key created successfully" });
        } catch (error) {
            toaster.error({
                title: "Key Creation Error",
                description: error instanceof Error ? error.message : "Failed to create session key"
            });
        }
    };

    const handleCreateGroupKey = async () => {
        await handleSessionKeyCreation(currentAccount, createSessionKey, setSessionKey);
    };

    return (
        <HStack w={"full"} align={"center"} justify={"space-between"}>
            <VStack align={"start"} gap={0}>
                <Heading fontSize={"lg"}>{group.metadata?.name || formatAddress(group.id)}</Heading>
                <Text fontSize={"sm"} color={"text.200"}>{group.metadata?.description}</Text>
                <HStack>
                    <Text fontSize={"sm"} color={"fg.900"}>{group.members.size} members</Text>
                    <AddMember />
                </HStack>
            </VStack>
            <HStack>
                <Tooltip
                    content={
                        currentSessionKey ?
                            currentSessionKey.isExpired() ? "Session key expired" : currentSessionKey.getAddress()
                            : "Create group key"
                    }
                >
                    <Button
                        size="sm"
                        p={"1"}
                        onClick={handleCreateGroupKey}
                        colorPalette={currentSessionKey ? currentSessionKey.isExpired() ? "red" : "green" : "default"}
                        variant="outline"
                    >
                        <HiKey />
                    </Button>
                </Tooltip>
                <MessagesSnapshotButton />
            </HStack>
        </HStack>
    )
}

export function DirectProfile() {
    const { id } = useDirectMessageId();
    const { channelName } = useChannelName();
    const currentAccount = useCurrentAccount();
    const { setSessionKey, getSessionKey, sessionKeys } = useSessionKeys();
    const { createSessionKey } = useSealClient()

    const currentSessionKey = useMemo<SessionKey | null>(() => {
        const s = getSessionKey(channelName);
        return s instanceof SessionKey ? s : null;
    }, [currentAccount, channelName, getSessionKey, sessionKeys]);

    const handleSessionKeyCreation = async (
        currentAccount: ReturnType<typeof useCurrentAccount>,
        createSessionKey: () => Promise<any>,
        setSessionKey: (id: string, key: any) => void
    ) => {
        if (!currentAccount) {
            toaster.error({ title: "Error", description: "Not connected." });
            return;
        }

        try {
            const sessionKey = await createSessionKey();
            setSessionKey(channelName, sessionKey);
            toaster.success({ title: "Success", description: "Session key created successfully" });
        } catch (error) {
            toaster.error({
                title: "Key Creation Error",
                description: error instanceof Error ? error.message : "Failed to create session key"
            });
        }
    };

    const handleCreateGroupKey = async () => {
        await handleSessionKeyCreation(currentAccount, createSessionKey, setSessionKey);
    };

    return (
        <HStack w={"full"} align={"center"} justify={"space-between"}>
            <VStack align={"start"} gap={0}>
                <Heading fontSize={"lg"}>{formatAddress(id)}</Heading>
            </VStack>
            <HStack>
                <Tooltip
                    content={
                        currentSessionKey ?
                            currentSessionKey.isExpired() ? "Session key expired" : currentSessionKey.getAddress()
                            : "Create group key"
                    }
                >
                    <Button
                        size="sm"
                        onClick={handleCreateGroupKey}
                        colorPalette={currentSessionKey ? currentSessionKey.isExpired() ? "red" : "green" : "default"}
                        variant="outline"
                    >
                        <HiKey />
                    </Button>
                </Tooltip>
            </HStack>
        </HStack>
    )
}