import { Transaction } from '@mysten/sui/transactions';
import { Address, ChatiwalClientConfig, ChatiwalPackageConfig, ObjectId } from "./types";
import { SuiClient } from "@mysten/sui/client";
import { MAINNET_CHATIWAL_PACKAGE_CONFIG, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "./constants";
import { ChatiwalClientError } from "./errors";
import { initGroup } from "./contracts/group";
import { initMessage } from "./contracts/message";
import { SUI_TYPE_ARG } from '@mysten/sui/utils'; // Assuming SUI_TYPE_ARG = '0x2::sui::SUI'

export class ChatiwalClient {
    protected packageConfig: ChatiwalPackageConfig;
    protected suiClient: SuiClient;
    protected groupModule: ReturnType<typeof initGroup>;
    protected messageModule: ReturnType<typeof initMessage>;

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
            if (!config.packageConfig) {
                throw new ChatiwalClientError("Package config must be provided if network is not specified");
            }
            this.packageConfig = config.packageConfig;
        }

        this.suiClient = config.suiClient;
        this.groupModule = initGroup(this.packageConfig.chatiwalId, config); // Assuming initGroup takes config
        this.messageModule = initMessage(this.packageConfig.chatiwalId);
    }

    getPackageConfig(): ChatiwalPackageConfig {
        return this.packageConfig;
    }

    getSuiClient(): SuiClient {
        return this.suiClient;
    }

    // --- Group Module Methods ---

    mintGroupAndTransfer({ metadataBlobId }: { metadataBlobId: string }): Transaction {
        const tx = new Transaction();
        this.groupModule.mint_group_and_transfer({ arguments: [metadataBlobId] })(tx);
        return tx;
    }

    addMember({ groupCapId, groupId, member }: {
        groupCapId: ObjectId;
        groupId: ObjectId;
        member: Address;
    }): Transaction {
        const tx = new Transaction();
        this.groupModule.add_member({ arguments: [groupCapId, groupId, member] })(tx);
        return tx;
    }

    mintGroupCap({ groupCapId, groupId, recipient }: {
        groupCapId: ObjectId;
        groupId: ObjectId;
        recipient: Address;
    }): Transaction {
        const tx = new Transaction();
        this.groupModule.mint_group_cap({ arguments: [groupCapId, groupId, recipient] })(tx);
        return tx;
    }

    removeMember({ groupCapId, groupId, member }: {
        groupCapId: ObjectId;
        groupId: ObjectId;
        member: Address;
    }): Transaction {
        const tx = new Transaction();
        this.groupModule.remove_member({ arguments: [groupCapId, groupId, member] })(tx);
        return tx;
    }

    leaveGroup({ groupId, member }: {
        groupId: ObjectId;
        member: Address; // Assuming sender is the member
    }): Transaction {
        const tx = new Transaction();
        // Assuming leave_group takes member address implicitly via sender or needs it explicitly
        this.groupModule.leave_group({ arguments: [groupId, member] })(tx);
        return tx;
    }

    sealApprove({ id, groupId }: {
        id: Uint8Array;
        groupId: ObjectId;
    }): Transaction {
        const tx = new Transaction();
        this.groupModule.seal_approve({ arguments: [id, groupId] })(tx);
        return tx;
    }

    sealApproveForDirect({ id }: {
        id: Uint8Array;
        groupId: ObjectId;
    }): Transaction {
        const tx = new Transaction();
        this.groupModule.seal_approve_for_direct({ arguments: [id] })(tx);
        return tx;
    }
    // --- Group View Methods (as transaction calls) ---

    groupGetGroupId({ groupId }: { groupId: ObjectId }): Transaction {
        const tx = new Transaction();
        this.groupModule.group_get_group_id({ arguments: [groupId] })(tx);
        return tx;
    }

    groupGetGroupMember({ groupId }: { groupId: ObjectId }): Transaction {
        const tx = new Transaction();
        this.groupModule.group_get_group_member({ arguments: [groupId] })(tx);
        return tx;
    }

    groupGetGroupMetadataBlobId({ groupId }: { groupId: ObjectId }): Transaction {
        const tx = new Transaction();
        this.groupModule.group_get_group_metadata_blob_id({ arguments: [groupId] })(tx);
        return tx;
    }

    groupCapGetGroupId({ groupCapId }: { groupCapId: ObjectId }): Transaction {
        const tx = new Transaction();
        this.groupModule.group_cap_get_group_id({ arguments: [groupCapId] })(tx);
        return tx;
    }

    groupCapGetId({ groupCapId }: { groupCapId: ObjectId }): Transaction {
        const tx = new Transaction();
        this.groupModule.group_cap_get_id({ arguments: [groupCapId] })(tx);
        return tx;
    }

    isMember({ groupId, address }: {
        groupId: ObjectId;
        address: Address;
    }): Transaction {
        const tx = new Transaction();
        this.groupModule.is_member({ arguments: [groupId, address] })(tx);
        return tx;
    }

    getNamespace({ groupId }: { groupId: ObjectId }): Transaction {
        const tx = new Transaction();
        this.groupModule.namespace({ arguments: [groupId] })(tx);
        return tx;
    }

    // --- Message Module Methods ---

    mintMessagesSnapshotAndTransfer({ g_id, mt_b_id }: { g_id: ObjectId; mt_b_id: string }): Transaction {
        const tx = new Transaction();
        this.messageModule.mint_messages_snapshot_and_transfer({ arguments: [g_id, mt_b_id] })(tx);
        return tx;
    }

    mintMessagesSnapshotCapAndTransfer({ msg_snapshot_id }: { msg_snapshot_id: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.mint_messages_snapshot_cap_and_transfer({ arguments: [msg_snapshot_id] })(tx);
        return tx;
    }

    mintSuperMessageNoPolicyAndTransfer({ g_id, mt_b_id, aux_id }: { g_id: ObjectId; mt_b_id: string; aux_id: Uint8Array }): Transaction {
        const tx = new Transaction();
        this.messageModule.mint_super_message_no_policy_and_transfer({ arguments: [g_id, mt_b_id, aux_id] })(tx);
        return tx;
    }

    mintSuperMessageTimeLockAndTransfer({ g_id, mt_b_id, aux_id, from, to }: {
        g_id: ObjectId;
        mt_b_id: string;
        aux_id: Uint8Array;
        from: bigint | number;
        to: bigint | number;
    }): Transaction {
        const tx = new Transaction();
        this.messageModule.mint_super_message_time_lock_and_transfer({ arguments: [g_id, mt_b_id, aux_id, from, to] })(tx);
        return tx;
    }

    mintSuperMessageLimitedReadAndTransfer({ g_id, mt_b_id, aux_id, max }: {
        g_id: ObjectId;
        mt_b_id: string;
        aux_id: Uint8Array;
        max: bigint | number;
    }): Transaction {
        const tx = new Transaction();
        this.messageModule.mint_super_message_limited_read_and_transfer({ arguments: [g_id, mt_b_id, aux_id, max] })(tx);
        return tx;
    }

    mintSuperMessageFeeBasedAndTransfer({ g_id, mt_b_id, aux_id, fee, r }: {
        g_id: ObjectId;
        mt_b_id: string;
        aux_id: Uint8Array;
        fee: bigint | number;
        r: Address; // recipient
    }): Transaction {
        const tx = new Transaction();
        // aux_id is empty in Move, SUI coinType is implicit
        try {
            this.messageModule.mint_super_message_fee_based_and_transfer({
                arguments: [g_id, mt_b_id, aux_id, fee, r],
            })(tx);
        } catch (error) {
            console.log(error)
        }
        return tx;
    }

    mintSuperMessageCompoundAndTransfer({ g_id, mt_b_id, aux_id, tf, tt, max, fee, receipient }: {
        g_id: ObjectId;
        mt_b_id: string;
        aux_id: Uint8Array;
        tf: bigint | number; // timeFrom
        tt: bigint | number;   // timeTo
        max: bigint | number;
        fee: bigint | number;
        receipient: Address;
    }): Transaction {
        const tx = new Transaction();
        // SUI coinType is implicit
        this.messageModule.mint_super_message_compound_and_transfer({
            arguments: [g_id, mt_b_id, aux_id, tf, tt, max, fee, receipient],
        })(tx);
        return tx;
    }

    readMessage({ msg, payment }: {
        msg: ObjectId; // messageId
        payment: ObjectId; // paymentCoinId
    }): Transaction {
        const tx = new Transaction();
        const paymentCoin = tx.splitCoins(tx.gas, [payment]);

        this.messageModule.read_message({
            arguments: [msg, paymentCoin],
        })(tx);
        return tx;
    }

    withdrawFees({ msg }: {
        msg: ObjectId; // messageId
    }): Transaction {
        const tx = new Transaction();
        // SUI coinType is implicit
        this.messageModule.withdraw_fees({
            arguments: [msg],
        })(tx);
        return tx;
    }

    sealApproveSuperMessage({ id, msg, group }: {
        id: Uint8Array;
        msg: ObjectId; // messageId
        group: ObjectId; // groupId
    }): Transaction {
        const tx = new Transaction();
        this.messageModule.seal_approve_super_message({
            arguments: [id, msg, group],
        })(tx);
        return tx;
    }

    // --- Message View/Accessor Methods (as transaction calls) ---

    getCurrentReader({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.get_current_reader({ arguments: [msg] })(tx);
        return tx;
    }

    getCollectedFees({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        // SUI coinType is implicit
        this.messageModule.get_collected_fees({ arguments: [msg] })(tx);
        return tx;
    }

    getRemainingReads({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.get_remaining_reads({ arguments: [msg] })(tx);
        return tx;
    }

    isReadableByTime({ msg, ts }: { msg: ObjectId, ts: bigint | number }): Transaction {
        const tx = new Transaction();
        this.messageModule.is_readable_by_time({ arguments: [msg, ts] })(tx);
        return tx;
    }

    messageCapGetId({ msg_cap }: { msg_cap: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_cap_get_id({ arguments: [msg_cap] })(tx);
        return tx;
    }

    messageCapGetMessageId({ msg_cap }: { msg_cap: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_cap_get_message_id({ arguments: [msg_cap] })(tx);
        return tx;
    }

    messageSnapshotCapGetId({ msg_snapshot_cap }: { msg_snapshot_cap: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_snapshot_cap_get_id({ arguments: [msg_snapshot_cap] })(tx);
        return tx;
    }

    messageSnapshotCapGetMessagesSnapshotId({ msg_snapshot_cap }: { msg_snapshot_cap: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_snapshot_cap_get_messages_snapshot_id({ arguments: [msg_snapshot_cap] })(tx);
        return tx;
    }

    messageSnapshotGetId({ msg_snapshot }: { msg_snapshot: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_snapshot_get_id({ arguments: [msg_snapshot] })(tx);
        return tx;
    }

    messageSnapshotGetGroupId({ msg_snapshot }: { msg_snapshot: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_snapshot_get_group_id({ arguments: [msg_snapshot] })(tx);
        return tx;
    }

    messageSnapshotGetMessagesBlobId({ msg_snapshot }: { msg_snapshot: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_snapshot_get_messages_blob_id({ arguments: [msg_snapshot] })(tx);
        return tx;
    }

    // Accessors for Unified SuperMessage
    messageGetId({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_id({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetGroupId({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_group_id({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetMessageBlobId({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_message_blob_id({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetTimeLock({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_time_lock({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetLimitedRead({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_limited_read({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetFeePolicy({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        // SUI coinType implicit
        this.messageModule.message_get_fee_policy({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetOwner({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_owner({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetReaders({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        this.messageModule.message_get_readers({ arguments: [msg] })(tx);
        return tx;
    }
    messageGetFeeCollected({ msg }: { msg: ObjectId }): Transaction {
        const tx = new Transaction();
        // SUI coinType implicit
        this.messageModule.message_get_fee_collected({ arguments: [msg] })(tx);
        return tx;
    }
}