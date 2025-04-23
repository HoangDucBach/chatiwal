"use client"

import { Button } from "@/components/ui/button";
import { Box, Heading, HStack, Icon, StackProps, VStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { IoIosAdd } from "react-icons/io";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { toaster } from "@/components/ui/toaster";

import { GroupCard } from "./GroupCard";
import { useGroup } from "../_hooks/useGroupId";
import { useChannel } from "ably/react";
import { useState } from "react";
import { MemberCard } from "./MemberCard";

interface Props extends StackProps { }
export function GroupControlPanel(props: Props) {
    return (
        <VStack
            pos={"relative"}
            overflow={"hidden"}
            zIndex={"0"}
            h={"full"}
            p={"4"}
            bg={"bg.100"}
            backdropBlur={"2xl"}
            rounded={"4xl"}
            gap={"6"}
            {...props}
        >
            <Box
                pos={"absolute"}
                bottom={0}
                left={0}
                w={"32"}
                h={"32"}
                zIndex={"-1"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(128px)"}
            />
            <GroupControlPanelHeader />
            <GroupControlPanelBody />
            <GroupControlPanelFooter />
        </VStack>
    )
}

function GroupControlPanelBody() {
    const suiClient = useSuiClient();
    const { group } = useGroup();
    const { channel } = useChannel({ channelName: group.id });

    const { data: memberPresence = new Set<string>() } = useQuery({
        queryKey: ["group::members::presence"],
        queryFn: async () => {
            if (!channel) throw new Error("Channel not found");

            const members = await channel.presence.get();
            const memberPresence = new Set<string>();

            members.forEach((member) => {
                if (member.clientId) {
                    memberPresence.add(member.clientId);
                }
            });
            return memberPresence;
        },
        enabled: !!channel,
    })

    if (!group) return null;

    return (
        <VStack
            w={"full"}
            flex={"1 0"}
        >
            {group.members.values().map((member) => (
                <MemberCard
                    key={member}
                    member={member}
                    group={group}
                    isOnline={memberPresence?.has(member)}
                />
            ))}
        </VStack>
    )
}
function GroupControlPanelHeader() {
    const { group } = useGroup();

    return (
        <HStack bg={"bg.200"} w={"full"} px={"4"} py={"2"} rounded={"2xl"}>
            <Heading as={"h6"} size={"lg"}>Member</Heading>
            <Text fontSize={"sm"} color={"fg.800"}>{group.members.size}</Text>
        </HStack>
    )
}

function GroupControlPanelFooter() {
    const { group } = useGroup();
    const { add_member } = useChatiwalClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

    const handleAddMember = async () => {
        try {
            const tx = await add_member(group.id, "0xa34034f5a6e9758e540e3f8054c6aebea055f5948bde9e9aba48be015c98cd99");
            signAndExecuteTransaction({
                transaction: tx,
            }, {
                onSuccess: (res) => {
                    toaster.success({
                        title: "Group created successfully",
                        description: "Your group has been created and you are the owner.",
                    })
                },
                onError: (error) => {
                    toaster.error({
                        title: "Error creating group",
                        description: "There was an error creating your group. Please try again.",
                        meta: error,
                    })
                }
            })
        } catch (error) {
            console.error("Error creating group", error);
        }
    }

    return (
        <VStack w={"full"} gap={"4"}>
            <Button
                colorPalette={"default"}
                w={"full"}
                onClick={handleAddMember}
            >
                <Icon>
                    <IoIosAdd />
                </Icon>
                Add member
            </Button>
        </VStack>
    )
}