"use client"

import { Heading, HStack, Skeleton, StackProps, VStack, Text, Center } from "@chakra-ui/react";
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
import { decode } from "@msgpack/msgpack";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    const currentAccount = useCurrentAccount();
    const { getGroupData } = useChatiwalClient();
    const { getGroupMemberships } = useSupabase();
    const { read } = useWalrusClient();

    const myGroupsQuery = useQuery({
        queryKey: ["groups::memberships", currentAccount?.address],
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
            p={"4"}
            bg={"bg.100"}
            gap={"6"}
            {...props}
        >
            <ControlPanelBody flex={1} myGroupsQuery={myGroupsQuery} />
            <ControlPanelFooter />
        </VStack>
    )
}

interface ControlPanelBodyProps extends StackProps {
    myGroupsQuery: ReturnType<typeof useQuery<TGroup[]>>,
}
function ControlPanelBody({ myGroupsQuery, ...props }: ControlPanelBodyProps) {
    const { id } = useParams();
    const { data: myGroups, isLoading } = myGroupsQuery;

    return (
        <VStack
            w={"full"}
            {...props}
        >
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
            </MenuGroupItem>
        </VStack>
    )
}
interface ControlPanelHeaderProps extends StackProps {
    myGroupsQuery: ReturnType<typeof useQuery<TGroup[]>>,
}

function ControlPanelHeader({ myGroupsQuery, ...props }: ControlPanelHeaderProps) {
    const { data: myGroups, isLoading } = myGroupsQuery;

    return (
        <VStack {...props} w={"full"} gap={"4"}>
        </VStack>

    )
}

interface MenuGroupItemProps extends StackProps {
    label?: string;
    icon?: React.ReactNode;
    endContent?: React.ReactNode;
}
function MenuGroupItem({
    label,
    icon,
    endContent,
    children,
    ...props
}: MenuGroupItemProps) {
    return (
        <VStack w={"full"} {...props}>
            <HStack justify={"space-between"} w={"full"}>
                <Text pl={"2"} fontSize={"md"} fontWeight={"medium"} color={"fg.900"} textTransform="uppercase">
                    {icon}
                    {label}
                </Text>
                {endContent}
            </HStack>
            {children}
        </VStack>
    )
}

interface MenuItemProps extends StackProps {
}
function MenuItem({ children, ...props }: MenuItemProps) {
    return (
        <Center
            w={"full"}
        >
            {children}
        </Center>
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