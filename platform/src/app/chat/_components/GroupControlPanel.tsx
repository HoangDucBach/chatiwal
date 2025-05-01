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