"use client";

import { useMemo } from "react";
import { ChatiwalClient, SuperMessageFeeBased, TESTNET_CHATIWAL_PACKAGE_CONFIG } from "@/sdk";
import { ChatiwalClientConfig } from "@/sdk/types";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { InvalidGroupCapError } from "@/sdk/errors";
import { Address, ObjectId } from "@/sdk/types";
import { Transaction } from "@mysten/sui/transactions";
import { bcs, BcsType } from "@mysten/sui/bcs";
import { SuperMessageNoPolicyStruct, FeeBasedPolicyStruct, GroupStruct, LimitedReadPolicyStruct, SuperMessageCompoundStruct, SuperMessageFeeBasedStruct, SuperMessageLimitedReadStruct, TimeLockPolicyStruct, GroupCapStruct, SuperMessageTimeLockStruct } from "@/sdk/contracts";
import { CoinStruct } from "@/sdk/contracts/utils";
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';

type GroupData = typeof GroupStruct.$inferType;
type GroupCapData = typeof GroupCapStruct.$inferType;
type TimeLockPolicyData = typeof TimeLockPolicyStruct.$inferType;
type LimitedReadPolicyData = typeof LimitedReadPolicyStruct.$inferType;
type FeeBasedPolicyData = typeof FeeBasedPolicyStruct.$inferType;
type MessageLimitedReadData = typeof LimitedReadPolicyStruct.$inferType;
type SuperMessageNoPolicyData = typeof SuperMessageNoPolicyStruct.$inferType;
type SuperMessageTimeLockData = typeof SuperMessageTimeLockStruct.$inferType;
type SuperMessageLimitedReadData = typeof SuperMessageLimitedReadStruct.$inferType;
type SuperMessageFeeBasedData = typeof SuperMessageFeeBasedStruct.$inferType;
type SuperMessageCompoundData = typeof SuperMessageCompoundStruct.$inferType;
type CoinData = typeof CoinStruct.$inferType;

export interface IGroupActions {
    mintGroupAndTransfer(metadataBlobId?: string): Promise<Transaction>;
    mintGroupCap(groupId: string, recipient: string): Promise<Transaction>;
    addMember(groupId: string, member: string, groupCap?: string): Promise<Transaction>;
    removeMember(groupId: string, member: string): Promise<Transaction>;
    leaveGroup(groupId: string, member: string): Promise<Transaction>;
    sealApprove(id: Uint8Array, groupId: string): Promise<Transaction>;
    isMember(groupId: string, addr: string): Promise<boolean>;
    validateGroupCap(groupId: string): Promise<string>;
    getGroupData(groupId: string): Promise<GroupData | undefined>;
    getGroupCapData(groupCapId: string): Promise<GroupCapData | undefined>;

    [key: string]: any;
}

export interface IMessageActions {
    mintMessagesSnapshotAndTransfer(groupId: string, metadataBlobId: string): Promise<Transaction>;
    mintMessagesSnapshotCapAndTransfer(messagesSnapshotId: string): Promise<Transaction>;
    mintSuperMessageNoPolicyAndTransfer(groupId: string, metadataBlobId: string): Promise<Transaction>;
    readMessageNoPolicy(messageId: string): Promise<Transaction>;
    mintSuperMessageTimeLockAndTransfer(groupId: string, metadataBlobId: string, timeFrom: number | bigint, timeTo: number | bigint): Promise<Transaction>;
    readMessageTimeLock(messageId: string): Promise<Transaction>;
    mintSuperMessageLimitedReadAndTransfer(groupId: string, metadataBlobId: string, maxReads: number | bigint): Promise<Transaction>;
    readMessageLimitedRead(messageId: string): Promise<Transaction>;
    mintSuperMessageFeeBasedAndTransfer(groupId: string, metadataBlobId: string, fee: number | bigint, recipient: string, coinType: string): Promise<Transaction>;
    readMessageFeeBased(messageId: string, paymentCoinId: string, coinType: string): Promise<Transaction>;
    withdrawFees(messageId: string, coinType: string): Promise<Transaction>;
    mintSuperMessageCompoundAndTransfer(groupId: string, metadataBlobId: string, timeFrom: number | bigint, timeTo: number | bigint, maxReads: number | bigint, fee: number | bigint, recipient: string, coinType: string): Promise<Transaction>;
    readMessageCompound(messageId: string, paymentCoinId: string, coinType: string): Promise<Transaction>;
    withdrawFeesCompound(messageId: string, coinType: string): Promise<Transaction>;

    // === Seal Integration ===

