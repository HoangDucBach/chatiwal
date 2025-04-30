"use client"

import { Heading, HStack, VStack, Text, TabsList, TabsTrigger, useTabs, TabsRootProvider, TabsContent, TabsRootProps, Icon } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { IoChatbubblesOutline } from "react-icons/io5";
import { LuInfo } from "react-icons/lu";

import { useGroup } from "../_hooks/useGroupId";
import { useChannel } from "ably/react";
import { MemberCard } from "./MemberCard";
import AddMember from "./AddMember";
import { TMessage } from "@/types";
import { MessageContainer } from "./MessageContainer";
import { GroupDetailsTab } from "./GroupDetailsTab";

interface Props extends TabsRootProps {
    chatTabProps: {
        messages: TMessage[]
    };
}
export function GroupControlPanel({ chatTabProps, ...props }: Props) {
    const items = [
        {
            id: "chat",
            icon: <IoChatbubblesOutline size={16} />,
            title: "Chat",
            content: <MessageContainer flex={"4"} messages={chatTabProps?.messages || []} />
        },
        {
            id: "member",
            icon: <IoChatbubblesOutline size={16} />,
            title: "Details",
            content: <GroupDetailsTab />
        },
    ]
    const tabs = useTabs({
        defaultValue: "chat",
        onValueChange: (value) => {
            console.log(value);
        },
    })
    return (
        <TabsRootProvider value={tabs} variant={"subtle"} w={"full"} h={"full"} >
            <TabsList
                w={"full"}
                pos={"relative"}
                zIndex={"0"}
                p={"3"}
                bg={"bg.100/75"}
                backdropFilter={"blur(256px)"}
                rounded={"3xl"}
                gap={"6"}
                defaultValue={items[0].id}
            >
                {items.map((item) => (
                    <TabsTrigger rounded={"2xl"} color={"fg.contrast"} _selected={{ bg: "bg.300", color: "fg" }} value={item.id} key={item.id}>
                        <Icon color={"fg.contrast"} _selected={{ color: "fg" }}>
                            {item.icon}
                        </Icon>
                        {item.title}
                    </TabsTrigger>
                ))}
            </TabsList>
            {
                items.map((item) => (
                    <TabsContent w={"full"} h={"90%"} value={item.id} key={item.id}>
                        {item.content}
                    </TabsContent>
                ))
            }
        </TabsRootProvider>
    )
}

function GroupControlPanelBody() {
    const { group } = useGroup();
    const { channel } = useChannel({ channelName: group.id });

    const { data: memberPresence = new Set<string>() } = useQuery({
        queryKey: ["group::members::presence"],
        queryFn: async () => {
            if (!channel) throw new Error("Channel not found");

            const members = await channel.presence.get();
            const memberPresence = new Set<string>();

            members.forEach((member) => {
                if (member.clientId) {
                    memberPresence.add(member.clientId);
                }
            });
            return memberPresence;
        },
        enabled: !!channel,
    })

    if (!group) return null;

    return (
        <VStack
            w={"full"}
            flex={"1 0"}
        >
            {[...group.members.values()].map((member) => (
                <MemberCard
                    key={member}
                    member={member}
                    group={group}
                    isOnline={memberPresence?.has(member)}
                />
            ))}
        </VStack>
    )
}
function GroupControlPanelHeader() {
    const { group } = useGroup();

    return (
        <HStack bg={"bg.200"} w={"full"} px={"4"} py={"2"} rounded={"2xl"}>
            <Heading as={"h6"} size={"lg"}>Member</Heading>
            <Text fontSize={"sm"} color={"fg.800"}>{group.members.size}</Text>
        </HStack>
    )
}

function GroupControlPanelFooter() {
    return (
        <VStack w={"full"} gap={"4"}>
            <AddMember w="full" shadow={"custom.md"} />
        </VStack>
    )
}