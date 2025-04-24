"use client"

import { Button } from "@/components/ui/button";
import { Box, Heading, HStack, Icon, Skeleton, StackProps, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { IoIosAdd } from "react-icons/io";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { toaster } from "@/components/ui/toaster";

import { GroupCard } from "./GroupCard";
import { UserControlPanel } from "./UserControlPanel";
import { TGroup } from "@/types";
import { useParams } from "next/navigation";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
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
            <ControlPanelHeader />
            <ControlPanelBody />
            <ControlPanelFooter />
        </VStack>
    )
}

function ControlPanelBody() {
    const currentAccount = useCurrentAccount();
    const { id } = useParams();
    const { registry_get_user_groups, group_get_group_member } = useChatiwalClient();
    const { data: myGroups, isLoading } = useQuery({
        queryKey: ["groups::members"],
        queryFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            const res = await registry_get_user_groups(currentAccount.address);
            const groups: TGroup[] = [];

            await Promise.all(res.map(async (groupId) => {
                groups.push({
                    id: groupId,
                    members: new Set<string>(await group_get_group_member(groupId))
                })
            }))

            return groups;
        },
    })

    return (
        <VStack
            w={"full"}
            flex={"1 0"}
        >
            {isLoading ?
                <Skeleton
                    h={"full"}
                    w={"full"}
                    rounded={"3xl"}
                />
                :
                myGroups?.map((group, index) => (
                    <GroupCard
                        key={index}
                        group={group}
                        isSelected={group.id === id}
                    />
                ))}
        </VStack>
    )
}
function ControlPanelHeader() {
    return (
        <HStack bg={"bg.200"} w={"full"} px={"4"} py={"2"} rounded={"2xl"}>
            <Heading as={"h6"} size={"lg"}>Group</Heading>
        </HStack>
    )
}

function ControlPanelFooter() {
    const { mint_group_and_transfer } = useChatiwalClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

    const handleCreateGroup = async () => {
        try {
            const tx = await mint_group_and_transfer();
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
                onClick={handleCreateGroup}
            >
                <Icon>
                    <IoIosAdd />
                </Icon>
                Mint group
            </Button>
            <UserControlPanel />
        </VStack>
    )
}