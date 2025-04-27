"use client"

import { Heading, HStack, Skeleton, StackProps, VStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";

import { GroupCard } from "./GroupCard";
import { UserControlPanel } from "./UserControlPanel";
import { TGroup } from "@/types";
import { useParams } from "next/navigation";
import EmptyContent from "@/components/ui/empty-content";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { useSupabase } from "@/hooks/useSupabase";
import { MintGroupButton } from "./MintGroupButton";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    const { getGroupData } = useChatiwalClient();
    const { getGroupMemberships } = useSupabase();
    const suiClient = useSuiClient();
    const { readMessage } = useWalrusClient();
    const currentAccount = useCurrentAccount();
    const myGroupsQuery = useQuery({
        queryKey: ["groups::members"],
        queryFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            const groupMembershipIds = await getGroupMemberships(currentAccount.address);
            console.log("Group memberships 1:", groupMembershipIds);
            const groupMemberShips: TGroup[] = [];

            for (const groupId of groupMembershipIds) {
                console.log("Group membership id:", groupId);
                const data = await getGroupData(groupId);
                console.log("Group membership data:", data);
                if (data) {
                    groupMemberShips.push({
                        id: groupId,
                        members: new Set<string>(data.members),
                    });
                }
            }
            // console.log("Group memberships:", groupMemberShips);

            return groupMemberShips;
        },
        enabled: !!currentAccount,
        retry: 0,
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
                (myGroups && myGroups?.length) ?
                    myGroups.map((group, index) => (
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

    return (
        <VStack w={"full"} gap={"4"}>
            <MintGroupButton />
            <UserControlPanel />
        </VStack>
    )
}