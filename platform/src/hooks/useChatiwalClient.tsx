"use client";

import { useMemo } from "react";
import { ChatiwalClient, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "@/sdk";
import { ChatiwalClientConfig, GroupCap } from "@/sdk/types";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { InvalidGroupCapError } from "@/sdk/errors";

export interface IGroupActions {
    // === Entry functions ===
    mint_group_and_transfer(metadata_blob_id: string): Promise<void>;

    mint_group_cap(
        group: string,     // object ID or reference
        recipient: string,  // Sui address
        group_cap?: string, // object ID or reference, user provider or hooks auto provide
    ): Promise<void>;

    add_member(
        group: string,     // object ID or reference
        member: string,   // Sui address
        group_cap?: string, // object ID or reference, user provider or hooks auto provide
    ): Promise<void>;

    remove_member(
        group: string,     // object ID or reference
        member: string,    // Sui address
        group_cap?: string, // object ID or reference, user provider or hooks auto provide
    ): Promise<void>;

    seal_approve(
        id: Uint8Array,    // vector<u8>
        group: string      // object ID or reference
    ): Promise<void>;

    // === Public view functions ===
    group_get_group_id(group: string): Promise<Uint8Array>;

    group_get_group_member(group: string): Promise<number[]>; // list of Sui addresses

    group_get_group_metadata_blob_id(group: string): Promise<string>;

    group_cap_get_group_id(group_cap: string): Promise<Uint8Array>;

    group_cap_get_id(group_cap: string): Promise<string>;

    is_member(group: string, addr: string): boolean;
}
interface IMessageActions {
}
interface IChatiwalClientActions extends IGroupActions, IMessageActions {
    client: ChatiwalClient;
}
export function useChatiwalClient(): IChatiwalClientActions {
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    const client = useMemo(() => {
        const config = {
            packageConfig: TESTNET_CHATIWAL_PACKAGE_CONFIG,
            suiClient: suiClient,
        } satisfies ChatiwalClientConfig;
        return new ChatiwalClient(config);
    }, []);

    if (!suiClient) {
        throw new Error("Sui client is not available");
    }

    const getOwnedGroupCapById = async (group: string) => {
        if (!account) throw new Error("Please connect your wallet");
        const groupCapsOfOwner = await suiClient.getOwnedObjects({
            owner: account.address,
            filter: {
                StructType: `${client.getPackageConfig().chatiwalId}::group::GroupCap`,
            },
            options: {
                showContent: true,
            }
        });
        const groupCap = groupCapsOfOwner.data.find((cap) => {
            const type = cap.data?.content?.dataType;
            if (type !== "moveObject") throw new Error("Invalid type");
            const object = cap.data?.content?.fields as unknown as GroupCap;
            return object.groupId === group;
        });

        return groupCap;
    }

    return {
        client,
        mint_group_and_transfer: async (metadata_blob_id: string) => {
            await client.mintGroupAndTransfer({ metadataBlobId: metadata_blob_id });
        },

        mint_group_cap: async (group: string, recipient: string, group_cap?: string) => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const groupCapOfOwner = await getOwnedGroupCapById(group);
                if (!groupCapOfOwner || !groupCapOfOwner.data) throw new InvalidGroupCapError("You don't have permission");

                await client.mintGroupCap({
                    groupCapId: groupCapOfOwner.data?.objectId,
                    groupId: group,
                    recipient: recipient,
                });
            } catch (error) {
                throw error;
            }
        },

        add_member: async (group: string, member: string, group_cap?: string) => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const groupCapOfOwner = await getOwnedGroupCapById(group);
                if (!groupCapOfOwner || !groupCapOfOwner.data) throw new InvalidGroupCapError("You don't have permission");

                await client.addMember({
                    groupCapId: groupCapOfOwner.data?.objectId,
                    groupId: group,
                    member: member,
                });
            } catch (error) {
                throw error;
            }
        },

        remove_member: async (group: string, member: string, group_cap?: string) => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const groupCapOfOwner = await getOwnedGroupCapById(group);
                if (!groupCapOfOwner || !groupCapOfOwner.data) throw new InvalidGroupCapError("You don't have permission");

                await client.removeMember({
                    groupCapId: groupCapOfOwner.data?.objectId,
                    groupId: group,
                    member: member,
                });
            } catch (error) {
                throw error;
            }
        },

        seal_approve: async (id: Uint8Array, group: string) => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const tx = await client.sealApprove({
                    id: id,
                    groupId: group,
                });
                const res = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account?.address,
                });
            } catch (error) {
                throw error;
            }
        },

        group_get_group_id: async (group: string): Promise<Uint8Array> => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const tx = await client.groupGetGroupId(group);
                const res = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account?.address,
                });

                if (!res || !res.results) {
                    throw new Error("No results found");
                }

                const groupId = res.results[0];

                return new Uint8Array(groupId.returnValues![0][0]);
            } catch (error) {
                throw error;
            }
        },

        group_get_group_member: async (group: string): Promise<number[]> => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const tx = await client.groupGetGroupMember(group);
                const res = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account?.address,
                });

                if (!res || !res.results) {
                    throw new Error("No results found");
                }

                const groupMembers = res.results[0];
                console.log("Group members:", res);

                return groupMembers.returnValues![0][0];
            } catch (error) {
                throw error;
            }
        },

        group_get_group_metadata_blob_id: async (group: string): Promise<Uint8Array> => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const tx = await client.groupGetGroupMetadataBlobId(group);
                const res = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account?.address,
                });
                if (!res || !res.results) {
                    throw new Error("No results found");
                }
                return new Uint8Array(res.results[0].returnValues![0][0]);
            } catch (error) {
                throw error;
            }
        },

        group_cap_get_group_id: async (group_cap: string): Promise<Uint8Array> => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const tx = await client.groupCapGetGroupId(group_cap);
                const res = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account?.address,
                });
                if (!res || !res.results) {
                    throw new Error("No results found");
                }
                return new Uint8Array(res.results[0].returnValues![0][0]);
            } catch (error) {
                throw error;
            }
        },

        group_cap_get_id: async (group_cap: string): Promise<Uint8Array> => {
            try {
                if (!account) throw new Error("Please connect your wallet");
                const tx = await client.groupCapGetId(group_cap);
                const res = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: account?.address,
                });
                if (!res || !res.results) {
                    throw new Error("No results found");
                }
                return new Uint8Array(res.results[0].returnValues![0][0]);
            } catch (error) {
                throw error;
            }
        },

        is_member: async (group: string, addr: string): Promise<boolean> => {
            if (!account) throw new Error("Please connect your wallet");
            const tx = await client.isMember({
                groupId: group,
                address: addr,
            });
            const res = await suiClient.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: account?.address,
            });
            if (!res || !res.results) {
                throw new Error("No results found");
            }
            return res.results[0].returnValues![0][0] as unknown as boolean;
        }

    } as any;
}