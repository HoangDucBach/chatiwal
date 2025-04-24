"use client";

import { useMemo } from "react";
import { ChatiwalClient, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "@/sdk";
import { ChatiwalClientConfig } from "@/sdk/types";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { InvalidGroupCapError } from "@/sdk/errors";
import { Address, ObjectId } from "@/sdk/types";
import { Transaction } from "@mysten/sui/transactions";
import { bcs, BcsType } from "@mysten/sui/bcs";

export interface IGroupActions {
    mint_group_and_transfer(metadataBlobId?: string): Promise<Transaction>;
    mint_group_cap(group: string, recipient: string): Promise<Transaction>;
    add_member(group: string, member: string): Promise<Transaction>;
    remove_member(group: string, member: string): Promise<Transaction>;
    seal_approve(id: Uint8Array, group: string): Promise<Transaction>;
    group_get_group_id(group: string): Promise<Uint8Array>;
    group_get_group_member(group: string): Promise<number[]>;
    group_get_group_metadataBlobId(group: string): Promise<string>;
    group_cap_get_group_id(group_cap: string): Promise<Uint8Array>;
    group_cap_get_id(group_cap: string): Promise<string>;
    is_member(group: string, addr: string): Promise<boolean>;
}

export interface IMessageActions {
    mint_messages_snapshot_and_transfer(groupId: string, metadataBlobId: string): Promise<Transaction>;
    mint_messages_snapshot_cap_and_transfer(messages_snapshot_id: string): Promise<Transaction>;
    mint_super_message_no_policy_and_transfer(groupId: string, metadataBlobId: string): Promise<Transaction>;
    read_message_no_policy(messageId: string): Promise<Transaction>;
    mint_super_message_time_lock_and_transfer(groupId: string, metadataBlobId: string, timeFrom: number | bigint, timeTo: number | bigint): Promise<Transaction>;
    read_message_time_lock(messageId: string): Promise<Transaction>;
    mint_super_message_limited_read_and_transfer(groupId: string, metadataBlobId: string, maxReads: number | bigint): Promise<Transaction>; read_message_limited_read(messageId: string): Promise<Transaction>;
    mint_super_message_fee_based_and_transfer(groupId: string, metadataBlobId: string, fee: number | bigint, recipient: string, coinType: string): Promise<Transaction>;
    read_message_fee_based(messageId: string, payment_coin_id: string, coinType: string): Promise<Transaction>; withdraw_fees(messageId: string, coinType: string): Promise<Transaction>;
    mint_super_message_compound_and_transfer(groupId: string, metadataBlobId: string, timeFrom: number | bigint, timeTo: number | bigint, maxReads: number | bigint, fee: number | bigint, recipient: string, coinType: string): Promise<Transaction>;
    read_message_compound(messageId: string, payment_coin_id: string, coinType: string): Promise<Transaction>;
    withdraw_fees_compound(messageId: string, coinType: string): Promise<Transaction>;

    // === Seal Integration ===

    seal_approve_super_message_time_lock(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<Transaction>;
    seal_approve_super_message_limited_read(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<Transaction>;
    seal_approve_super_message_fee_based(id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string): Promise<Transaction>;
    seal_approve_super_message_compound(id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string): Promise<Transaction>;

    // === Public view functions (Accessors using devInspect) ===

    get_current_reader(messageId: ObjectId): Promise<string>; // u64 as string
    get_collected_fees(messageId: ObjectId, coinType: string): Promise<string>; // u64 as string
    get_collected_fees_compound(messageId: ObjectId, coinType: string): Promise<string>; // u64 as string
    get_remaining_reads(messageId: ObjectId): Promise<string>; // u64 as string
    is_readable_by_time(messageId: ObjectId, timestamp: bigint | number): Promise<boolean>;
    message_cap_get_id(capId: ObjectId): Promise<ObjectId>;
    message_cap_get_message_id(capId: ObjectId): Promise<ObjectId>;
    message_snapshot_cap_get_id(capId: ObjectId): Promise<ObjectId>;
    message_snapshot_cap_get_messages_snapshot_id(capId: ObjectId): Promise<ObjectId>;
    message_snapshot_get_id(snapshotId: ObjectId): Promise<ObjectId>;
    message_snapshot_get_group_id(snapshotId: ObjectId): Promise<ObjectId>;
    message_snapshot_get_messages_blob_id(snapshotId: ObjectId): Promise<string>;
    message_no_policy_get_id(messageId: ObjectId): Promise<ObjectId>;
    message_no_policy_get_group_id(messageId: ObjectId): Promise<ObjectId>;
    message_no_policy_get_message_blob_id(messageId: ObjectId): Promise<string>;
    message_no_policy_get_owner(messageId: ObjectId): Promise<Address>;
    message_limit_read_get_id(messageId: ObjectId): Promise<ObjectId>;
    message_limit_read_get_group_id(messageId: ObjectId): Promise<ObjectId>;
    message_limit_read_get_message_blob_id(messageId: ObjectId): Promise<string>;
    message_limit_read_get_policy(messageId: ObjectId): Promise<any>; // Specific policy type needed for parsing
    message_limit_read_get_owner(messageId: ObjectId): Promise<Address>;
    message_limit_read_get_readers(messageId: ObjectId): Promise<Address[]>;
    message_time_lock_get_id(messageId: ObjectId): Promise<ObjectId>;
    message_time_lock_get_group_id(messageId: ObjectId): Promise<ObjectId>;
    message_time_lock_get_message_blob_id(messageId: ObjectId): Promise<string>;
    message_time_lock_get_policy(messageId: ObjectId): Promise<any>; // Specific policy type needed for parsing
    message_time_lock_get_owner(messageId: ObjectId): Promise<Address>;
    message_fee_based_get_id(messageId: ObjectId, coinType: string): Promise<ObjectId>;
    message_fee_based_get_group_id(messageId: ObjectId, coinType: string): Promise<ObjectId>;
    message_fee_based_get_message_blob_id(messageId: ObjectId, coinType: string): Promise<string>;
    message_fee_based_get_policy(messageId: ObjectId, coinType: string): Promise<any>; // Specific policy type needed for parsing
    message_fee_based_get_owner(messageId: ObjectId, coinType: string): Promise<Address>;
    message_fee_based_get_readers(messageId: ObjectId, coinType: string): Promise<Address[]>;
    message_fee_based_get_fee_collected(messageId: ObjectId, coinType: string): Promise<any>; // Specific Balance type needed
    message_compound_get_id(messageId: ObjectId, coinType: string): Promise<ObjectId>;
    message_compound_get_group_id(messageId: ObjectId, coinType: string): Promise<ObjectId>;
    message_compound_get_message_blob_id(messageId: ObjectId, coinType: string): Promise<string>;
    message_compound_get_time_lock(messageId: ObjectId, coinType: string): Promise<any>; // Specific policy type needed
    message_compound_get_limited_read(messageId: ObjectId, coinType: string): Promise<any>; // Specific policy type needed
    message_compound_get_fee_policy(messageId: ObjectId, coinType: string): Promise<any>; // Specific policy type needed
    message_compound_get_owner(messageId: ObjectId, coinType: string): Promise<Address>;
    message_compound_get_fee_collected(messageId: ObjectId, coinType: string): Promise<any>; // Specific Balance type needed
    message_compound_get_readers(messageId: ObjectId, coinType: string): Promise<Address[]>;
    message_compound_get_remaining_reads(messageId: ObjectId, coinType: string): Promise<string>; // u64 as string
}

export interface IChatiwalClientActions extends IGroupActions, IMessageActions {
    client: ChatiwalClient;
}

export function useChatiwalClient(): IChatiwalClientActions {
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    const client = useMemo(() => {
        const config: ChatiwalClientConfig = {
            packageConfig: TESTNET_CHATIWAL_PACKAGE_CONFIG,
            suiClient,
        };
        return new ChatiwalClient(config);
    }, [suiClient]);


    if (!suiClient) {
        throw new Error("Sui client is not available");
    }

    const validateAccount = () => {
        if (!account) throw new Error("Please connect your wallet");
        return account;
    };

    const getOwnedGroupCapById = async (group: string) => {
        validateAccount();

        const groupCapsOfOwner = await suiClient.getOwnedObjects({
            owner: account!.address,
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
            const object = cap.data?.content?.fields as unknown as any;
            return object.group_id === group;
        });

        return groupCap;
    };

    const validateGroupCap = async (group: string) => {
        const groupCapOfOwner = await getOwnedGroupCapById(group);
        if (!groupCapOfOwner || !groupCapOfOwner.data) {
            throw new InvalidGroupCapError("You don't have permission");
        }
        return groupCapOfOwner.data.objectId;
    };
    const executeTransaction = async (txBuilder: () => Promise<Transaction>) => {
        try {
            validateAccount();
            return await txBuilder();
        } catch (error) {
            throw error;
        }
    };

    const executeInspectTransaction = async (txBuilder: () => Promise<any>, processResult?: (bytes: Uint8Array) => any) => {
        try {
            const userAccount = validateAccount();
            const tx = await txBuilder();
            const res = await suiClient.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: userAccount.address,
            });

            if (!res || !res.results) {
                throw new Error("No results found");
            }
            const bytes = new Uint8Array(res.results[0].returnValues![0][0]);

            return processResult ? processResult(bytes) : bytes;
        } catch (error) {
            throw error;
        }
    };

    const groupActions: IGroupActions = {
        mint_group_and_transfer: async (metadataBlobId: string = "") => {
            return await executeTransaction(() =>
                client.mintGroupAndTransfer({ metadataBlobId: metadataBlobId })
            );
        },

        mint_group_cap: async (group: string, recipient: string) => {
            const groupCapId = await validateGroupCap(group);
            return await executeTransaction(() =>
                client.mintGroupCap({
                    groupCapId,
                    groupId: group,
                    recipient,
                })
            );
        },

        add_member: async (group: string, member: string) => {
            const groupCapId = await validateGroupCap(group);
            return await executeTransaction(() =>
                client.addMember({
                    groupCapId,
                    groupId: group,
                    member,
                })
            );
        },

        remove_member: async (group: string, member: string) => {
            const groupCapId = await validateGroupCap(group);
            return await executeTransaction(() =>
                client.removeMember({
                    groupCapId,
                    groupId: group,
                    member,
                })
            );
        },

        seal_approve: async (id: Uint8Array, group: string) => {
            return await executeInspectTransaction(() =>
                client.sealApprove({
                    id,
                    groupId: group,
                })
            );
        },

        group_get_group_id: async (group: string): Promise<Uint8Array> => {
            return executeInspectTransaction(
                () => client.groupGetGroupId(group),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        group_get_group_member: async (group: string): Promise<number[]> => {
            return executeInspectTransaction(
                () => client.groupGetGroupMember(group),
                (bytes) => bcs.vector(bcs.Address).parse(bytes)
            );
        },

        group_get_group_metadataBlobId: async (group: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.groupGetGroupMetadataBlobId(group),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        group_cap_get_group_id: async (group_cap: string): Promise<Uint8Array> => {
            return executeInspectTransaction(
                () => client.groupCapGetGroupId(group_cap),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        group_cap_get_id: async (group_cap: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.groupCapGetId(group_cap),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        is_member: async (group: string, addr: string): Promise<boolean> => {
            return executeInspectTransaction(
                () => client.isMember({
                    groupId: group,
                    address: addr,
                }),
                (bytes) => bcs.Bool.parse(bytes)
            );
        }
    };

    const messageActions: IMessageActions = {
        // Snapshot management
        mint_messages_snapshot_and_transfer: async (groupId: string, metadataBlobId: string) => {
            return await executeTransaction(() =>
                client.mintMessagesSnapshotAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId
                })
            );
        },

        mint_messages_snapshot_cap_and_transfer: async (messages_snapshot_id: string) => {
            return await executeTransaction(() =>
                client.mintMessagesSnapshotCapAndTransfer({
                    msgsSnapshotId: messages_snapshot_id
                })
            );
        },

        // No Policy Messages
        mint_super_message_no_policy_and_transfer: async (groupId: string, metadataBlobId: string) => {
            return await executeTransaction(() =>
                client.mintSuperMessageNoPolicyAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId
                })
            );
        },

        read_message_no_policy: async (messageId: string) => {
            return await executeTransaction(() =>
                client.readMessageNoPolicy({
                    messageId: messageId
                })
            );
        },

        // Time Lock Messages
        mint_super_message_time_lock_and_transfer: async (
            groupId: string,
            metadataBlobId: string,
            timeFrom: number | bigint,
            timeTo: number | bigint
        ) => {
            return await executeTransaction(() =>
                client.mintSuperMessageTimeLockAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId,
                    from: timeFrom,
                    to: timeTo
                })
            );
        },

        read_message_time_lock: async (messageId: string) => {
            return await executeTransaction(() =>
                client.readMessageTimeLock({
                    messageId: messageId
                })
            );
        },

        // Limited Read Messages
        mint_super_message_limited_read_and_transfer: async (
            groupId: string,
            metadataBlobId: string,
            maxReads: number | bigint
        ) => {
            return await executeTransaction(() =>
                client.mintSuperMessageLimitedReadAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId,
                    max: maxReads
                })
            );
        },

        read_message_limited_read: async (messageId: string) => {
            return await executeTransaction(() =>
                client.readMessageLimitedRead({
                    messageId: messageId
                })
            );
        },

        // Fee Based Messages
        mint_super_message_fee_based_and_transfer: async (
            groupId: string,
            metadataBlobId: string,
            fee: number | bigint,
            recipient: string,
            coinType: string
        ) => {
            return await executeTransaction(() =>
                client.mintSuperMessageFeeBasedAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId,
                    fee: fee,
                    recipient: recipient,
                    coinType: coinType
                })
            );
        },

        read_message_fee_based: async (messageId: string, payment_coin_id: string, coinType: string) => {
            return await executeTransaction(() =>
                client.readMessageFeeBased({
                    messageId: messageId,
                    paymentCoinId: payment_coin_id,
                    coinType: coinType
                })
            );
        },

        withdraw_fees: async (messageId: string, coinType: string) => {
            return await executeTransaction(() =>
                client.withdrawFees({
                    messageId: messageId,
                    coinType: coinType
                })
            );
        },

        mint_super_message_compound_and_transfer: async (
            groupId: string,
            metadataBlobId: string,
            timeFrom: number | bigint,
            timeTo: number | bigint,
            maxReads: number | bigint,
            fee: number | bigint,
            recipient: string,
            coinType: string
        ) => {
            return await executeTransaction(() =>
                client.mintSuperMessageCompoundAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId,
                    timeFrom: timeFrom,
                    timeTo: timeTo,
                    max: maxReads,
                    fee: fee,
                    recipient: recipient,
                    coinType: coinType
                })
            );
        },

        read_message_compound: async (messageId: string, payment_coin_id: string, coinType: string) => {
            return await executeTransaction(() =>
                client.readMessageCompound({
                    messageId: messageId,
                    paymentCoinId: payment_coin_id,
                    coinType: coinType
                })
            );
        },

        withdraw_fees_compound: async (messageId: string, coinType: string) => {
            return await executeTransaction(() =>
                client.withdrawFeesCompound({
                    messageId: messageId,
                    coinType: coinType
                })
            );
        },

        // === Seal Integration ===

        seal_approve_super_message_time_lock: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageTimeLock({
                    id,
                    messageId: messageId,
                    groupId: groupId
                })
            );
        },
        seal_approve_super_message_limited_read: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageLimitedRead({
                    id,
                    messageId: messageId,
                    groupId: groupId
                })
            );
        },
        seal_approve_super_message_fee_based: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageFeeBased({
                    id,
                    messageId: messageId,
                    groupId: groupId,
                    coinType: coinType
                })
            );
        },
        seal_approve_super_message_compound: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageCompound({
                    id,
                    messageId: messageId,
                    groupId: groupId,
                    coinType: coinType
                })
            );
        },

        // === Public view functions (Accessors using devInspect) ===

        get_current_reader: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.getCurrentReader({
                    messageId: messageId
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        get_collected_fees: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.getCollectedFees({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        get_collected_fees_compound: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.getCollectedFeesCompound({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        get_remaining_reads: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.getRemainingReads({
                    messageId: messageId
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        is_readable_by_time: async (messageId: ObjectId, timestamp: bigint | number): Promise<boolean> => {
            return executeInspectTransaction(
                () => client.isReadableByTime({ messageId, timestamp }),
                (bytes) => bcs.Bool.parse(bytes)
            );
        },

        message_cap_get_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCapGetId({ capId }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_cap_get_message_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCapGetMessageId({ capId }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_snapshot_cap_get_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotCapGetId({ capId }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_snapshot_cap_get_messages_snapshot_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotCapGetMessagesSnapshotId({ capId }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_snapshot_get_id: async (snapshotId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotGetId({ snapshotId }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_snapshot_get_group_id: async (snapshotId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotGetGroupId({ snapshotId }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_snapshot_get_messages_blob_id: async (snapshotId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageSnapshotGetMessagesBlobId({ snapshotId }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        message_no_policy_get_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetId({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_no_policy_get_group_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetGroupId({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_no_policy_get_message_blob_id: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetMessageBlobId({
                    messageId: messageId
                }),
                (bytes) => bcs.
            );
        },

        message_no_policy_get_owner: async (messageId: ObjectId): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetOwner({
                    messageId: messageId
                }),
                (bytes) => bcs.
            );
        },

        message_limit_read_get_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetId({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_limit_read_get_group_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetGroupId({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_limit_read_get_message_blob_id: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetMessageBlobId({
                    messageId: messageId
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        message_limit_read_get_policy: async (messageId: ObjectId): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetPolicy({
                    messageId: messageId
                }),
                (bytes) => bcs.
            );
        },

        message_limit_read_get_owner: async (messageId: ObjectId): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetOwner({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_limit_read_get_readers: async (messageId: ObjectId): Promise<Address[]> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetReaders({
                    messageId: messageId
                }),
                (bytes) => bcs.vector(bcs.Address).parse(bytes)
            );
        },

        message_time_lock_get_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetId({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_time_lock_get_group_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetGroupId({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_time_lock_get_message_blob_id: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetMessageBlobId({
                    messageId: messageId
                }),
                (bytes) => bcs.
            );
        },

        message_time_lock_get_policy: async (messageId: ObjectId): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetPolicy({
                    messageId: messageId
                }),
                (bytes) => bcs.
            );
        },

        message_time_lock_get_owner: async (messageId: ObjectId): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetOwner({
                    messageId: messageId
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_fee_based_get_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_fee_based_get_group_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetGroupId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_fee_based_get_message_blob_id: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetMessageBlobId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        message_fee_based_get_policy: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetPolicy({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.
            );
        },

        message_fee_based_get_owner: async (messageId: ObjectId, coinType: string): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetOwner({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_fee_based_get_readers: async (messageId: ObjectId, coinType: string): Promise<Address[]> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetReaders({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.vector(bcs.Address).parse(bytes)
            );
        },

        message_fee_based_get_fee_collected: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetFeeCollected({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.
            );
        },

        message_compound_get_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_compound_get_group_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetGroupId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_compound_get_message_blob_id: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetMessageBlobId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        },

        message_compound_get_time_lock: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetTimeLock({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.
            );
        },

        message_compound_get_limited_read: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetLimitedRead({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.
            );
        },

        message_compound_get_fee_policy: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetFeePolicy({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.
            );
        },

        message_compound_get_owner: async (messageId: ObjectId, coinType: string): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetOwner({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.Address.parse(bytes)
            );
        },

        message_compound_get_fee_collected: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetFeeCollected({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.
            );
        },

        message_compound_get_readers: async (messageId: ObjectId, coinType: string): Promise<Address[]> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetReaders({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.vector(bcs.Address).parse(bytes)
            );
        },

        message_compound_get_remaining_reads: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetRemainingReads({
                    messageId: messageId,
                    coinType: coinType
                }),
                (bytes) => bcs.String.parse(bytes)
            );
        }
    };

    return {
        client,
        ...groupActions,
        ...messageActions,
    };
}