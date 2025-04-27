"use client"

import { Button } from "@/components/ui/button";
import { Heading, HStack, Icon, Skeleton, StackProps, VStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { IoIosAdd } from "react-icons/io";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { toaster } from "@/components/ui/toaster";

import { GroupCard } from "./GroupCard";
import { UserControlPanel } from "./UserControlPanel";
import { TGroup } from "@/types";
import { useParams } from "next/navigation";
import EmptyContent from "@/components/ui/empty-content";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { bcs } from "@mysten/sui/bcs";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { RegistryStruct } from "@/sdk";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    const { getRegistry, getGroupData } = useChatiwalClient();
    const { readMessage } = useWalrusClient();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const myGroupsQuery = useQuery({
        queryKey: ["groups::members"],
        queryFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            console.log("fetching")
            // const registry = await getRegistry();
            const test = await suiClient.getDynamicFields({
                parentId: "0x20efe3925dddb7cb5b3ecf050e5b087baf2ef82e31c94353137fa584e971a128"
            })
            const test1 = await suiClient.getDynamicFieldObject({
                parentId: "0x20efe3925dddb7cb5b3ecf050e5b087baf2ef82e31c94353137fa584e971a128",
                name: {
                    type: "0x2::table::Table<address, 0x2::vec_set::VecSet<0x2::object::ID>>",
                    value: "0xdc727e968b6f774ef5374c023fc9d060af613bd5be3dc342cd3eea7073dadea8"
                }
            })
            console.log(test1)
            console.log(test)
            // console.log(await getGroupData("0x729b9265519e5e42f79c2d3214306f5dd8d8845c5b78edda3bd1e5ff53b16144"))

            // const groupIds = registry.user_groups.get(currentAccount.address) || [];
            // const groups = await Promise.all(
            //     groupIds.map(async (value) => {
            //         const group = await getGroupData(value);
            //         if (!group) return null;
            //         return {
            //             id: group.id,
            //             members: new Set<string>(group.members),
            //         } as TGroup;
            //     })
            // );

            return [] as TGroup[];
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