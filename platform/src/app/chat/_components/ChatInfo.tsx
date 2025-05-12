import { StackProps, VStack } from "@chakra-ui/react";
import { useGroup } from "../_hooks/useGroup";
import { formatAddress } from "@mysten/sui/utils";

interface Props extends StackProps {

}

export function ChatInfo({ ...props }: Props) {
    return (
        <></>
    )
}

interface GroupInfoProps extends StackProps {
}
export function GroupInfo({ ...props }: GroupInfoProps) {
    const { group } = useGroup();

    return (
        <VStack
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