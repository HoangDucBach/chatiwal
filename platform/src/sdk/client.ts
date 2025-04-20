import { Address, ChatiwalClientConfig, ChatiwalPackageConfig, ObjectId } from "./types";
import { SuiClient } from "@mysten/sui/client";
import { MAINNET_CHATIWAL_PACKAGE_CONFIG, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "./constants";
import { ChatiwalClientError } from "./errors";
import { Transaction } from "@mysten/sui/transactions";

// Import init functions for both modules
import { init as initGroup } from "./contracts/group";
import { init as initMessage } from "./contracts/message"; // Import from message.ts

export class ChatiwalClient {
    protected packageConfig: ChatiwalPackageConfig;
    protected suiClient: SuiClient; // Use SuiClient directly if experimental ClientWithExtensions is not needed
    protected groupModule: ReturnType<typeof initGroup>;
    protected messageModule: ReturnType<typeof initMessage>; // Add message module instance

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
            // Add null check for config.packageConfig
            if (!config.packageConfig) {
                throw new ChatiwalClientError("Package config must be provided if network is not specified");
            }
            this.packageConfig = config.packageConfig;
        }

        this.suiClient = config.suiClient;
        // Initialize both modules
        this.groupModule = initGroup(this.packageConfig.chatiwalId);
        this.messageModule = initMessage(this.packageConfig.chatiwalId); // Initialize message module
    }

    getPackageConfig() {
        return this.packageConfig;
    }

    getSuiClient() {
        return this.suiClient;
    }

    // --- Group Module Methods ---

    /**
     * Creates a transaction block to mint a new group.
     */
    async mintGroupAndTransfer({ metadataBlobId }: { metadataBlobId: string }) {
        const tx = new Transaction();
        this.groupModule.mint_group_and_transfer({ arguments: [metadataBlobId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to add a member to a group.
     */
    async addMember({ groupCapId, groupId, member }: {
        groupCapId: ObjectId;
        groupId: ObjectId;
        member: Address;
    }) {
        const tx = new Transaction();
        this.groupModule.add_member({ arguments: [groupCapId, groupId, member] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a group capability object.
     * Note: Review if this function truly exists/is needed based on Move code.
     */
    async mintGroupCap({ groupCapId, groupId, recipient }: {
        groupCapId: ObjectId;
        groupId: ObjectId;
        recipient: Address;
    }) {
        const tx = new Transaction();
        // The arguments here depend on the actual Move function signature for minting a cap
        // Adjust if necessary. The previous group.ts refactor assumed [group_id, recipient].
        this.groupModule.mint_group_cap({ arguments: [groupCapId, groupId, recipient] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to remove a member from a group.
     */
    async removeMember({ groupCapId, groupId, member }: {
        groupCapId: ObjectId;
        groupId: ObjectId;
        member: Address;
    }) {
        const tx = new Transaction();
        this.groupModule.remove_member({ arguments: [groupCapId, groupId, member] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block for a group member to approve a seal.
     */
    async sealApprove({ id, groupId }: {
        id: Uint8Array;
        groupId: ObjectId;
    }) {
        const tx = new Transaction();
        this.groupModule.seal_approve({ arguments: [id, groupId] })(tx);
        return tx;
    }

    // --- Group View Methods (as transaction calls) ---

    async groupGetGroupId(groupId: ObjectId) {
        const tx = new Transaction();
        this.groupModule.group_get_group_id({ arguments: [groupId] })(tx);
        return tx;
    }

    async groupGetGroupMember(groupId: ObjectId) {
        const tx = new Transaction();
        this.groupModule.group_get_group_member({ arguments: [groupId] })(tx);
        return tx;
    }

    async groupGetGroupMetadataBlobId(groupId: ObjectId) {
        const tx = new Transaction();
        this.groupModule.group_get_group_metadata_blob_id({ arguments: [groupId] })(tx);
        return tx;
    }

    async groupCapGetGroupId(groupCapId: ObjectId) {
        const tx = new Transaction();
        this.groupModule.group_cap_get_group_id({ arguments: [groupCapId] })(tx);
        return tx;
    }

    async groupCapGetId(groupCapId: ObjectId) {
        const tx = new Transaction();
        this.groupModule.group_cap_get_id({ arguments: [groupCapId] })(tx);
        return tx;
    }

    async isMember({ groupId, address }: {
        groupId: ObjectId;
        address: Address;
    }) {
        const tx = new Transaction();
        this.groupModule.is_member({ arguments: [groupId, address] })(tx);
        return tx;
    }

    async getNamespace(groupId: ObjectId) {
        const tx = new Transaction();
        this.groupModule.namespace({ arguments: [groupId] })(tx);
        return tx;
    }


    // --- Message Module Methods ---

    /**
     * Creates a transaction block to mint a MessagesSnapshot.
     */
    async mintMessagesSnapshotAndTransfer({ g_id, mt_b_id }: { g_id: ObjectId; mt_b_id: string }) {
        const tx = new Transaction();
        this.messageModule.mint_messages_snapshot_and_transfer({ arguments: [g_id, mt_b_id] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a MessagesSnapshotCap.
     */
    async mintMessagesSnapshotCapAndTransfer({ msg_snapshot_id }: { msg_snapshot_id: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.mint_messages_snapshot_cap_and_transfer({ arguments: [msg_snapshot_id] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with no policy.
     */
    async mintSuperMessageNoPolicyAndTransfer({ g_id, mt_b_id }: { g_id: ObjectId; mt_b_id: string }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_no_policy_and_transfer({ arguments: [g_id, mt_b_id] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with TimeLock policy.
     */
    async mintSuperMessageTimeLockAndTransfer({ g_id, mt_b_id, from, to }: {
        g_id: ObjectId;
        mt_b_id: string;
        from: bigint | number;
        to: bigint | number;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_time_lock_and_transfer({ arguments: [g_id, mt_b_id, from, to] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with LimitedRead policy.
     */
    async mintSuperMessageLimitedReadAndTransfer({ g_id, mt_b_id, max }: {
        g_id: ObjectId;
        mt_b_id: string;
        max: bigint | number;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_limited_read_and_transfer({ arguments: [g_id, mt_b_id, max] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with FeeBased policy.
     */
    async mintSuperMessageFeeBasedAndTransfer({ g_id, mt_b_id, fee, recipient, coinType }: {
        g_id: ObjectId;
        mt_b_id: string;
        fee: bigint | number;
        recipient: Address; // Changed param name from 'r' to 'recipient' for clarity
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_fee_based_and_transfer({
            arguments: [g_id, mt_b_id, fee, recipient],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with Compound policy.
     */
    async mintSuperMessageCompoundAndTransfer({ g_id, mt_b_id, tf, tt, max, fee, recipient, coinType }: {
        g_id: ObjectId;
        mt_b_id: string;
        tf: bigint | number;
        tt: bigint | number;
        max: bigint | number;
        fee: bigint | number;
        recipient: Address;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_compound_and_transfer({
            arguments: [g_id, mt_b_id, tf, tt, max, fee, recipient],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageNoPolicy.
     */
    async readMessageNoPolicy({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.read_message_no_policy({ arguments: [msgId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageTimeLock.
     */
    async readMessageTimeLock({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.read_message_time_lock({ arguments: [msgId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageLimitedRead.
     */
    async readMessageLimitedRead({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.read_message_limited_read({ arguments: [msgId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageFeeBased.
     */
    async readMessageFeeBased({ msgId, paymentCoinId, coinType }: {
        msgId: ObjectId;
        paymentCoinId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.read_message_fee_based({
            arguments: [msgId, paymentCoinId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageCompound.
     */
    async readMessageCompound({ msgId, paymentCoinId, coinType }: {
        msgId: ObjectId;
        paymentCoinId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.read_message_compound({
            arguments: [msgId, paymentCoinId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to withdraw fees from a SuperMessageFeeBased.
     */
    async withdrawFees({ msgId, coinType }: {
        msgId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.withdraw_fees({
            arguments: [msgId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to withdraw fees from a SuperMessageCompound.
     */
    async withdrawFeesCompound({ msgId, coinType }: {
        msgId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.withdraw_fees_compound({
            arguments: [msgId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
    * Creates a transaction block to approve a seal for SuperMessageTimeLock.
    */
    async sealApproveSuperMessageTimeLock({ id, msgId, groupId }: {
        id: Uint8Array;
        msgId: ObjectId;
        groupId: ObjectId;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_time_lock({ arguments: [id, msgId, groupId] })(tx);
        return tx;
    }

    /**
    * Creates a transaction block to approve a seal for SuperMessageLimitedRead.
    */
    async sealApproveSuperMessageLimitedRead({ id, msgId, groupId }: {
        id: Uint8Array;
        msgId: ObjectId;
        groupId: ObjectId;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_limited_read({ arguments: [id, msgId, groupId] })(tx);
        return tx;
    }

    /**
    * Creates a transaction block to approve a seal for SuperMessageFeeBased.
    */
    async sealApproveSuperMessageFeeBased({ id, msgId, groupId, coinType }: {
        id: Uint8Array;
        msgId: ObjectId;
        groupId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_fee_based({
            arguments: [id, msgId, groupId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to approve a seal for SuperMessageCompound.
     */
    async sealApproveSuperMessageCompound({ id, msgId, groupId, coinType }: {
        id: Uint8Array;
        msgId: ObjectId;
        groupId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_compound({
            arguments: [id, msgId, groupId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    // --- Message View/Accessor Methods (as transaction calls) ---
    // These build transactions. For pure reads outside a TX, use suiClient.getObject.

    async getCurrentReader({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.get_current_reader({ arguments: [msgId] })(tx);
        return tx;
    }

    async getCollectedFees({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.get_collected_fees({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }

    async getCollectedFeesCompound({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.get_collected_fees_compound({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }

    async getRemainingReads({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.get_remaining_reads({ arguments: [msgId] })(tx);
        return tx;
    }

    async isReadableByTime({ msgId, timestamp }: { msgId: ObjectId, timestamp: bigint | number }) {
        const tx = new Transaction();
        this.messageModule.is_readable_by_time({ arguments: [msgId, timestamp] })(tx);
        return tx;
    }

    async messageCapGetId({ capId }: { capId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_cap_get_id({ arguments: [capId] })(tx);
        return tx;
    }

    async messageCapGetMessageId({ capId }: { capId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_cap_get_message_id({ arguments: [capId] })(tx);
        return tx;
    }

    // ... Add wrappers for all other accessor functions from message.ts ...
    // (Following the same pattern: create method, init Transaction, call module function, return tx)

    async messageSnapshotCapGetId({ capId }: { capId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_snapshot_cap_get_id({ arguments: [capId] })(tx);
        return tx;
    }

    async messageSnapshotCapGetMessagesSnapshotId({ capId }: { capId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_snapshot_cap_get_messages_snapshot_id({ arguments: [capId] })(tx);
        return tx;
    }

    async messageSnapshotGetId({ snapshotId }: { snapshotId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_snapshot_get_id({ arguments: [snapshotId] })(tx);
        return tx;
    }

    async messageSnapshotGetGroupId({ snapshotId }: { snapshotId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_snapshot_get_group_id({ arguments: [snapshotId] })(tx);
        return tx;
    }

    async messageSnapshotGetMessagesBlobId({ snapshotId }: { snapshotId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_snapshot_get_messages_blob_id({ arguments: [snapshotId] })(tx);
        return tx;
    }

    // Add wrappers for message_no_policy_get_*
    async messageNoPolicyGetId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageNoPolicyGetGroupId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_group_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageNoPolicyGetMessageBlobId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_message_blob_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageNoPolicyGetOwner({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_owner({ arguments: [msgId] })(tx);
        return tx;
    }

    // Add wrappers for message_limit_read_get_*
    async messageLimitReadGetId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageLimitReadGetGroupId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_group_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageLimitReadGetMessageBlobId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_message_blob_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageLimitReadGetPolicy({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_policy({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageLimitReadGetOwner({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_owner({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageLimitReadGetReaders({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_readers({ arguments: [msgId] })(tx);
        return tx;
    }

    // Add wrappers for message_time_lock_get_*
    async messageTimeLockGetId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageTimeLockGetGroupId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_group_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageTimeLockGetMessageBlobId({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_message_blob_id({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageTimeLockGetPolicy({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_policy({ arguments: [msgId] })(tx);
        return tx;
    }
    async messageTimeLockGetOwner({ msgId }: { msgId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_owner({ arguments: [msgId] })(tx);
        return tx;
    }

    // Add wrappers for message_fee_based_get_*
    async messageFeeBasedGetId({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_id({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetGroupId({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_group_id({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetMessageBlobId({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_message_blob_id({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetPolicy({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_policy({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetOwner({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_owner({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetReaders({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_readers({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetFeeCollected({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_fee_collected({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }

    // Add wrappers for message_compound_get_*
    async messageCompoundGetId({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_id({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetGroupId({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_group_id({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetMessageBlobId({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_message_blob_id({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetTimeLock({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_time_lock({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetLimitedRead({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_limited_read({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetFeePolicy({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_fee_policy({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetOwner({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_owner({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetFeeCollected({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_fee_collected({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetReaders({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_readers({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetRemainingReads({ msgId, coinType }: { msgId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_remaining_reads({ arguments: [msgId], typeArgs: [coinType] })(tx);
        return tx;
    }
}