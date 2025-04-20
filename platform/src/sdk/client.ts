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
    async mintMessagesSnapshotAndTransfer({ groupId, metadataBlobId }: { groupId: ObjectId; metadataBlobId: string }) {
        const tx = new Transaction();
        this.messageModule.mint_messages_snapshot_and_transfer({ arguments: [groupId, metadataBlobId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a MessagesSnapshotCap.
     */
    async mintMessagesSnapshotCapAndTransfer({ msgsSnapshotId }: { msgsSnapshotId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.mint_messages_snapshot_cap_and_transfer({ arguments: [msgsSnapshotId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with no policy.
     */
    async mintSuperMessageNoPolicyAndTransfer({ groupId, metadataBlobId }: { groupId: ObjectId; metadataBlobId: string }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_no_policy_and_transfer({ arguments: [groupId, metadataBlobId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with TimeLock policy.
     */
    async mintSuperMessageTimeLockAndTransfer({ groupId, metadataBlobId, from, to }: {
        groupId: ObjectId;
        metadataBlobId: string;
        from: bigint | number;
        to: bigint | number;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_time_lock_and_transfer({ arguments: [groupId, metadataBlobId, from, to] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with LimitedRead policy.
     */
    async mintSuperMessageLimitedReadAndTransfer({ groupId, metadataBlobId, max }: {
        groupId: ObjectId;
        metadataBlobId: string;
        max: bigint | number;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_limited_read_and_transfer({ arguments: [groupId, metadataBlobId, max] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with FeeBased policy.
     */
    async mintSuperMessageFeeBasedAndTransfer({ groupId, metadataBlobId, fee, recipient, coinType }: {
        groupId: ObjectId;
        metadataBlobId: string;
        fee: bigint | number;
        recipient: Address; // Changed param name from 'r' to 'recipient' for clarity
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_fee_based_and_transfer({
            arguments: [groupId, metadataBlobId, fee, recipient],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to mint a SuperMessage with Compound policy.
     */
    async mintSuperMessageCompoundAndTransfer({ groupId, metadataBlobId, timeFrom, timeTo, max, fee, recipient, coinType }: {
        groupId: ObjectId;
        metadataBlobId: string;
        timeFrom: bigint | number;
        timeTo: bigint | number;
        max: bigint | number;
        fee: bigint | number;
        recipient: Address;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.mint_super_message_compound_and_transfer({
            arguments: [groupId, metadataBlobId, timeFrom, timeTo, max, fee, recipient],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageNoPolicy.
     */
    async readMessageNoPolicy({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.read_message_no_policy({ arguments: [messageId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageTimeLock.
     */
    async readMessageTimeLock({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.read_message_time_lock({ arguments: [messageId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageLimitedRead.
     */
    async readMessageLimitedRead({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.read_message_limited_read({ arguments: [messageId] })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageFeeBased.
     */
    async readMessageFeeBased({ messageId, paymentCoinId, coinType }: {
        messageId: ObjectId;
        paymentCoinId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.read_message_fee_based({
            arguments: [messageId, paymentCoinId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to read a SuperMessageCompound.
     */
    async readMessageCompound({ messageId, paymentCoinId, coinType }: {
        messageId: ObjectId;
        paymentCoinId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.read_message_compound({
            arguments: [messageId, paymentCoinId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to withdraw fees from a SuperMessageFeeBased.
     */
    async withdrawFees({ messageId, coinType }: {
        messageId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.withdraw_fees({
            arguments: [messageId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to withdraw fees from a SuperMessageCompound.
     */
    async withdrawFeesCompound({ messageId, coinType }: {
        messageId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.withdraw_fees_compound({
            arguments: [messageId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
    * Creates a transaction block to approve a seal for SuperMessageTimeLock.
    */
    async sealApproveSuperMessageTimeLock({ id, messageId, groupId }: {
        id: Uint8Array;
        messageId: ObjectId;
        groupId: ObjectId;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_time_lock({ arguments: [id, messageId, groupId] })(tx);
        return tx;
    }

    /**
    * Creates a transaction block to approve a seal for SuperMessageLimitedRead.
    */
    async sealApproveSuperMessageLimitedRead({ id, messageId, groupId }: {
        id: Uint8Array;
        messageId: ObjectId;
        groupId: ObjectId;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_limited_read({ arguments: [id, messageId, groupId] })(tx);
        return tx;
    }

    /**
    * Creates a transaction block to approve a seal for SuperMessageFeeBased.
    */
    async sealApproveSuperMessageFeeBased({ id, messageId, groupId, coinType }: {
        id: Uint8Array;
        messageId: ObjectId;
        groupId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_fee_based({
            arguments: [id, messageId, groupId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    /**
     * Creates a transaction block to approve a seal for SuperMessageCompound.
     */
    async sealApproveSuperMessageCompound({ id, messageId, groupId, coinType }: {
        id: Uint8Array;
        messageId: ObjectId;
        groupId: ObjectId;
        coinType: string;
    }) {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message_compound({
            arguments: [id, messageId, groupId],
            typeArgs: [coinType]
        })(tx);
        return tx;
    }

    // --- Message View/Accessor Methods (as transaction calls) ---
    // These build transactions. For pure reads outside a TX, use suiClient.getObject.

    async getCurrentReader({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.get_current_reader({ arguments: [messageId] })(tx);
        return tx;
    }

    async getCollectedFees({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.get_collected_fees({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }

    async getCollectedFeesCompound({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.get_collected_fees_compound({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }

    async getRemainingReads({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.get_remaining_reads({ arguments: [messageId] })(tx);
        return tx;
    }

    async isReadableByTime({ messageId, timestamp }: { messageId: ObjectId, timestamp: bigint | number }) {
        const tx = new Transaction();
        this.messageModule.is_readable_by_time({ arguments: [messageId, timestamp] })(tx);
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
    async messageNoPolicyGetId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageNoPolicyGetGroupId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_group_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageNoPolicyGetMessageBlobId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_message_blob_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageNoPolicyGetOwner({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_no_policy_get_owner({ arguments: [messageId] })(tx);
        return tx;
    }

    // Add wrappers for message_limit_read_get_*
    async messageLimitReadGetId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageLimitReadGetGroupId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_group_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageLimitReadGetMessageBlobId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_message_blob_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageLimitReadGetPolicy({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_policy({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageLimitReadGetOwner({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_owner({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageLimitReadGetReaders({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_limit_read_get_readers({ arguments: [messageId] })(tx);
        return tx;
    }

    // Add wrappers for message_time_lock_get_*
    async messageTimeLockGetId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageTimeLockGetGroupId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_group_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageTimeLockGetMessageBlobId({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_message_blob_id({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageTimeLockGetPolicy({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_policy({ arguments: [messageId] })(tx);
        return tx;
    }
    async messageTimeLockGetOwner({ messageId }: { messageId: ObjectId }) {
        const tx = new Transaction();
        this.messageModule.message_time_lock_get_owner({ arguments: [messageId] })(tx);
        return tx;
    }

    // Add wrappers for message_fee_based_get_*
    async messageFeeBasedGetId({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_id({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetGroupId({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_group_id({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetMessageBlobId({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_message_blob_id({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetPolicy({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_policy({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetOwner({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_owner({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetReaders({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_readers({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageFeeBasedGetFeeCollected({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_fee_based_get_fee_collected({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }

    // Add wrappers for message_compound_get_*
    async messageCompoundGetId({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_id({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetGroupId({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_group_id({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetMessageBlobId({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_message_blob_id({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetTimeLock({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_time_lock({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetLimitedRead({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_limited_read({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetFeePolicy({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_fee_policy({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetOwner({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_owner({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetFeeCollected({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_fee_collected({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetReaders({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_readers({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
    async messageCompoundGetRemainingReads({ messageId, coinType }: { messageId: ObjectId, coinType: string }) {
        const tx = new Transaction();
        this.messageModule.message_compound_get_remaining_reads({ arguments: [messageId], typeArgs: [coinType] })(tx);
        return tx;
    }
}