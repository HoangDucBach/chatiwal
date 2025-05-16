import { Heading, StackProps, VStack, Text, Link, HStack, TagRoot, TagLabel } from "@chakra-ui/react";
import { useGroup } from "../_hooks/useGroup";
import { formatAddress } from "@mysten/sui/utils";
import { SUI_EXPLORER_URL } from "@/utils/constants";
import { MemberCard } from "./MemberCard";
import { useChannel } from "ably/react";
import { useQuery } from "@tanstack/react-query";
import AddMember from "./AddMember";
import { AblyChannelManager } from "@/libs/ablyHelpers";

interface Props extends StackProps {

}
export function GroupInfo(props: Props) {
    const { group } = useGroup();

    if (!group) return null;

    return (
        <VStack w={"full"} p={"4"} gap={"6"} align={"start"} {...props}>
            <VStack align={"start"}>
                <Heading fontSize={"2xl"} as={"h2"} fontWeight={"bold"} color={"fg"}>
                    {group?.metadata ? group.metadata.name : formatAddress(group.id)}
                </Heading>
                <Link fontSize={"md"} fontWeight={"medium"} color={"secondary"} href={`${SUI_EXPLORER_URL}/object/${group.id}`} target="_blank" rel="noopener noreferrer">
                    {formatAddress(group.id)}
                </Link>
                {group.metadata?.tags && group.metadata.tags.length > 0 && (
                    <HStack
                        gap={"2"}
                        flexWrap={"wrap"}
                        justifyContent={"start"}
                    >
                        {group.metadata.tags.map((tag, index) => (
                            <TagRoot rounded={"md"} bg={"bg.500"} shadow={"custom.xs"} key={index}>
                                <TagLabel p={"1"}>
                                    {tag}
                                </TagLabel>
                            </TagRoot>
                        ))}
                    </HStack>
                )}
                <Text fontSize={"md"} color={"fg"} w={"full"}>
                    {group?.metadata?.description || "No description"}
                </Text>
            </VStack>
            <GroupMembers />
        </VStack>
    )
}

function GroupMembers() {
    const { group } = useGroup();
    const { channel } = useChannel({ channelName: AblyChannelManager.getChannel("GROUP_CHAT", group.id) });

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
            justify={"start"}
            w={"full"}
            flex={"1 0"}
        >
            <HStack justify={"space-between"} w={"full"}>
                <Heading as={"h6"} size={"lg"}>Members</Heading>
                <AddMember w="fit" shadow={"custom.md"} />
            </HStack>
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