    sealApproveSuperMessageTimeLock(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<Transaction>;
    sealApproveSuperMessageLimitedRead(id: Uint8Array, messageId: ObjectId, groupId: ObjectId): Promise<Transaction>;
    sealApproveSuperMessageFeeBased(id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string): Promise<Transaction>;
    sealApproveSuperMessageCompound(id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string): Promise<Transaction>;

    // View Functions

    getSuperMessageNoPolicyData(messageId: string): Promise<SuperMessageNoPolicyData | undefined>;
    getTimeLockPolicyData(messageId: string): Promise<TimeLockPolicyData | undefined>;
    getSuperMessageTimeLockData(messageId: string): Promise<SuperMessageTimeLockData | undefined>;
    getLimitedReadPolicyData(messageId: string): Promise<MessageLimitedReadData | undefined>;
    getSuperMessageLimitedReadData(messageId: string): Promise<SuperMessageLimitedReadData | undefined>;
    getFeeBasedPolicyData(messageId: string): Promise<FeeBasedPolicyData | undefined>;
    getSuperMessageFeeBasedData(messageId: string): Promise<SuperMessageFeeBasedData | undefined>;
    getSuperMessageCompoundData(messageId: string): Promise<SuperMessageCompoundData | undefined>;
    getCoinData(coinId: string): Promise<CoinData | undefined>;
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
    }, [suiClient]);

    if (!suiClient) {
        throw new Error("Sui client is not available");
    }

    const validateAccount = () => {
        if (!account) throw new Error("Please connect your wallet");
        return account;
    };

    const getOwnedGroupCapById = async (groupId: string) => {
        validateAccount();

        const groupCapsOfOwner = await suiClient.getOwnedObjects({
            owner: account!.address,
            filter: {
                StructType: `${client.getPackageConfig().chatiwalId}::groupId::GroupCap`,
            },
            options: {
                showContent: true,
            }
        });

        const groupCap = groupCapsOfOwner.data.find((cap) => {
            const type = cap.data?.content?.dataType;
            if (type !== "moveObject") throw new Error("Invalid type");
            const object = cap.data?.content?.fields as unknown as any;
            return object.groupId_id === groupId;
        });

        return groupCap;
    };

    const validateGroupCap = async (groupId: string) => {
        const groupCapOfOwner = await getOwnedGroupCapById(groupId);
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
            const returnValues = res.results[0].returnValues || [];
            const bytes = new Uint8Array(returnValues[0][0]);

            return processResult ? processResult(bytes) : bytes;
        } catch (error) {
            throw error;
        }
    };

    const groupIdActions: IGroupActions = {
        mintGroupAndTransfer: async (metadataBlobId: string = "") => {
            return await executeTransaction(() =>
                client.mintGroupAndTransfer({ metadataBlobId: metadataBlobId })
            );
        },

        mintGroupCap: async (groupId: string, recipient: string) => {
            const groupCapId = await validateGroupCap(groupId);
            return await executeTransaction(() =>
                client.mintGroupCap({
                    groupCapId,
                    groupId: groupId,
                    recipient,
                })
            );
        },

        addMember: async (groupId: string, member: string, customGroupCapId?: string) => {
            const groupCapId = customGroupCapId || await validateGroupCap(groupId);
            return await executeTransaction(() =>
                client.addMember({
                    groupCapId,
                    groupId: groupId,
                    member,
                })
            );
        },

        removeMember: async (groupId: string, member: string) => {
            const groupCapId = await validateGroupCap(groupId);
            return await executeTransaction(() =>
                client.removeMember({
                    groupCapId,
                    groupId: groupId,
                    member,
                })
            );
        },

        leaveGroup: async (groupId: string, member: string) => {
            return await executeTransaction(() =>
                client.leaveGroup({
                    groupId: groupId,
                    member,
                })
            );
        },

        sealApprove: async (id: Uint8Array, groupId: string) => {
            return await executeInspectTransaction(() =>
                client.sealApprove({
                    id,
                    groupId: groupId,
                })
            );
        },

        isMember: async (groupId: string, addr: string): Promise<boolean> => {
            return executeInspectTransaction(
                () => client.isMember({
                    groupId: groupId,
                    address: addr,
                }),
                (bytes) => bcs.Bool.parse(bytes)
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

        getGroupCapData: async (groupCapId) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($groupCapId: SuiAddress!) {
                        object(address: $groupCapId) {
                            asMoveObject {
                                contents {
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
        // Snapshot management
        mintMessagesSnapshotAndTransfer: async (groupId: string, metadataBlobId: string) => {
            return await executeTransaction(() =>
                client.mintMessagesSnapshotAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId
                })
            );
        },

        mintMessagesSnapshotCapAndTransfer: async (messagesSnapshotId: string) => {
            return await executeTransaction(() =>
                client.mintMessagesSnapshotCapAndTransfer({
                    msgsSnapshotId: messagesSnapshotId
                })
            );
        },

        // No Policy Messages
        mintSuperMessageNoPolicyAndTransfer: async (groupId: string, metadataBlobId: string) => {
            return await executeTransaction(() =>
                client.mintSuperMessageNoPolicyAndTransfer({
                    groupId: groupId,
                    metadataBlobId: metadataBlobId
                })
            );
        },

        readMessageNoPolicy: async (messageId: string) => {
            return await executeTransaction(() =>
                client.readMessageNoPolicy({
                    messageId: messageId
                })
            );
        },

        // Time Lock Messages
        mintSuperMessageTimeLockAndTransfer: async (
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

        readMessageTimeLock: async (messageId: string) => {
            return await executeTransaction(() =>
                client.readMessageTimeLock({
                    messageId: messageId
                })
            );
        },

        // Limited Read Messages
        mintSuperMessageLimitedReadAndTransfer: async (
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

        readMessageLimitedRead: async (messageId: string) => {
            return await executeTransaction(() =>
                client.readMessageLimitedRead({
                    messageId: messageId
                })
            );
        },

        // Fee Based Messages
        mintSuperMessageFeeBasedAndTransfer: async (
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

        readMessageFeeBased: async (messageId: string, paymentCoinId: string, coinType: string) => {
            return await executeTransaction(() =>
                client.readMessageFeeBased({
                    messageId: messageId,
                    paymentCoinId: paymentCoinId,
                    coinType: coinType
                })
            );
        },

        withdrawFees: async (messageId: string, coinType: string) => {
            return await executeTransaction(() =>
                client.withdrawFees({
                    messageId: messageId,
                    coinType: coinType
                })
            );
        },

        mintSuperMessageCompoundAndTransfer: async (
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

        readMessageCompound: async (messageId: string, paymentCoinId: string, coinType: string) => {
            return await executeTransaction(() =>
                client.readMessageCompound({
                    messageId: messageId,
                    paymentCoinId: paymentCoinId,
                    coinType: coinType
                })
            );
        },

        withdrawFeesCompound: async (messageId: string, coinType: string) => {
            return await executeTransaction(() =>
                client.withdrawFeesCompound({
                    messageId: messageId,
                    coinType: coinType
                })
            );
        },

        // === Seal Integration ===

        sealApproveSuperMessageTimeLock: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageTimeLock({
                    id,
                    messageId: messageId,
                    groupId: groupId
                })
            );
        },
        sealApproveSuperMessageLimitedRead: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageLimitedRead({
                    id,
                    messageId: messageId,
                    groupId: groupId
                })
            );
        },
        sealApproveSuperMessageFeeBased: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageFeeBased({
                    id,
                    messageId: messageId,
                    groupId: groupId,
                    coinType: coinType
                })
            );
        },
        sealApproveSuperMessageCompound: async (id: Uint8Array, messageId: ObjectId, groupId: ObjectId, coinType: string) => {
            return await executeInspectTransaction(() =>
                client.sealApproveSuperMessageCompound({
                    id,
                    messageId: messageId,
                    groupId: groupId,
                    coinType: coinType
                })
            );
        },

        // === View Functions ===

        getSuperMessageNoPolicyData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
                                    json 
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

            return res.data?.object?.asMoveObject?.contents?.json as SuperMessageNoPolicyData;
        },

        getTimeLockPolicyData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            if (!res) throw new Error("No policy found");

            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return TimeLockPolicyStruct.fromBase64(bcs!);
        },

        getSuperMessageTimeLockData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            return SuperMessageTimeLockStruct.fromBase64(bcs!);
        },

        getLimitedReadPolicyData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            if (!res) throw new Error("No policy found");

            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return LimitedReadPolicyStruct.fromBase64(bcs!);
        },

        getSuperMessageLimitedReadData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            return SuperMessageLimitedReadStruct.fromBase64(bcs!);
        },

        getFeeBasedPolicyData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            if (!res) throw new Error("No policy found");

            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return FeeBasedPolicyStruct.fromBase64(bcs!);
        },

        getSuperMessageFeeBasedData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            return SuperMessageFeeBasedStruct.fromBase64(bcs!);
        },

        getSuperMessageCompoundData: async (messageId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($messageId: SuiAddress!) {
                        object(address: $messageId) {
                            asMoveObject {
                                contents {
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

            return SuperMessageCompoundStruct.fromBase64(bcs!);
        },

        getCoinData: async (coinId: string) => {
            const res = await gqlClient.query({
                query: graphql(`
                    query ($coinId: SuiAddress!) {
                        object(address: $coinId) {
                            asMoveObject {
                                contents {
                                    bcs 
                                }
                            }
                        }
                    }
                `),
                variables: {
                    coinId
                }
            });

            if (!res) throw new Error("No coin found");

            const bcs = res.data?.object?.asMoveObject?.contents?.bcs;

            return CoinStruct.fromBase64(bcs!);
        }
    };

    return {
        client,
        ...groupIdActions,
        ...messageActions,
    };
}