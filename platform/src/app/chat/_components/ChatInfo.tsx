"use client"
import { StackProps, VStack, Heading, Center, CenterProps } from "@chakra-ui/react";
import { useGroup } from "../_hooks/useGroup";
import { formatAddress } from "@mysten/sui/utils";
import { useDirectMessageId } from "../_hooks/useDirectMessageId";

interface Props extends CenterProps {

}

export function ChatInfo({ ...props }: Props) {
    return (
        <Center
            h="full"
            {...props}
        >
            <GroupInfo />
        </Center>
    )
}

interface GroupInfoProps extends StackProps {
}
export function GroupInfo({ ...props }: GroupInfoProps) {
    const { group } = useGroup();

    return (
        <VStack
            w={"full"}
            p={"4"}
            {...props}
        >
            <VStack>
                <Heading
                    fontSize={"lg"}
                    fontWeight={"bold"}
                    color={"fg.900"}
                >
                    {group?.metadata?.name || formatAddress(group.id)}
                </Heading>
            </VStack>

        </VStack>
    )
}

interface DirectInfoProps extends StackProps {

}
export function DirectInfo({ ...props }: DirectInfoProps) {
    const { id } = useDirectMessageId();
    return (
        <VStack
            w={"full"}
            p={"4"}
            {...props}
        >
            <VStack>
                <Heading
                    fontSize={"lg"}
                    fontWeight={"bold"}
                    color={"fg.900"}
                >
                </Heading>
            </VStack>

        </VStack>
    )
}