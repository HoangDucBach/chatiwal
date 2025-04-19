import { ClientCache, ClientWithExtensions } from "@mysten/sui/experimental";
import { ChatiwalClientConfig, ChatiwalPackageConfig } from "./types";
import { SuiClient } from "@mysten/sui/client";
import { MAINNET_CHATIWAL_PACKAGE_CONFIG, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "./constants";
import { ChatiwalClientError } from "./errors";

import { init as initGroup } from "./contracts/group";
import { Transaction } from "@mysten/sui/transactions";

export class ChatiwalClient {
    protected packageConfig: ChatiwalPackageConfig;
    protected suiClient: ClientWithExtensions<{
        jsonRpc: SuiClient;
    }>;
    protected groupModule: ReturnType<typeof initGroup>;

    constructor(config: ChatiwalClientConfig) {
        if (config.network && !config.packageConfig) {
            const network = config.network;
            switch (network) {
                case 'testnet':
                    this.packageConfig = TESTNET_CHATIWAL_PACKAGE_CONFIG;
                    break;
                case 'mainnet':
                    this.packageConfig = MAINNET_CHATIWAL_PACKAGE_CONFIG;
                    break;
                default:
                    throw new ChatiwalClientError(`Unsupported network: ${network}`);
            }
        } else {
            this.packageConfig = config.packageConfig!;
        }

        this.suiClient = config.suiClient;
        this.groupModule = initGroup(this.packageConfig.chatiwalId);
    }

    getPackageConfig() {
        return this.packageConfig;
    }

    getSuiClient() {
        return this.suiClient;
    }

    getNetwork() {
        return this.suiClient.network;
    }

    // Mint and transfer group
    async mintGroupAndTransfer({ metadataBlobId }: { metadataBlobId: string }) {
        const tx = new Transaction();
        this.groupModule.mint_group_and_transfer({ arguments: [metadataBlobId] })(tx);
        return tx;
    }

    // Add member
    async addMember({ groupCapId, groupId, member }: {
        groupCapId: string;
        groupId: string;
        member: string;
    }) {
        const tx = new Transaction();
        this.groupModule.add_member({ arguments: [groupCapId, groupId, member] })(tx);
        return tx;
    }

    // Mint group cap
    async mintGroupCap({ groupCapId, groupId, recipient }: {
        groupCapId: string;
        groupId: string;
        recipient: string;
    }) {
        const tx = new Transaction();
        this.groupModule.mint_group_cap({ arguments: [groupCapId, groupId, recipient] })(tx);
        return tx;
    }

    // Remove member
    async removeMember({ groupCapId, groupId, member }: {
        groupCapId: string;
        groupId: string;
        member: string;
    }) {
        const tx = new Transaction();
        this.groupModule.remove_member({ arguments: [groupCapId, groupId, member] })(tx);
        return tx;
    }

    // Seal approve
    async sealApprove({ id, groupId }: {
        id: Uint8Array;
        groupId: string;
    }) {
        const tx = new Transaction();
        this.groupModule.seal_approve({ arguments: [id, groupId] })(tx);
        return tx;
    }

    // Get group id
    async groupGetGroupId(groupId: string) {
        const tx = new Transaction();
        this.groupModule.group_get_group_id({ arguments: [groupId] })(tx);
        return tx;
    }

    // Get group member list
    async groupGetGroupMember(groupId: string) {
        const tx = new Transaction();
        this.groupModule.group_get_group_member({ arguments: [groupId] })(tx);
        return tx;
    }

    // Get group metadata blob id
    async groupGetGroupMetadataBlobId(groupId: string) {
        const tx = new Transaction();
        this.groupModule.group_get_group_metadata_blob_id({ arguments: [groupId] })(tx);
        return tx;
    }

    // Get group id from cap
    async groupCapGetGroupId(groupCapId: string) {
        const tx = new Transaction();
        this.groupModule.group_cap_get_group_id({ arguments: [groupCapId] })(tx);
        return tx;
    }

    // Get cap id
    async groupCapGetId(groupCapId: string) {
        const tx = new Transaction();
        this.groupModule.group_cap_get_id({ arguments: [groupCapId] })(tx);
        return tx;
    }

    // Check is member
    async isMember({ groupId, address }: {
        groupId: string;
        address: string;
    }) {
        const tx = new Transaction();
        this.groupModule.is_member({ arguments: [groupId, address] })(tx);
        return tx;
    }

    // Get namespace
    async getNamespace(groupId: string) {
        const tx = new Transaction();
        this.groupModule.namespace({ arguments: [groupId] })(tx);
        return tx;
    }
}