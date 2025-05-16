"use client"

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { generateColorFromAddress } from "@/libs";
import { TGroup } from "@/types";
import { SUI_EXPLORER_URL } from "@/utils/constants";
import { HStack, StackProps, Text, VStack, Avatar, Icon, Float, Circle, Link, MenuRoot, MenuTrigger, MenuContent, For, MenuItem, MenuItemText, Box, MenuPositioner, Portal, AvatarRoot, Tag, TagRoot, TagLabel } from "@chakra-ui/react"
import { formatAddress } from "@mysten/sui/utils";
import { GiBilledCap } from "react-icons/gi";
import { EllipsisVertical } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { toaster } from "@/components/ui/toaster";
import { IoMdRemoveCircleOutline } from "react-icons/io";
import { Tooltip } from "@/components/ui/tooltip";

interface Props extends StackProps {
    member: string;
    group: TGroup;
    isOnline: boolean;
}
export function MemberCard(props: Props) {
    const { member, group, isOnline } = props;
    const { getGroupCapData, client } = useChatiwalClient();
    const suiClient = useSuiClient();

    const { data: myGroupCaps } = useQuery({
        queryKey: ["member::caps", member],
        queryFn: async () => {
            const res = await suiClient.getOwnedObjects({
                owner: member,
                filter: {
                    StructType: `${client.getPackageConfig().chatiwalId}::group::GroupCap`,
                },
            })
            if (!res) return [];

            return res.data.filter((obj) => obj.data).map((obj) => obj.data?.objectId);
        },
        enabled: !!group,
    })
    const { data: hasCap } = useQuery({
        queryKey: ["group::member::cap", member, group.id],
        queryFn: async () => {
            if (!myGroupCaps) return false;
            for (const cap of myGroupCaps) {
                const capData = await getGroupCapData(cap!);
                if (capData && capData.group_id === group.id) {
                    return true;
                }
            }

            return false;
        },
        enabled: !!group && !!myGroupCaps,
    })

    return (
        <HStack
            className="group"
            w={"full"}
            justify={"space-between"}
            align={"center"}
            p={"2"}
            transition="all 0.2s ease-in-out"
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            {...props}
        >
            <HStack gap={"2"} align={"center"}>
                <AvatarRoot size={"md"} bg={"transparent"}>
                    <Icon as={ChatiwalMascotIcon} size={"lg"} color={generateColorFromAddress(member)} />
                    <Float placement="bottom-end" offsetX="1" offsetY="2">
                        <Circle
                            bg={isOnline ? "green.500" : "gray.500"}
                            size="8px"
                        />
                    </Float>
                </AvatarRoot>
                <Link
                    color={"fg"}
                    fontSize={"sm"}
                    href={`${SUI_EXPLORER_URL}/object/${member}`}
                >
                    {formatAddress(member)}
                </Link>
                {hasCap && (
                    <Tooltip
                        content={"Full access to group"}
                    >
                        <TagRoot rounded="full" colorPalette={"primary"}>
                            <TagLabel>
                                Admin
                            </TagLabel>
                        </TagRoot>
                    </Tooltip>
                )}
            </HStack>
            <MemberMenu
                member={member}
                group={group}
            />
        </HStack>
    )
}
interface MemberCardProps extends StackProps {
    member: string;
    group: TGroup;
}
const MemberMenu = ({ member, group }: MemberCardProps) => {
    const { mintGroupCap, removeMember } = useChatiwalClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const queryClient = useQueryClient();

    const { mutate: mintCap } = useMutation({
        mutationKey: ["group::member::remove", member],
        mutationFn: async () => {
            const tx = await mintGroupCap(group.id, member);
            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        toaster.success({
                            title: "Cap minted",
                            description: "The group cap has been minted.",
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["group::members", group.id],
                        })
                    },
                    onError: (error) => {
                        toaster.error({
                            title: "Error",
                            description: error.message,
                        });
                    }
                }
            )
        }
    })
    const { mutate: kick } = useMutation({
        mutationKey: ["group::member::grant", member],
        mutationFn: async () => {
            const tx = await removeMember(group.id, member);
            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        toaster.success({
                            title: "Member removed",
                            description: "The member has been removed from the group.",
                        });
                        queryClient.invalidateQueries({
                            queryKey: ["group::members", group.id],
                        })
                        queryClient.invalidateQueries({
                            queryKey: ["member::caps::cap", member, group.id],
                        })
                    },
                    onError: (error) => {
                        toaster.error({
                            title: "Error",
                            description: error.message,
                        });
                    }
                }
            )
        }
    })

    const items = [
        {
            label: "Kick",
            icon: <IoMdRemoveCircleOutline />,
            onClick: () => {
                kick();
            }
        },
        {
            label: "Mint Cap",
            icon: <GiBilledCap />,
            onClick: () => {
                mintCap();
            }
        }
    ]

    return (
        <MenuRoot>
            <MenuTrigger asChild>
                <Icon colorPalette={"default"} size={"sm"}>
                    <EllipsisVertical />
                </Icon>
            </MenuTrigger>
            <Portal>
                <MenuPositioner>
                    <MenuContent rounded={"2xl"} bg={"bg.300"} border={"1px solid"} borderColor={"bg.400"} shadow={"custom.sm"}>
                        <For each={items} fallback={<Text>No actions available</Text>}>
                            {(item) => (
                                <MenuItem _hover={{ bg: "bg.400" }} rounded={"lg"} key={item.label} value={item.label} onClick={item.onClick}>
                                    <Icon color={"fg.contrast"} boxSize={4} mr={2}>
                                        {item.icon}
                                    </Icon>
                                    <Box flex={1}>{item.label}</Box>
                                </MenuItem>
                            )}
                        </For>
                    </MenuContent>
                </MenuPositioner>
            </Portal>
        </MenuRoot>
    )
}