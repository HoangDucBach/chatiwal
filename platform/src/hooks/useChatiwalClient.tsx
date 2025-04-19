"use client";

import { useMemo } from "react";
import { ChatiwalClient, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "@/sdk";
import { ChatiwalClientConfig } from "@/sdk/types";
import { useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export interface IGroupActions {
    // === Entry functions ===
    mint_group_and_transfer(metadata_blob_id: string): void;

    mint_group_cap(
        group: string,     // object ID or reference
        recipient: string,  // Sui address
        group_cap?: string, // object ID or reference, user provider or hooks auto provide
    ): void;

    add_member(
        group: string,     // object ID or reference
        member: string,   // Sui address
        group_cap?: string, // object ID or reference, user provider or hooks auto provide
    ): void;

    remove_member(
        group: string,     // object ID or reference
        member: string,    // Sui address
        group_cap?: string, // object ID or reference, user provider or hooks auto provide
    ): void;

    seal_approve(
        id: Uint8Array,    // vector<u8>
        group: string      // object ID or reference
    ): void;

    // === Public view functions ===
    namespace(group: string): Uint8Array;

    group_get_group_id(group: string): string;

    group_get_group_member(group: string): string[]; // list of Sui addresses

    group_get_group_metadata_blob_id(group: string): string;

    group_cap_get_group_id(group_cap: string): string;

    group_cap_get_id(group_cap: string): string;

    is_member(group: string, addr: string): boolean;
}
interface IMessageActions {
}
interface IChatiwalClientActions extends IGroupActions, IMessageActions {
    client: ChatiwalClient;
}
export function useChatiwalClient(): IChatiwalClientActions {
    const suiClient = useSuiClient();
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

    return {
        client,
        mint_group_and_transfer: async (metadata_blob_id: string) => {
            
        },

        mint_group_cap: async (group: string, recipient: string, group_cap?: string) => {
            const tx = new Transaction();
            await client.group.mintGroupCap(tx, group, recipient, group_cap);
            await tx.execute();
        },

        add_member: async (group: string, member: string, group_cap?: string) => {
            const tx = new Transaction();
            await client.group.addMember(tx, group, member, group_cap);
            await tx.execute();
        },

        remove_member: async (group: string, member: string, group_cap?: string) => {
            const tx = new Transaction();
            await client.group.removeMember(tx, group, member, group_cap);
            await tx.execute();
        },

        seal_approve: async (id: Uint8Array, group: string) => {
            const tx = new Transaction();
            await client.group.sealApprove(tx, id, group);
            await tx.execute();
        },

        namespace: (group: string) => {
            return client.group.namespace(group);
        },

        group_get_group_id: (group: string) => {
            return client.group.getGroupId(group);
        },

        group_get_group_member: (group: string) => {
            return client.group.getGroupMember(group);
        },

        group_get_group_metadata_blob_id: (group: string) => {
            return client.group.getGroupMetadataBlobId(group);
        },

        group_cap_get_group_id: (group_cap: string) => {
            return client.group.getGroupCapGroupId(group_cap);
        },

        group_cap_get_id: (group_cap: string) => {
            return client.group.getGroupCapId(group_cap);
        },

        is_member: (group: string, addr: string) => {
            return client.group.isMember(group, addr);
        }

    };
}