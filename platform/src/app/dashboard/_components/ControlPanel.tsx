"use client"

import { Button } from "@/components/ui/button";
import { Box, Heading, HStack, Icon, StackProps, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { IoIosAdd } from "react-icons/io";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { toaster } from "@/components/ui/toaster";

import { GroupCard } from "./GroupCard";
import { UserControlPanel } from "./UserControlPanel";

interface Props extends StackProps { }
export function ControlPanel(props: Props) {
    return (
        <VStack
            pos={"relative"}
            overflow={"hidden"}
            zIndex={"0"}
            h={"full"}
            p={"4"}
            bg={"bg.100/75"}
            backdropBlur={"2xl"}
            rounded={"4xl"}
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
    const suiClient = useSuiClient();
    const { data: ownedGroups } = useQuery({
        queryKey: ["groups::owned"],
        queryFn: async () => {
            const res = await suiClient.getObject({
                id: "0xdc78ccceb13d754d2989b89b2190497ed6344d22a4304714face0880fb7ddfff",
                options: {
                    showContent: true,
                }
            });
            console.log("ownedGroups", res);
            if (res.error) {
                console.error("Error fetching groups", res.error);
                return null;
            }

            const ownedGroups = [];
            ownedGroups.push(res.data?.content);
            return ownedGroups;
        },
    })

    return (
        <VStack
            w={"full"}
            flex={"1 0"}
        >
            {ownedGroups?.map((group, index) => (
                <GroupCard
                    key={index}
                    group={group}
                />
            ))}
        </VStack>
    )
}
function ControlPanelHeader() {
    return (
        <HStack bg={"bg.200"} w={"full"} px={"4"} py={"2"} rounded={"full"}>
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
        <VStack w={"full"}>
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