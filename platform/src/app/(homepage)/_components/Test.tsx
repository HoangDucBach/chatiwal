"use client";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { fromHex } from "@mysten/sui/utils";

export function Test() {
    const client = useChatiwalClient();
    const suiClient = useSuiClient();
    const account = useCurrentAccount();
    const {mutate: sign} = useSignAndExecuteTransaction();
    const handleClick = async () => {
        if (!account) {
            console.error("No account found");
            return;
        }
        try {
            const groupCaps = await suiClient.getOwnedObjects({
                owner: account?.address,
                filter: {
                    StructType: `${client.client.getPackageConfig().chatiwalId}::group::GroupCap`,
                },
                options: {
                    showContent: true
                }
            });
            const groupId = "0xdc78ccceb13d754d2989b89b2190497ed6344d22a4304714face0880fb7ddfff";
            const groupCap = groupCaps.data.find((cap) => {
                const type = cap.data?.content?.dataType
                if(type!== "moveObject") return false;
                const object = cap.data?.content?.fields as any;
                return object.group_id === groupId;
            });

            const tx= await client.seal_approve(fromHex(client.client.getPackageConfig().chatiwalId), groupId);
            console.log("Group ID:", groupCaps);
            console.log("Test successful");
        }
        catch (error) {
            console.error("Test failed", error);
        }
    };

    return (
        <div>
            <button onClick={handleClick}>
                Test Chatiwal Client
            </button>
        </div>
    );
}