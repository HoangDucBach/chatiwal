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
import { MetadataGroupSchema } from "@/libs/schema";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    const currentAccount = useCurrentAccount();
    const { getGroupData } = useChatiwalClient();
    const { getGroupMemberships } = useSupabase();
    const { read } = useWalrusClient();

    const myGroupsQuery = useQuery({
        queryKey: ["groups::members"],
        queryFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            const groupMembershipIds = await getGroupMemberships(currentAccount.address);
            const groupMemberShips: TGroup[] = [];

            const groupDataList = await Promise.all(
                groupMembershipIds.map(async (groupId) => {
                    const data = await getGroupData(groupId);
                    if (data) {
                        groupMemberShips.push({
                            id: groupId,
                            members: new Set<string>(data.members),
                            metadata: null as any,
                        });
                        return { index: groupMemberShips.length - 1, metadata_blob_id: data.metadata_blob_id };
                    }
                    return null;
                })
            );

            await Promise.all(
                groupDataList.map(async (item) => {
                    if (item && item.metadata_blob_id) {
                        const bufferArr = await read([item.metadata_blob_id]);
                        const metadataStr = new TextDecoder().decode(bufferArr[0]);
                        groupMemberShips[item.index].metadata = MetadataGroupSchema.parse(JSON.parse(metadataStr));
                    }
                })
            );

            return groupMemberShips;
        },
        enabled: !!currentAccount,
        retry: 0,
    });

    return (
        <VStack
            zIndex={"0"}
            h={"full"}
            p={"4"}
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
            <Heading as={"h6"} size={"lg"}>Group</Heading>
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