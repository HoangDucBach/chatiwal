"use client"

import { Button } from "@/components/ui/button";
import { Heading, HStack, Icon, Skeleton, StackProps, VStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { IoIosAdd } from "react-icons/io";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { toaster } from "@/components/ui/toaster";

import { GroupCard } from "./GroupCard";
import { UserControlPanel } from "./UserControlPanel";
import { TGroup } from "@/types";
import { useParams } from "next/navigation";
import EmptyContent from "@/components/ui/empty-content";
import { useWalrusClient } from "@/hooks/useWalrusClient";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    const { registry_get_user_groups, group_get_group_member } = useChatiwalClient();
    const { readMessage } = useWalrusClient();
    const currentAccount = useCurrentAccount();
    const myGroupsQuery = useQuery({
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
            }));

            return groups;
        },
    });

    return (
        <VStack
            zIndex={"0"}
            h={"full"}
            p={"6"}
            bg={"bg.200/75"}
            backdropFilter={"blur(256px)"}
            rounded={"4xl"}
            gap={"6"}
            shadow={"custom.md"}
            {...props}
        >
            <ControlPanelHeader myGroupsQuery={myGroupsQuery} />
            <ControlPanelBody myGroupsQuery={myGroupsQuery} />
            <ControlPanelFooter />
        </VStack>
    )
}

interface ControlPanelBodyProps {
    myGroupsQuery: ReturnType<typeof useQuery<TGroup[]>>,
}
function ControlPanelBody({ myGroupsQuery }: ControlPanelBodyProps) {
    const { id } = useParams();
    const { data: myGroups, isLoading } = myGroupsQuery;

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
                myGroups ? myGroups.map((group, index) => (
                    <GroupCard
                        key={index}
                        group={group}
                        isSelected={group.id === id}
                    />
                ))
                    :
                    <EmptyContent
                        emptyText={"No groups found"}
                    />
            }
        </VStack>
    )
}
interface ControlPanelHeaderProps {
    myGroupsQuery: ReturnType<typeof useQuery<TGroup[]>>,
}

function ControlPanelHeader({ myGroupsQuery }: ControlPanelHeaderProps) {
    const { data: myGroups, isLoading } = myGroupsQuery;
    return (
        <HStack w={"full"} px={"4"} py={"2"} justify={"space-between"} rounded={"2xl"}>
            <Heading as={"h6"} size={"2xl"}>Group</Heading>
            <Text color={"fg.700"} fontSize={"lg"}>{myGroups?.length || 0}</Text>
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