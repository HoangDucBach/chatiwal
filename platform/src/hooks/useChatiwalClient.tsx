"use client";

import { useMemo } from "react";
import { ChatiwalClient, GroupCapStruct, GroupStruct, MessagesSnapshotStruct, SuperMessageStruct, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "@/sdk";
import { ChatiwalClientConfig } from "@/sdk/types";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { InvalidGroupCapError } from "@/sdk/errors";
import { ObjectId } from "@/sdk/types";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';

type GroupData = typeof GroupStruct.$inferType;
type SuperMessageData = typeof SuperMessageStruct.$inferType
type MessagesSnapshotData = typeof MessagesSnapshotStruct.$inferType;
type GroupCapData = typeof GroupCapStruct.$inferType;

export interface IGroupActions {
    mintGroupAndTransfer(metadataBlobId?: string, _tx?: Transaction): Promise<Transaction>;
    mintGroupCap(groupId: string, recipient: string): Promise<Transaction>;
    addMember(groupId: string, member: string, groupCap?: string): Promise<Transaction>;
    removeMember(groupId: string, member: string): Promise<Transaction>;
    leaveGroup(groupId: string, member: string): Promise<Transaction>;
    sealApprove(id: Uint8Array, groupId: string): Promise<Transaction>;
    validateGroupCap(groupId: string): Promise<string>;
    getGroupData(groupdId: string): Promise<GroupData>;
    getGroupCapData(groupCapId: string): Promise<GroupCapData>;
    getMessageSnapshotData(messagesSnapshotId: string): Promise<MessagesSnapshotData>;
}

export interface IMessageActions {
    mintMessagesSnapshotAndTransfer(groupId: string, metadataBlobId: string): Promise<Transaction>;
    mintMessagesSnapshotCapAndTransfer(messagesSnapshotId: string): Promise<Transaction>;
    mintSuperMessageNoPolicyAndTransfer(groupId: string, messageBlobId: string, auxId: Uint8Array): Promise<Transaction>;
    mintSuperMessageTimeLockAndTransfer(groupId: string, messageBlobId: string, auxId: Uint8Array, timeFrom: number | bigint, timeTo: number | bigint): Promise<Transaction>;
    mintSuperMessageLimitedReadAndTransfer(groupId: string, messageBlobId: string, auxId: Uint8Array, maxReads: number | bigint): Promise<Transaction>;
    mintSuperMessageFeeBasedAndTransfer(groupId: string, messageBlobId: string, auxId: Uint8Array, fee: number | bigint, recipient: string): Promise<Transaction>;
    mintSuperMessageCompoundAndTransfer(groupId: string, messageBlobId: string, auxId: Uint8Array, timeFrom: number | bigint, timeTo: number | bigint, maxReads: number | bigint, fee: number | bigint, recipient: string): Promise<Transaction>;
    readMessage(messageId: string, paymentCoinId: string): Promise<Transaction>;
    withdrawFees(messageId: string): Promise<Transaction>;
    sealApproveSuperMessage(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<Transaction>;
    getSuperMessageData(messageId: string): Promise<SuperMessageData>;
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

    const gqlClient = useMemo(() => {
        return new SuiGraphQLClient({
            url: 'https://sui-testnet.mystenlabs.com/graphql',
        })
    }, []);

    if (!suiClient) {
        throw new Error("Sui client is not available");
    }

    const validateAccount = () => {
        if (!account) throw new Error("Please connect your wallet");
        return account;
    };

    const getOwnedGroupCapById = async (groupId: string) => {
        const userAccount = validateAccount();
        const packageId = client.getPackageConfig().chatiwalId;

        const groupCapsOfOwner = await suiClient.getOwnedObjects({
            owner: userAccount.address,
            filter: {
                StructType: `${packageId}::group::GroupCap`,
            },
            options: {
                showContent: true,
                showType: true,
            }
        });

        const groupCap = groupCapsOfOwner.data.find((cap) => {
            if (cap.data?.content?.dataType !== "moveObject") return false;
            const fields = cap.data?.content?.fields as any;
            return fields?.group_id === groupId;
        });

        return groupCap;
    };


    const validateGroupCap = async (groupId: string): Promise<string> => {
        const groupCapOfOwner = await getOwnedGroupCapById(groupId);
        if (!groupCapOfOwner?.data?.objectId) {
            throw new InvalidGroupCapError("You don't have the required GroupCap or it's missing data");
        }
        return groupCapOfOwner.data.objectId;
    };

    const executeTransaction = async (txBuilder: () => Transaction): Promise<Transaction> => {
        validateAccount();
        try {
            const tx = txBuilder();
            return Promise.resolve(tx);
        } catch (error) {
            console.error("Error building transaction:", error);
            throw error;
        }
    };


    const groupActions: IGroupActions = {
        mintGroupAndTransfer: (metadataBlobId: string = "", tx: Transaction) => {
            return executeTransaction(() =>
                client.mintGroupAndTransfer({ metadataBlobId, _tx: tx })
            );
        },

        mintGroupCap: async (groupId: string, recipient: string) => {
            const groupCapId = await validateGroupCap(groupId);
            return executeTransaction(() =>
                client.mintGroupCap({
                    groupCapId,
                    groupId,
                    recipient,
                })
            );
        },

        addMember: async (groupId: string, member: string, customGroupCapId?: string) => {
            const groupCapId = customGroupCapId || await validateGroupCap(groupId);
            return executeTransaction(() =>
                client.addMember({
                    groupCapId,
                    groupId,
                    member,
                })
            );
        },

        removeMember: async (groupId: string, member: string) => {
            const groupCapId = await validateGroupCap(groupId);
            return executeTransaction(() =>
                client.removeMember({
                    groupCapId,
                    groupId,
                    member,
                })
            );
        },

        leaveGroup: (groupId: string, member: string) => {
            return executeTransaction(() =>
                client.leaveGroup({
                    groupId,
                    member,
                })
            );
        },

        sealApprove: (id: Uint8Array, groupId: string) => {
            return executeTransaction(() =>
                client.sealApprove({ id, groupId })
            );
        },

        validateGroupCap: validateGroupCap,


        getGroupData: async (groupId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($groupId: SuiAddress!) {
                    object(address: $groupId) {
                        asMoveObject {
                        contents {
                            json 
                            bcs
                        }
                        }
                    }
                    }
                    `),
                variables: {
                    groupId
                }
            });

            if (!res) throw new Error("No group found");
            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return GroupStruct.fromBase64(bcs!);
        },

        getMessageSnapshotData: async (messagesSnapshotId) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messagesSnapshotId: SuiAddress!) {
                    object(address: $messagesSnapshotId) {
                        asMoveObject {
                        contents {
                            json 
                            bcs
                        }
                        }
                    }
                    }
                    `),
                variables: {
                    messagesSnapshotId
                }
            });

            if (!res) throw new Error("No message snapshot found");
            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return MessagesSnapshotStruct.fromBase64(bcs!);
        },

        getGroupCapData: async (groupCapId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($groupCapId: SuiAddress!) {
                    object(address: $groupCapId) {
                        asMoveObject {
                        contents {
                            json
                            bcs
                        }
                        }
                    }
                    }
                    `),
                variables: {
                    groupCapId
                }
            });
            if (!res) throw new Error("No group cap found");
            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;
            return GroupCapStruct.fromBase64(bcs!);
        },
    };

    const messageActions: IMessageActions = {
        mintMessagesSnapshotAndTransfer: (groupId: string, metadataBlobId: string) => {
            return executeTransaction(() =>
                client.mintMessagesSnapshotAndTransfer({
                    g_id: groupId,
                    mt_b_id: metadataBlobId
                })
            );
        },

        mintMessagesSnapshotCapAndTransfer: (messagesSnapshotId: string) => {
            return executeTransaction(() =>
                client.mintMessagesSnapshotCapAndTransfer({
                    msg_snapshot_id: messagesSnapshotId
                })
            );
        },

        mintSuperMessageNoPolicyAndTransfer: (groupId: string, messageBlobId: string, auxId: Uint8Array) => {
            return executeTransaction(() =>
                client.mintSuperMessageNoPolicyAndTransfer({
                    g_id: groupId,
                    mt_b_id: messageBlobId,
                    aux_id: auxId
                })
            );
        },

        mintSuperMessageTimeLockAndTransfer: (groupId: string, messageBlobId: string, auxId: Uint8Array, timeFrom: number | bigint, timeTo: number | bigint) => {
            return executeTransaction(() =>
                client.mintSuperMessageTimeLockAndTransfer({
                    g_id: groupId,
                    mt_b_id: messageBlobId,
                    aux_id: auxId,
                    from: timeFrom,
                    to: timeTo
                })
            );
        },

        mintSuperMessageLimitedReadAndTransfer: (groupId: string, messageBlobId: string, auxId: Uint8Array, maxReads: number | bigint) => {
            return executeTransaction(() =>
                client.mintSuperMessageLimitedReadAndTransfer({
                    g_id: groupId,
                    mt_b_id: messageBlobId,
                    aux_id: auxId,
                    max: maxReads
                })
            );
        },

        mintSuperMessageFeeBasedAndTransfer: (groupId: string, messageBlobId: string, auxId: Uint8Array, fee: number | bigint, recipient: string) => {
            return executeTransaction(() =>
                client.mintSuperMessageFeeBasedAndTransfer({
                    g_id: groupId,
                    mt_b_id: messageBlobId,
                    aux_id: auxId,
                    fee: fee,
                    r: recipient
                })
            );
        },

        mintSuperMessageCompoundAndTransfer: (groupId: string, messageBlobId: string, auxId: Uint8Array, timeFrom: number | bigint, timeTo: number | bigint, maxReads: number | bigint, fee: number | bigint, recipient: string) => {
            return executeTransaction(() =>
                client.mintSuperMessageCompoundAndTransfer({
                    g_id: groupId,
                    mt_b_id: messageBlobId,
                    aux_id: auxId,
                    tf: timeFrom,
                    tt: timeTo,
                    max: maxReads,
                    fee: fee,
                    receipient: recipient
                })
            );
        },

        readMessage: (messageId: string, paymentCoinId: string) => {
            return executeTransaction(() =>
                client.readMessage({
                    msg: messageId,
                    payment: paymentCoinId
                })
            );
        },

        withdrawFees: (messageId: string) => {
            return executeTransaction(() =>
                client.withdrawFees({
                    msg: messageId
                })
            );
        },

        sealApproveSuperMessage: (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            return executeTransaction(() =>
                client.sealApproveSuperMessage({
                    id: id,
                    msg: messageId,
                    group: groupId
                })
            );
        },

        getSuperMessageData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                    object(address: $messageId) {
                        asMoveObject {
                        contents {
                            json 
                            bcs
                        }
                        }
                    }
                    }
                    `),
                variables: {
                    messageId
                }
            });

            if (!res) throw new Error("No message found");
            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return SuperMessageStruct.fromBase64(bcs!);
        },

    };

    return {
        client,
        ...groupActions,
        ...messageActions,
    };
}