"use client"

import { Heading, HStack, Skeleton, StackProps, VStack, Text, Center, For, Image, InputProps, Input, InputGroup, Icon } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { LuSearch } from "react-icons/lu";

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
import { decode } from "@msgpack/msgpack";
import { AddDirectMessage } from "./AddDirectMessage";
import { useDirectMessages } from "../_hooks/useDirectMessages";
import { UserCard } from "./UserCard";
import { useMembershipGroups } from "../_hooks/useMembershipGroups";
import { MenuGroupItem, MenuItem } from "@/components/ui/layout";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    const currentAccount = useCurrentAccount();
    const { getGroupData } = useChatiwalClient();
    const { getGroupMemberships } = useSupabase();
    const { read } = useWalrusClient();
    const { addMembership } = useMembershipGroups();


    const myGroupsQuery = useQuery({
        queryKey: ["groups::memberships", currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            const groupMembershipIds = await getGroupMemberships(currentAccount.address);

            const groupMemberShips: TGroup[] = [];
            const groupDataList = await Promise.all(
                groupMembershipIds.map(async (groupId) => {
                    addMembership(groupId);
                    try {
                        const data = await getGroupData(groupId);
                        if (data) {
                            groupMemberShips.push({
                                id: groupId,
                                members: new Set<string>(data.members),
                                metadata: null as any,
                                createdAt: data.created_at,
                            });
                            return { index: groupMemberShips.length - 1, metadata_blob_id: data.metadata_blob_id };
                        }
                        return null;
                    } catch (error) {
                        console.error("Error fetching group data:", error);
                        return null;
                    }
                })
            );

            const groupDataListWithMetadata = groupDataList.map(async (item) => {
                try {
                    if (item && item.metadata_blob_id) {
                        const bufferArr = await read([item.metadata_blob_id]);
                        groupMemberShips[item.index].metadata = MetadataGroupSchema.parse(decode(bufferArr[0]));
                    }
                } catch (_) { }
            })

            await Promise.all(groupDataListWithMetadata);

            return groupMemberShips;
        },
        enabled: !!currentAccount,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        staleTime: Infinity,
        retry: 0,
    });

    return (
        <VStack
            zIndex={"0"}
            h={"full"}
            gap={"6"}
            p={"4"}
            rounded={"3xl"}
            bg={"bg.200"}
            border={"1px solid"}
            borderColor={"bg.300"}
            {...props}
        >
            <ControlPanelHeader />
            <ControlPanelBody flex={1} myGroupsQuery={myGroupsQuery} />
            <ControlPanelFooter />
        </VStack>
    )
}

interface SearchEngineProps extends InputProps { }
export function SearchEngine({ ...props }: SearchEngineProps) {
    return (
        <InputGroup
            startElement={
                <Icon size={"md"} color={"fg"} as={LuSearch} />
            }
        >
            <Input
                placeholder="Search"
                variant="subtle"
                size="md"
                rounded={"2xl"}
                bg={"bg.300"}
                _placeholder={{ color: "fg.900" }}
                {...props}
            />
        </InputGroup>
    )
}

interface ControlPanelBodyProps extends StackProps {
    myGroupsQuery: ReturnType<typeof useQuery<TGroup[]>>,
}
function ControlPanelBody({ myGroupsQuery, ...props }: ControlPanelBodyProps) {
    const { id } = useParams();
    const { data: myGroups, isLoading } = myGroupsQuery;
    const { directChatAddresses } = useDirectMessages();

    return (
        <VStack
            w={"full"}
            {...props}
        >
            <MenuGroupItem
                label={"DIRECT MESSAGES"}
                endContent={<AddDirectMessage />}
            >
                {
                    <For each={directChatAddresses}>
                        {(address, index) => (
                            <MenuItem key={index}>
                                <UserCard
                                    key={address}
                                    address={address}
                                    isSelected={address === id}
                                />
                            </MenuItem>
                        )}
                    </For>
                }
            </MenuGroupItem>
            <MenuGroupItem
                label={"GROUP"}
                endContent={<MintGroupButton />}
            >
                <VStack w={"full"}>
                    {isLoading ?
                        <Skeleton
                            w={"full"}
                            flex={1}
                            bg={"bg.300"}
                            rounded={"3xl"}
                        />
                        :
                        (myGroups && myGroups?.length) ?
                            myGroups.map((group, index) => (
                                <MenuItem key={index}>
                                    <GroupCard
                                        key={index}
                                        group={group}
                                        isSelected={group.id === id}
                                    />
                                </MenuItem>
                            ))
                            :
                            <EmptyContent
                                emptyText={"No groups found"}
                            />
                    }
                </VStack>
            </MenuGroupItem>
        </VStack>
    )
}
interface ControlPanelHeaderProps extends StackProps {
}

function ControlPanelHeader({ ...props }: ControlPanelHeaderProps) {
    return (
        <VStack {...props} w={"full"}>
            <SearchEngine />
        </VStack>

    )
}


interface ControlPanelFooterProps extends StackProps { }
function ControlPanelFooter(props: ControlPanelFooterProps) {
    return (
        <VStack w={"full"} gap={"4"} {...props}>
            <UserControlPanel />
        </VStack>
    )
}