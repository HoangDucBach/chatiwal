"use client";

import { useMemo } from "react";
import { ChatiwalClient, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "@/sdk";
import { ChatiwalClientConfig, GroupCap } from "@/sdk/types";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { InvalidGroupCapError } from "@/sdk/errors";
import { Address, ObjectId } from "@/sdk/types";

export interface IGroupActions {
    mint_group_and_transfer(metadataBlobId: string): Promise<void>;
    mint_group_cap(group: string, recipient: string): Promise<void>;
    add_member(group: string, member: string): Promise<void>;
    remove_member(group: string, member: string): Promise<void>;
    seal_approve(id: Uint8Array, group: string): Promise<void>;
    group_get_group_id(group: string): Promise<Uint8Array>;
    group_get_group_member(group: string): Promise<number[]>;
    group_get_group_metadataBlobId(group: string): Promise<string>;
    group_cap_get_group_id(group_cap: string): Promise<Uint8Array>;
    group_cap_get_id(group_cap: string): Promise<string>;
    is_member(group: string, addr: string): Promise<boolean>;
}

export interface IMessageActions {
    mint_messages_snapshot_and_transfer(groupId: string, metadataBlobId: string): Promise<void>;
    mint_messages_snapshot_cap_and_transfer(messages_snapshot_id: string): Promise<void>;
    mint_super_message_no_policy_and_transfer(groupId: string, metadataBlobId: string): Promise<void>;
    read_message_no_policy(messageId: string): Promise<void>;
    mint_super_message_time_lock_and_transfer(groupId: string, metadataBlobId: string, timeFrom: number | bigint, timeTo: number | bigint): Promise<void>;
    read_message_time_lock(messageId: string): Promise<void>;
    mint_super_message_limited_read_and_transfer(groupId: string, metadataBlobId: string, maxReads: number | bigint): Promise<void>; read_message_limited_read(messageId: string): Promise<void>;
    mint_super_message_fee_based_and_transfer(groupId: string, metadataBlobId: string, fee: number | bigint, recipient: string, coinType: string): Promise<void>;
    read_message_fee_based(messageId: string, payment_coin_id: string, coinType: string): Promise<void>; withdraw_fees(messageId: string, coinType: string): Promise<void>;
    mint_super_message_compound_and_transfer(groupId: string, metadataBlobId: string, timeFrom: number | bigint, timeTo: number | bigint, maxReads: number | bigint, fee: number | bigint, recipient: string, coinType: string): Promise<void>;
    read_message_compound(messageId: string, payment_coin_id: string, coinType: string): Promise<void>;
    withdraw_fees_compound(messageId: string, coinType: string): Promise<void>;

    // === Seal Integration ===

    seal_approve_super_message_time_lock(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<void>;
    seal_approve_super_message_limited_read(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<void>;
    seal_approve_super_message_fee_based(id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string): Promise<void>;
    seal_approve_super_message_compound(id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string): Promise<void>;

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
            const object = cap.data?.content?.fields as unknown as GroupCap;
            return object.groupId === group;
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

    const executeTransaction = async (txBuilder: () => Promise<any>) => {
        try {
            validateAccount();
            return await txBuilder();
        } catch (error) {
            throw error;
        }
    };

    const executeInspectTransaction = async (txBuilder: () => Promise<any>, processResult?: (res: any) => any) => {
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

            return processResult ? processResult(res) : res;
        } catch (error) {
            throw error;
        }
    };

    const groupActions: IGroupActions = {
        mint_group_and_transfer: async (metadataBlobId: string) => {
            await executeTransaction(() =>
                client.mintGroupAndTransfer({ metadataBlobId: metadataBlobId })
            );
        },

        mint_group_cap: async (group: string, recipient: string) => {
            const groupCapId = await validateGroupCap(group);
            await executeTransaction(() =>
                client.mintGroupCap({
                    groupCapId,
                    groupId: group,
                    recipient,
                })
            );
        },

        add_member: async (group: string, member: string) => {
            const groupCapId = await validateGroupCap(group);
            await executeTransaction(() =>
                client.addMember({
                    groupCapId,
                    groupId: group,
                    member,
                })
            );
        },

        remove_member: async (group: string, member: string) => {
            const groupCapId = await validateGroupCap(group);
            await executeTransaction(() =>
                client.removeMember({
                    groupCapId,
                    groupId: group,
                    member,
                })
            );
        },

        seal_approve: async (id: Uint8Array, group: string) => {
            await executeInspectTransaction(() =>
                client.sealApprove({
                    id,
                    groupId: group,
                })
            );
        },

        group_get_group_id: async (group: string): Promise<Uint8Array> => {
            return executeInspectTransaction(
                () => client.groupGetGroupId(group),
                (res) => new Uint8Array(res.results[0].returnValues![0][0])
            );
        },

        group_get_group_member: async (group: string): Promise<number[]> => {
            return executeInspectTransaction(
                () => client.groupGetGroupMember(group),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        group_get_group_metadataBlobId: async (group: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.groupGetGroupMetadataBlobId(group),
                (res) => new Uint8Array(res.results[0].returnValues![0][0])
            );
        },

        group_cap_get_group_id: async (group_cap: string): Promise<Uint8Array> => {
            return executeInspectTransaction(
                () => client.groupCapGetGroupId(group_cap),
                (res) => new Uint8Array(res.results[0].returnValues![0][0])
            );
        },

        group_cap_get_id: async (group_cap: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.groupCapGetId(group_cap),
                (res) => new Uint8Array(res.results[0].returnValues![0][0])
            );
        },

        is_member: async (group: string, addr: string): Promise<boolean> => {
            return executeInspectTransaction(
                () => client.isMember({
                    groupId: group,
                    address: addr,
                }),
                (res) => res.results[0].returnValues![0][0] as unknown as boolean
            );
        }
    };

    const messageActions: IMessageActions = {
        // Snapshot management
        mint_messages_snapshot_and_transfer: async (groupId: string, metadataBlobId: string) => {
            await executeTransaction(() =>
                client.mintMessagesSnapshotAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId
                })
            );
        },

        mint_messages_snapshot_cap_and_transfer: async (messages_snapshot_id: string) => {
            await executeTransaction(() =>
                client.mintMessagesSnapshotCapAndTransfer({
                    msgsSnapshotId: messages_snapshot_id
                })
            );
        },

        // No Policy Messages
        mint_super_message_no_policy_and_transfer: async (groupId: string, metadataBlobId: string) => {
            await executeTransaction(() =>
                client.mintSuperMessageNoPolicyAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId
                })
            );
        },

        read_message_no_policy: async (messageId: string) => {
            await executeTransaction(() =>
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
            await executeTransaction(() =>
                client.mintSuperMessageTimeLockAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId,
                    from: timeFrom,
                    to: timeTo
                })
            );
        },

        read_message_time_lock: async (messageId: string) => {
            await executeTransaction(() =>
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
            await executeTransaction(() =>
                client.mintSuperMessageLimitedReadAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId,
                    max: maxReads
                })
            );
        },

        read_message_limited_read: async (messageId: string) => {
            await executeTransaction(() =>
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
            await executeTransaction(() =>
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
            await executeTransaction(() =>
                client.readMessageFeeBased({
                    messageId: messageId,
                    paymentCoinId: payment_coin_id,
                    coinType: coinType
                })
            );
        },

        withdraw_fees: async (messageId: string, coinType: string) => {
            await executeTransaction(() =>
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
            await executeTransaction(() =>
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
            await executeTransaction(() =>
                client.readMessageCompound({
                    messageId: messageId,
                    paymentCoinId: payment_coin_id,
                    coinType: coinType
                })
            );
        },

        withdraw_fees_compound: async (messageId: string, coinType: string) => {
            await executeTransaction(() =>
                client.withdrawFeesCompound({
                    messageId: messageId,
                    coinType: coinType
                })
            );
        },

        // === Seal Integration ===

        seal_approve_super_message_time_lock: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            await executeInspectTransaction(() =>
                client.sealApproveSuperMessageTimeLock({
                    id,
                    messageId: messageId,
                    groupId: groupId
                })
            );
        },
        seal_approve_super_message_limited_read: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            await executeInspectTransaction(() =>
                client.sealApproveSuperMessageLimitedRead({
                    id,
                    messageId: messageId,
                    groupId: groupId
                })
            );
        },
        seal_approve_super_message_fee_based: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string) => {
            await executeInspectTransaction(() =>
                client.sealApproveSuperMessageFeeBased({
                    id,
                    messageId: messageId,
                    groupId: groupId,
                    coinType: coinType
                })
            );
        },
        seal_approve_super_message_compound: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string) => {
            await executeInspectTransaction(() =>
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
                (res) => res.results[0].returnValues![0][0]
            );
        },

        get_collected_fees: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.getCollectedFees({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        get_collected_fees_compound: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.getCollectedFeesCompound({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        get_remaining_reads: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.getRemainingReads({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        is_readable_by_time: async (messageId: ObjectId, timestamp: bigint | number): Promise<boolean> => {
            return executeInspectTransaction(
                () => client.isReadableByTime({ messageId, timestamp }),
                (res) => res.results[0].returnValues![0][0] as unknown as boolean
            );
        },

        message_cap_get_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCapGetId({ capId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_cap_get_message_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCapGetMessageId({ capId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_snapshot_cap_get_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotCapGetId({ capId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_snapshot_cap_get_messages_snapshot_id: async (capId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotCapGetMessagesSnapshotId({ capId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_snapshot_get_id: async (snapshotId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotGetId({ snapshotId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_snapshot_get_group_id: async (snapshotId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageSnapshotGetGroupId({ snapshotId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_snapshot_get_messages_blob_id: async (snapshotId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageSnapshotGetMessagesBlobId({ snapshotId }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_no_policy_get_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_no_policy_get_group_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetGroupId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_no_policy_get_message_blob_id: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetMessageBlobId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_no_policy_get_owner: async (messageId: ObjectId): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageNoPolicyGetOwner({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_limit_read_get_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_limit_read_get_group_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetGroupId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_limit_read_get_message_blob_id: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetMessageBlobId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_limit_read_get_policy: async (messageId: ObjectId): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetPolicy({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_limit_read_get_owner: async (messageId: ObjectId): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetOwner({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_limit_read_get_readers: async (messageId: ObjectId): Promise<Address[]> => {
            return executeInspectTransaction(
                () => client.messageLimitReadGetReaders({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_time_lock_get_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_time_lock_get_group_id: async (messageId: ObjectId): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetGroupId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_time_lock_get_message_blob_id: async (messageId: ObjectId): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetMessageBlobId({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_time_lock_get_policy: async (messageId: ObjectId): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetPolicy({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_time_lock_get_owner: async (messageId: ObjectId): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageTimeLockGetOwner({
                    messageId: messageId
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_group_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetGroupId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_message_blob_id: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetMessageBlobId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_policy: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetPolicy({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_owner: async (messageId: ObjectId, coinType: string): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetOwner({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_readers: async (messageId: ObjectId, coinType: string): Promise<Address[]> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetReaders({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_fee_based_get_fee_collected: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageFeeBasedGetFeeCollected({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_group_id: async (messageId: ObjectId, coinType: string): Promise<ObjectId> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetGroupId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_message_blob_id: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetMessageBlobId({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_time_lock: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetTimeLock({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_limited_read: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetLimitedRead({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_fee_policy: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetFeePolicy({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_owner: async (messageId: ObjectId, coinType: string): Promise<Address> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetOwner({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_fee_collected: async (messageId: ObjectId, coinType: string): Promise<any> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetFeeCollected({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_readers: async (messageId: ObjectId, coinType: string): Promise<Address[]> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetReaders({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        },

        message_compound_get_remaining_reads: async (messageId: ObjectId, coinType: string): Promise<string> => {
            return executeInspectTransaction(
                () => client.messageCompoundGetRemainingReads({
                    messageId: messageId,
                    coinType: coinType
                }),
                (res) => res.results[0].returnValues![0][0]
            );
        }
    };

    return {
        client,
        ...groupActions,
        ...messageActions,
    };
}