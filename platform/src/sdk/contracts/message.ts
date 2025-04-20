import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, RawTransactionArgument } from './utils'; // Assuming utils/index.ts exists
import {
    SUI_CLOCK_OBJECT_ID,
    MOVE_STDLIB_ADDRESS,
    SUI_FRAMEWORK_ADDRESS,
} from '@mysten/sui/utils';

export type ObjectId = string;
export type Address = string;

export const MessageOwnerCap = bcs.struct("MessageOwnerCap", {
    id: bcs.Address, // Assuming UID maps to Address/ID
    msg_id: bcs.Address, // Assuming ID maps to Address/ID
});

export const MessagesSnapshot = bcs.struct("MessagesSnapshot", {
    id: bcs.Address,
    group_id: bcs.Address,
    messages_blob_id: bcs.String,
});

export const MessagesSnapshotCap = bcs.struct("MessagesSnapshotCap", {
    id: bcs.Address,
    messages_snapshot_id: bcs.Address,
});

/**
 * Error constants matching the Move module
 */
export const MessageErrorCodes = {
    ETimeLockTooEarly: 2001,
    ETimeLockExpired: 2002,
    EMaxReadsReached: 2003,
    EInsufficientPayment: 2004,
    EAlreadyPaid: 2005,
    ENotMessageOwner: 2006,
    ENoFeesToWithdraw: 2007,
    ESealApprovalFailed: 2008,
    ENotMessageRecipient: 2009,
    ENotMatch: 2010,
} as const;

// Define common option types
interface BaseOptions {
    arguments: RawTransactionArgument<any>[];
    typeArgs?: string[];
}

interface CoinTypeOptions extends BaseOptions {
    typeArgs: [coinType: string];
}

/**
 * Initialize the message module with the package ID
 * @param packageId The ID of the deployed Chatiwal package
 * @returns Object with all message module functions
 */
