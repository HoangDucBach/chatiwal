"use client"
import { StackProps, VStack, Heading, Center, CenterProps, Text, Span, AccordionItemIndicator, TagRoot, TagLabel, HStack } from "@chakra-ui/react";
import { formatTime } from "@/libs";

import { useGroup } from "../_hooks/useGroup";
import { formatAddress } from "@mysten/sui/utils";
import { useDirectMessageId } from "../_hooks/useDirectMessageId";
import { MemberCard } from "./MemberCard";
import { useQuery } from "@tanstack/react-query";
import { useAbly } from "ably/react";
import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from "@/components/ui/accordion";
import { useChannelName } from "../_hooks/useChannelName";
import EmptyContent from "@/components/ui/empty-content";



interface Props extends CenterProps {
    channelType: "DIRECT_CHAT" | "GROUP_CHAT";
}

export function ChatInfo({ channelType, ...props }: Props) {
    return (
        <Center
            flex={2}
            h="full"
            p={"4"}
            {...props}
        >
            {
                channelType === "GROUP_CHAT" ?
                    <GroupInfo /> :
                    channelType === "DIRECT_CHAT" ?
                        <DirectInfo /> :
                        null
            }
        </Center>
    )
}

interface GroupInfoProps extends StackProps {
}
export function GroupInfo({ ...props }: GroupInfoProps) {
    const { group } = useGroup();
    const { channelName } = useChannelName();
    const ably = useAbly();

    const Header = () => {
        return (
            <VStack
                w={"full"}
                gap={0}
                align={"start"}
            >
                <Heading
                    fontSize={"lg"}
                    as={"h2"}
                    fontWeight={"medium"}
                    color={"fg"}
                >
                    Group Info
                </Heading>
                <Text
                    fontSize={"sm"}
                    color={"fg.900"}
                >
                    Created at {group && formatTime(Number(group.createdAt))}
                </Text>
            </VStack>
        )
    }

    const Details = () => {
        return (
            <VStack
                w={"full"}
                gap={0}
                align={"start"}
            >
                <HStack>
                    {
                        group.metadata?.tags && group.metadata.tags.length > 0 && (
                            group.metadata.tags.map((tag, index) => (
                                <TagRoot key={index} rounded={"full"}>
                                    <TagLabel>
                                        {tag}
                                    </TagLabel>
                                </TagRoot>
                            ))
                        )
                    }
                </HStack>
                {
                    group?.metadata?.description ?
                        <Text
                            fontSize={"sm"}
                            color={"fg.900"}
                        >
                            {group?.metadata?.description}
                        </Text> :
                        <EmptyContent
                            emptyText={"No description"}
                        />
                }
            </VStack>
        )
    }

    const Members = () => {
        const { data: memberPresence = new Set<string>() } = useQuery({
            queryKey: ["group::members::presence"],
            queryFn: async () => {
                if (!group) throw new Error("Group not found");
                const channel = ably.channels.get(channelName);
                const members = await channel.presence.get();
                const memberPresence = new Set<string>();
                members.forEach((member) => {
                    if (member.clientId) {
                        memberPresence.add(member.clientId);
                    }
                });
                return memberPresence;
            },
            refetchInterval: 30000,
            staleTime: 25000,
        });
        if (!group) return null;
        if (!group.members) return null;

        return (
            <VStack
                w={"full"}
                gap={0}
                align={"start"}
            >
                {[...group?.members?.entries() || []].map(([member, _]) => (
                    <MemberCard
                        key={member}
                        member={member}
                        group={group}
                        isOnline={memberPresence?.has(member)}
                    />
                ))
                }
            </VStack>
        )
    }

    const items = [
        {
            value: "details",
            label: "Details",
            content: <Details />,
        },
        {
            value: "members",
            label: "Members",
            content: <Members />,
        },
    ]

    return (
        <VStack
            w={"full"}
            h={"full"}
            {...props}
        >
            <Header />
            <AccordionRoot multiple>
                {items.map((item) => (
                    <AccordionItem
                        key={item.value}
                        value={item.value}
                    >
                        <AccordionItemTrigger>
                            <Span
                                fontSize={"sm"}
                                color={"fg.900"}
                                fontWeight={"medium"}
                                textTransform={"uppercase"}
                                mb={"2"}
                            >
                                {item.label}
                            </Span>
                        </AccordionItemTrigger>
                        <AccordionItemContent>
                            {item.content}
                        </AccordionItemContent>
                    </AccordionItem>
                ))}
            </AccordionRoot>
        </VStack>
    )
}

interface DirectInfoProps extends StackProps {

}
export function DirectInfo({ ...props }: DirectInfoProps) {
    const { id } = useDirectMessageId();
    const Header = () => {
        return (
            <VStack
                w={"full"}
                gap={0}
                align={"start"}
            >
                <Heading
                    fontSize={"lg"}
                    as={"h2"}
                    fontWeight={"medium"}
                    color={"fg"}
                >
                    Info
                </Heading>
            </VStack>
        )
    }
    return (
        <VStack
            w={"full"}
            h={"full"}
            {...props}
        >
            {/* <Header /> */}

        </VStack>
    )
}