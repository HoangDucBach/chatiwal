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
    // Snapshot management
    mint_messages_snapshot_and_transfer(
        groupId: string,
        metadataBlobId: string
    ): Promise<void>;
    
    mint_messages_snapshot_cap_and_transfer(
        messages_snapshot_id: string
    ): Promise<void>;
    
    // No Policy Messages
    mint_super_message_no_policy_and_transfer(
        groupId: string,
        metadataBlobId: string
    ): Promise<void>;
    
    read_message_no_policy(
        msgId: string
    ): Promise<void>;
    
    // Time Lock Messages
    mint_super_message_time_lock_and_transfer(
        groupId: string,
        metadataBlobId: string,
        timeFrom: number | bigint,
        timeTo: number | bigint
    ): Promise<void>;
    
    read_message_time_lock(
        msgId: string
    ): Promise<void>;
    
    // Limited Read Messages
    mint_super_message_limited_read_and_transfer(
        groupId: string,
        metadataBlobId: string,
        maxReads: number | bigint
    ): Promise<void>;
    
    read_message_limited_read(
        msgId: string
    ): Promise<void>;
    
    // Fee Based Messages
    mint_super_message_fee_based_and_transfer(
        groupId: string,
        metadataBlobId: string,
        fee: number | bigint,
        recipient: string,
        coinType: string
    ): Promise<void>;
    
    read_message_fee_based(
        msgId: string,
        payment_coin_id: string,
        coinType: string
    ): Promise<void>;
    
    withdraw_fees(
        msgId: string,
        coinType: string
    ): Promise<void>;
    
    // Compound Messages
    mint_super_message_compound_and_transfer(
        groupId: string,
        metadataBlobId: string,
        timeFrom: number | bigint,
        timeTo: number | bigint,
        maxReads: number | bigint,
        fee: number | bigint,
        recipient: string,
        coinType: string
    ): Promise<void>;
    
    read_message_compound(
        msgId: string,
        payment_coin_id: string,
        coinType: string
    ): Promise<void>;
    
    withdraw_fees_compound(
        msgId: string,
        coinType: string
    ): Promise<void>;
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
        
        read_message_no_policy: async (msgId: string) => {
            await executeTransaction(() => 
                client.readMessageNoPolicy({
                    messageId: msgId
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
        
        read_message_time_lock: async (msgId: string) => {
            await executeTransaction(() => 
                client.readMessageTimeLock({
                    messageId: msgId
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
        
        read_message_limited_read: async (msgId: string) => {
            await executeTransaction(() => 
                client.readMessageLimitedRead({
                    messageId: msgId
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
        
        read_message_fee_based: async (msgId: string, payment_coin_id: string, coinType: string) => {
            await executeTransaction(() => 
                client.readMessageFeeBased({
                    messageId: msgId,
                    paymentCoinId: payment_coin_id,
                    coinType: coinType
                })
            );
        },
        
        withdraw_fees: async (msgId: string, coinType: string) => {
            await executeTransaction(() => 
                client.withdrawFees({
                    messageId: msgId,
                    coinType: coinType
                })
            );
        },
        
        // Compound Messages
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
                    tf: timeFrom,
                    tt: timeTo,
                    max: maxReads,
                    fee: fee,
                    recipient: recipient,
                    coinType: coinType
                })
            );
        },
        
        read_message_compound: async (msgId: string, payment_coin_id: string, coinType: string) => {
            await executeTransaction(() => 
                client.readMessageCompound({
                    messageId: msgId,
                    paymentCoinId: payment_coin_id,
                    coinType: coinType
                })
            );
        },
        
        withdraw_fees_compound: async (msgId: string, coinType: string) => {
            await executeTransaction(() => 
                client.withdrawFeesCompound({
                    messageId: msgId,
                    coinType: [coinType]
                })
            );
        }
    };

    return {
        client,
        ...groupActions,
        ...messageActions,
    };
}