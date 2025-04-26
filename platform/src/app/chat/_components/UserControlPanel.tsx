"use client";
import { ChatiwalMascotIcon } from "@/components/global/icons";
import { ConnectButton } from "@/components/global/wallet";
import { formatBalance, generateColorFromAddress } from "@/libs";
import { HStack, Icon, Skeleton, StackProps, Text, VStack } from "@chakra-ui/react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { formatAddress, SUI_DECIMALS } from "@mysten/sui/utils";
import { useQuery } from "@tanstack/react-query";

interface Props extends StackProps { }
export function UserControlPanel(props: Props) {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    const { data: balances, isLoading } = useQuery({
        queryKey: ["user::control-panel"],
        queryFn: async () => {
            if (!currentAccount) return [];

            const suiBalance = await suiClient.getBalance({
                owner: currentAccount?.address,
            });

            const walBalance = await suiClient.getBalance({
                owner: currentAccount?.address,
                coinType: `0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL`,
            });

            const walTotalBalance = BigInt(walBalance.totalBalance);
            const suiTotalBalance = BigInt(suiBalance.totalBalance);

            return [
                {
                    label: "SUI",
                    value: formatBalance(suiTotalBalance, SUI_DECIMALS),
                },
                {
                    label: "WAL",
                    value: formatBalance(walTotalBalance, 9),
                }
            ]
        }
    })

    if (!currentAccount) return null;


    return (
        <HStack w={"full"} p={"2"} bg={"bg.50/75"} backdropBlur={"2xl"} shadow={"custom.sm"} rounded={"2xl"} cursor={"pointer"} {...props}>
            <Icon color={generateColorFromAddress(currentAccount?.address)}>
                <ChatiwalMascotIcon size={32} />
            </Icon>
            <VStack flex={"1 1"} align={"start"}>
                <Text fontSize={"sm"}>{formatAddress(currentAccount?.address)}</Text>
                <HStack>
                    {isLoading && <Skeleton w={"full"} h={"5"} rounded={"full"} />}
                    {balances?.map((balance) => (
                        <HStack key={balance.label} gap={"1"}>
                            <Text fontWeight={"medium"} fontSize={"xs"}>{balance.value}</Text>
                            <Text color={"fg.800"} fontSize={"xs"}>{balance.label}</Text>
                        </HStack>
                    ))}
                </HStack>
            </VStack>
            <ConnectButton size={"xs"} />
        </HStack>
    );
}