export function init(packageId: ObjectId) {

    // --- Entry Functions ---

    /**
     * Mint a MessagesSnapshot and transfer it to the sender.
     */
    function mint_messages_snapshot_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,    // ID
            mt_b_id: RawTransactionArgument<string>, // String
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_messages_snapshot_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Mint a MessagesSnapshotCap and transfer it to the sender.
     */
    function mint_messages_snapshot_cap_and_transfer(options: {
        arguments: [
            msg_snapshot_id: RawTransactionArgument<ObjectId>, // ID
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`, // msg_snapshot_id
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_messages_snapshot_cap_and_transfer`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Mint a SuperMessageNoPolicy, share it, and transfer owner cap to sender.
     */
    function mint_super_message_no_policy_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,    // ID
            mt_b_id: RawTransactionArgument<string>, // String
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_super_message_no_policy_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Mint a SuperMessageTimeLock, share it, and transfer owner cap to sender.
     */
    function mint_super_message_time_lock_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,        // ID
            mt_b_id: RawTransactionArgument<string>,       // String
            from: RawTransactionArgument<bigint | number>, // u64
            to: RawTransactionArgument<bigint | number>,   // u64
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `u64`,                                      // from
            `u64`,                                      // to
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_super_message_time_lock_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Mint a SuperMessageLimitedRead, share it, and transfer owner cap to sender.
     */
    function mint_super_message_limited_read_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,       // ID
            mt_b_id: RawTransactionArgument<string>,      // String
            max: RawTransactionArgument<bigint | number>, // u64
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `u64`,                                      // max
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_super_message_limited_read_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Mint a SuperMessageFeeBased, share it, and transfer owner cap to sender.
     */
    function mint_super_message_fee_based_and_transfer(options: CoinTypeOptions & {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,          // ID
            mt_b_id: RawTransactionArgument<string>,       // String
            fee: RawTransactionArgument<bigint | number>,  // u64
            r: RawTransactionArgument<Address>,            // address
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `u64`,                                      // fee
            `address`,                                  // r (recipient)
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_super_message_fee_based_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Mint a SuperMessageCompound, share it, and transfer owner cap to sender.
     */
    function mint_super_message_compound_and_transfer(options: CoinTypeOptions & {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,          // ID
            mt_b_id: RawTransactionArgument<string>,       // String
            tf: RawTransactionArgument<bigint | number>,   // u64 (time_from)
            tt: RawTransactionArgument<bigint | number>,   // u64 (time_to)
            max: RawTransactionArgument<bigint | number>,  // u64 (max_reads)
            fee: RawTransactionArgument<bigint | number>,  // u64
            recipient: RawTransactionArgument<Address>,    // address
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `u64`,                                      // tf
            `u64`,                                      // tt
            `u64`,                                      // max
            `u64`,                                      // fee
            `address`,                                  // recipient
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::mint_super_message_compound_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Read a message with no policy.
     */
    function read_message_no_policy(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessageNoPolicy
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::message::SuperMessageNoPolicy`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                 // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::read_message_no_policy`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Read a time-locked message.
     */
    function read_message_time_lock(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessageTimeLock
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::message::SuperMessageTimeLock`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                 // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::read_message_time_lock`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Read a limited-read message.
     */
    function read_message_limited_read(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessageLimitedRead
        ]
    }) {
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessageLimitedRead`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                       // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::read_message_limited_read`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Read a fee-based message.
     */
    function read_message_fee_based(options: CoinTypeOptions & {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessageFeeBased<CoinType>
            p: RawTransactionArgument<ObjectId>,   // Coin<CoinType> (Payment Coin)
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessageFeeBased<${coinType}>`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::coin::Coin<${coinType}>`,                      // p
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                                 // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::read_message_fee_based`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Read a compound message.
     */
    function read_message_compound(options: CoinTypeOptions & {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessageCompound<CoinType>
            p: RawTransactionArgument<ObjectId>,   // Coin<CoinType> (Payment Coin)
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessageCompound<${coinType}>`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::coin::Coin<${coinType}>`,                      // p
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                                 // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::read_message_compound`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Withdraw collected fees from a SuperMessageFeeBased.
     */
    function withdraw_fees(options: CoinTypeOptions & {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessageFeeBased<CoinType>
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessageFeeBased<${coinType}>`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                                 // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::withdraw_fees`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Withdraw collected fees from a SuperMessageCompound.
     */
    function withdraw_fees_compound(options: CoinTypeOptions & {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessageCompound<CoinType>
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessageCompound<${coinType}>`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                                  // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::withdraw_fees_compound`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Seal approve for SuperMessageTimeLock.
     */
    function seal_approve_super_message_time_lock(options: {
        arguments: [
            id: RawTransactionArgument<Uint8Array>, // vector<u8>
            msg: RawTransactionArgument<ObjectId>,    // &SuperMessageTimeLock
            group: RawTransactionArgument<ObjectId>,  // &Group
        ]
    }) {
        const moveArgsTypes = [
            `vector<u8>`,                                               // id
            `&${packageId}::message::SuperMessageTimeLock`,   // msg
            `&${packageId}::group::Group`,                            // group
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,                   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::seal_approve_super_message_time_lock`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Seal approve for SuperMessageLimitedRead.
     */
    function seal_approve_super_message_limited_read(options: {
        arguments: [
            id: RawTransactionArgument<Uint8Array>, // vector<u8>
            msg: RawTransactionArgument<ObjectId>,    // &SuperMessageLimitedRead
            group: RawTransactionArgument<ObjectId>,  // &Group
        ]
    }) {
        const moveArgsTypes = [
            `vector<u8>`,                                                 // id
            `&${packageId}::message::SuperMessageLimitedRead`,  // msg
            `&${packageId}::group::Group`                              // group
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::seal_approve_super_message_limited_read`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Seal approve for SuperMessageFeeBased.
     */
    function seal_approve_super_message_fee_based(options: CoinTypeOptions & {
        arguments: [
            id: RawTransactionArgument<Uint8Array>, // vector<u8>
            msg: RawTransactionArgument<ObjectId>,    // &SuperMessageFeeBased<CoinType>
            group: RawTransactionArgument<ObjectId>,  // &Group
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `vector<u8>`,                                                                   // id
            `&${packageId}::message::SuperMessageFeeBased<${coinType}>`, // msg
            `&${packageId}::group::Group`,                                                // group
            ];
            return (tx: Transaction) =>
                tx.moveCall({
                    target: `${ packageId }:: message:: seal_approve_super_message_fee_based`,
                    arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                    typeArguments: options.typeArgs,
                });
        }

    /**
     * Seal approve for SuperMessageCompound.
     */
    function seal_approve_super_message_compound(options: CoinTypeOptions & {
        arguments: [
            id: RawTransactionArgument<Uint8Array>, // vector<u8>
            msg: RawTransactionArgument<ObjectId>,    // &SuperMessageCompound<CoinType>
            group: RawTransactionArgument<ObjectId>,  // &Group
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `vector<u8>`,                                                                     // id
            `&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `, // msg
            `&${ packageId}::group::Group`,                                                  // group
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${ packageId }:: message:: seal_approve_super_message_compound`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    // --- View Functions (Transaction Builders) ---
    // Use these if you need the result within a transaction sequence.
    // Otherwise, prefer direct RPC calls (getObject) for reading state.

    /**
     * Get the current number of readers for a limited-read message.
     */
    function get_current_reader(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessageLimitedRead
        ]
    }) {
        const moveArgsTypes = [
            `&${ packageId }:: message:: SuperMessageLimitedRead`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${ packageId }:: message:: get_current_reader`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Get the total collected fees for a fee-based message.
     */
    function get_collected_fees(options: CoinTypeOptions & {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessageFeeBased<CoinType>
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${ packageId }:: message:: get_collected_fees`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Get the total collected fees for a compound message.
     */
    function get_collected_fees_compound(options: CoinTypeOptions & {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessageCompound<CoinType>
        ]
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [
            `&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${ packageId }:: message:: get_collected_fees_compound`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: options.typeArgs,
            });
    }

    /**
     * Get the remaining number of reads for a limited-read message.
     */
    function get_remaining_reads(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessageLimitedRead
        ]
    }) {
        const moveArgsTypes = [
            `&${ packageId }:: message:: SuperMessageLimitedRead`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${ packageId }:: message:: get_remaining_reads`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    /**
     * Check if a time-locked message is readable at a given timestamp.
     */
    function is_readable_by_time(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>,         // &SuperMessageTimeLock
            ts: RawTransactionArgument<bigint | number>, // u64
        ]
    }) {
        const moveArgsTypes = [
            `&${ packageId }:: message:: SuperMessageTimeLock`,
            `u64`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${ packageId }:: message:: is_readable_by_time`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    // --- Accessors ---

    /**
     * Get the ID of a MessageOwnerCap.
     */
    function message_cap_get_id(options: {
        arguments: [msg_cap: RawTransactionArgument<ObjectId>] // &MessageOwnerCap
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessageOwnerCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_cap_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the message ID associated with a MessageOwnerCap.
     */
    function message_cap_get_message_id(options: {
         arguments: [msg_cap: RawTransactionArgument<ObjectId>] // &MessageOwnerCap
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessageOwnerCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_cap_get_message_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the ID of a MessagesSnapshotCap.
     */
    function message_snapshot_cap_get_id(options: {
        arguments: [msg_snapshot_cap: RawTransactionArgument<ObjectId>] // &MessagesSnapshotCap
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessagesSnapshotCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_snapshot_cap_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the MessagesSnapshot ID associated with a MessagesSnapshotCap.
     */
    function message_snapshot_cap_get_messages_snapshot_id(options: {
        arguments: [msg_snapshot_cap: RawTransactionArgument<ObjectId>] // &MessagesSnapshotCap
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessagesSnapshotCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_snapshot_cap_get_messages_snapshot_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the ID of a MessagesSnapshot.
     */
    function message_snapshot_get_id(options: {
        arguments: [msg_snapshot: RawTransactionArgument<ObjectId>] // &MessagesSnapshot
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessagesSnapshot`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_snapshot_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the group ID associated with a MessagesSnapshot.
     */
    function message_snapshot_get_group_id(options: {
        arguments: [msg_snapshot: RawTransactionArgument<ObjectId>] // &MessagesSnapshot
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessagesSnapshot`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_snapshot_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the messages blob ID from a MessagesSnapshot.
     */
    function message_snapshot_get_messages_blob_id(options: {
        arguments: [msg_snapshot: RawTransactionArgument<ObjectId>] // &MessagesSnapshot
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: MessagesSnapshot`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_snapshot_get_messages_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the ID of a SuperMessageNoPolicy.
     */
    function message_no_policy_get_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageNoPolicy
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageNoPolicy`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_no_policy_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the group ID of a SuperMessageNoPolicy.
     */
    function message_no_policy_get_group_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageNoPolicy
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageNoPolicy`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_no_policy_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the message blob ID of a SuperMessageNoPolicy.
     */
    function message_no_policy_get_message_blob_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageNoPolicy
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageNoPolicy`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_no_policy_get_message_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the owner address of a SuperMessageNoPolicy.
     */
    function message_no_policy_get_owner(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageNoPolicy
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageNoPolicy`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_no_policy_get_owner`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the ID of a SuperMessageLimitedRead.
     */
    function message_limit_read_get_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageLimitedRead
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageLimitedRead`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_limit_read_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the group ID of a SuperMessageLimitedRead.
     */
    function message_limit_read_get_group_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageLimitedRead
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageLimitedRead`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_limit_read_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the message blob ID of a SuperMessageLimitedRead.
     */
    function message_limit_read_get_message_blob_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageLimitedRead
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageLimitedRead`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_limit_read_get_message_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the LimitedReadPolicy of a SuperMessageLimitedRead.
     */
    function message_limit_read_get_policy(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageLimitedRead
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageLimitedRead`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_limit_read_get_policy`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the owner address of a SuperMessageLimitedRead.
     */
    function message_limit_read_get_owner(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageLimitedRead
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageLimitedRead`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_limit_read_get_owner`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the set of readers for a SuperMessageLimitedRead.
     */
    function message_limit_read_get_readers(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageLimitedRead
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageLimitedRead`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_limit_read_get_readers`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the ID of a SuperMessageTimeLock.
     */
    function message_time_lock_get_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageTimeLock
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageTimeLock`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_time_lock_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the group ID of a SuperMessageTimeLock.
     */
    function message_time_lock_get_group_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageTimeLock
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageTimeLock`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_time_lock_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the message blob ID of a SuperMessageTimeLock.
     */
    function message_time_lock_get_message_blob_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageTimeLock
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageTimeLock`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_time_lock_get_message_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the TimeLockPolicy of a SuperMessageTimeLock.
     */
    function message_time_lock_get_policy(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageTimeLock
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageTimeLock`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_time_lock_get_policy`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the owner address of a SuperMessageTimeLock.
     */
    function message_time_lock_get_owner(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageTimeLock
    }) {
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageTimeLock`];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_time_lock_get_owner`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    /**
     * Get the ID of a SuperMessageFeeBased.
     */
    function message_fee_based_get_id(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the group ID of a SuperMessageFeeBased.
     */
    function message_fee_based_get_group_id(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the message blob ID of a SuperMessageFeeBased.
     */
    function message_fee_based_get_message_blob_id(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_message_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the FeeBasedPolicy of a SuperMessageFeeBased.
     */
    function message_fee_based_get_policy(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_policy`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the owner address of a SuperMessageFeeBased.
     */
    function message_fee_based_get_owner(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_owner`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the set of readers for a SuperMessageFeeBased.
     */
    function message_fee_based_get_readers(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_readers`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the collected fee balance of a SuperMessageFeeBased.
     */
    function message_fee_based_get_fee_collected(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageFeeBased<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageFeeBased < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_fee_based_get_fee_collected`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the ID of a SuperMessageCompound.
     */
    function message_compound_get_id(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the group ID of a SuperMessageCompound.
     */
    function message_compound_get_group_id(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the message blob ID of a SuperMessageCompound.
     */
    function message_compound_get_message_blob_id(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_message_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the TimeLockPolicy of a SuperMessageCompound.
     */
    function message_compound_get_time_lock(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_time_lock`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the LimitedReadPolicy of a SuperMessageCompound.
     */
    function message_compound_get_limited_read(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_limited_read`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the FeeBasedPolicy of a SuperMessageCompound.
     */
    function message_compound_get_fee_policy(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_fee_policy`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the owner address of a SuperMessageCompound.
     */
    function message_compound_get_owner(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_owner`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the collected fee balance of a SuperMessageCompound.
     */
    function message_compound_get_fee_collected(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_fee_collected`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the set of readers for a SuperMessageCompound.
     */
    function message_compound_get_readers(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_readers`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }

    /**
     * Get the remaining reads for a SuperMessageCompound.
     */
    function message_compound_get_remaining_reads(options: CoinTypeOptions & {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessageCompound<CoinType>
    }) {
        const coinType = options.typeArgs[0];
        const moveArgsTypes = [`&${ packageId }:: message:: SuperMessageCompound < ${ coinType } > `];
        return (tx: Transaction) => tx.moveCall({
            target: `${ packageId }:: message:: message_compound_get_remaining_reads`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: options.typeArgs,
        });
    }


    return {
        // Entry functions
        mint_messages_snapshot_and_transfer,
        mint_messages_snapshot_cap_and_transfer,
        mint_super_message_no_policy_and_transfer,
        mint_super_message_time_lock_and_transfer,
        mint_super_message_limited_read_and_transfer,
        mint_super_message_fee_based_and_transfer,
        mint_super_message_compound_and_transfer,
        read_message_no_policy,
        read_message_time_lock,
        read_message_limited_read,
        read_message_fee_based,
        read_message_compound,
        withdraw_fees,
        withdraw_fees_compound,
        seal_approve_super_message_time_lock,
        seal_approve_super_message_limited_read,
        seal_approve_super_message_fee_based,
        seal_approve_super_message_compound,

        // View/Helper functions
        get_current_reader,
        get_collected_fees,
        get_collected_fees_compound,
        get_remaining_reads,
        is_readable_by_time,

        // Accessors
        message_cap_get_id,
        message_cap_get_message_id,
        message_snapshot_cap_get_id,
        message_snapshot_cap_get_messages_snapshot_id,
        message_snapshot_get_id,
        message_snapshot_get_group_id,
        message_snapshot_get_messages_blob_id,
        message_no_policy_get_id,
        message_no_policy_get_group_id,
        message_no_policy_get_message_blob_id,
        message_no_policy_get_owner,
        message_limit_read_get_id,
        message_limit_read_get_group_id,
        message_limit_read_get_message_blob_id,
        message_limit_read_get_policy,
        message_limit_read_get_owner,
        message_limit_read_get_readers,
        message_time_lock_get_id,
        message_time_lock_get_group_id,
        message_time_lock_get_message_blob_id,
        message_time_lock_get_policy,
        message_time_lock_get_owner,
        message_fee_based_get_id,
        message_fee_based_get_group_id,
        message_fee_based_get_message_blob_id,
        message_fee_based_get_policy,
        message_fee_based_get_owner,
        message_fee_based_get_readers,
        message_fee_based_get_fee_collected,
        message_compound_get_id,
        message_compound_get_group_id,
        message_compound_get_message_blob_id,
        message_compound_get_time_lock,
        message_compound_get_limited_read,
        message_compound_get_fee_policy,
        message_compound_get_owner,
        message_compound_get_fee_collected,
        message_compound_get_readers,
        message_compound_get_remaining_reads
    };
}