import { bcs, BcsType } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, RawTransactionArgument } from './utils';
import {
    SUI_CLOCK_OBJECT_ID,
    MOVE_STDLIB_ADDRESS,
    SUI_FRAMEWORK_ADDRESS,
    SUI_TYPE_ARG,
} from '@mysten/sui/utils'; // Or appropriate import path
import { Address, ObjectId } from '../types'; // Assuming types/index.ts exists
import { TimeLockPolicyStruct, LimitedReadPolicyStruct, FeeBasedPolicyStruct } from './message_policy'; // Assuming message_policy/index.ts exists

const SuiCoinType = bcs.struct('SuiCoin', {}); // Placeholder if FeeBasedPolicyStruct needs more detail

const BalanceStruct = (coinType: BcsType<any>) => bcs.struct(`Balance<${coinType.name}>`, {
    value: bcs.U64,
});

export const MessageOwnerCapStruct = bcs.struct("MessageOwnerCap", {
    id: bcs.Address, // Assuming UID maps to Address/ID (using bcs.Address for Sui's UID format)
    msg_id: bcs.Address, // Assuming ID maps to Address/ID (using bcs.Address for Sui's ID format)
});

export const MessagesSnapshotStruct = bcs.struct("MessagesSnapshot", {
    id: bcs.Address, // UID
    group_id: bcs.Address, // ID
    messages_blob_id: bcs.String,
});

export const MessagesSnapshotCapStruct = bcs.struct("MessagesSnapshotCap", {
    id: bcs.Address, // UID
    messages_snapshot_id: bcs.Address, // ID
});

// Unified SuperMessage structure
export const SuperMessageStruct = bcs.struct("SuperMessage", {
    id: bcs.Address, // UID
    group_id: bcs.Address, // ID
    aux_id: bcs.vector(bcs.u8()),
    message_blob_id: bcs.String,
    time_lock: bcs.option(TimeLockPolicyStruct),
    limited_read: bcs.option(LimitedReadPolicyStruct),
    fee_policy: bcs.option(FeeBasedPolicyStruct), // Assuming SUI coin
    owner: bcs.Address,
    fee_collected: BalanceStruct(SuiCoinType), // Balance<SUI>
    readers: bcs.vector(bcs.Address), // VecSet<address>
    created_at: bcs.U64,
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
    EPaymentNotAllowed: 2006,
    ENoFeesToWithdraw: 2007,
    ENoAccess: 2008,
    ENotMessageRecipient: 2009,
    ENotMatch: 2010,
} as const;

// Define common option types
interface BaseOptions {
    arguments: RawTransactionArgument<any>[];
}

/**
 * Initialize the message module with the package ID
 * @param packageId The ID of the deployed Chatiwal package
 * @returns Object with all message module functions
 */
function init(packageId: ObjectId) {

    // --- Entry Functions ---

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

    function mint_super_message_no_policy_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,    // ID
            mt_b_id: RawTransactionArgument<string>, // String
            aux_id: RawTransactionArgument<Uint8Array> // vector<u8>
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `vector<u8>`,                               // aux_id
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

    function mint_super_message_time_lock_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,        // ID
            mt_b_id: RawTransactionArgument<string>,       // String
            aux_id: RawTransactionArgument<Uint8Array>,    // vector<u8>
            from: RawTransactionArgument<bigint | number>, // u64
            to: RawTransactionArgument<bigint | number>,   // u64
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `vector<u8>`,                               // aux_id
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

    function mint_super_message_limited_read_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,       // ID
            mt_b_id: RawTransactionArgument<string>,      // String
            aux_id: RawTransactionArgument<Uint8Array>,   // vector<u8>
            max: RawTransactionArgument<bigint | number>, // u64
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `vector<u8>`,                               // aux_id
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


    function mint_super_message_fee_based_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,          // ID
            mt_b_id: RawTransactionArgument<string>,       // String
            aux_id: RawTransactionArgument<Uint8Array>,      // vector<u8>
            fee: RawTransactionArgument<bigint | number>,  // u64
            r: RawTransactionArgument<Address>,            // address (recipient)
            // aux_id is implicitly empty vector in Move function
        ]
    }) {
        const moveArgsTypes = [
            `${SUI_FRAMEWORK_ADDRESS}::object::ID`,     // g_id
            `${MOVE_STDLIB_ADDRESS}::string::String`,   // mt_b_id
            `vector<u8>`,                               // aux_id
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
                typeArguments: [],
            });
    }

    function mint_super_message_compound_and_transfer(options: {
        arguments: [
            g_id: RawTransactionArgument<ObjectId>,          // ID
            mt_b_id: RawTransactionArgument<string>,       // String
            aux_id: RawTransactionArgument<Uint8Array>,      // vector<u8>
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
            `vector<u8>`,                               // aux_id
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
                typeArguments: [],
            });
    }

    function read_message(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessage
            payment: RawTransactionArgument<ObjectId>, // Coin<SUI>
        ]
    }) {
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessage`,       // msg
            `${SUI_FRAMEWORK_ADDRESS}::coin::Coin<${SUI_TYPE_ARG}>`, // payment
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,           // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::read_message`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [], // Coin type SUI is inferred from Balance<SUI> in SuperMessage
            });
    }

    function withdraw_fees(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &mut SuperMessage
        ]
    }) {
        const moveArgsTypes = [
            `&mut ${packageId}::message::SuperMessage`, // msg
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::withdraw_fees`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [], // Coin type SUI is inferred
            });
    }

    function seal_approve_super_message(options: {
        arguments: [
            id: RawTransactionArgument<Uint8Array>, // vector<u8>
            msg: RawTransactionArgument<ObjectId>,    // &SuperMessage
            group: RawTransactionArgument<ObjectId>,  // &Group
        ]
    }) {
        const moveArgsTypes = [
            `vector<u8>`,                                       // id
            `&${packageId}::message::SuperMessage`,   // msg
            `&${packageId}::group::Group`,                    // group - Assuming group module exists at this path
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,           // c
            // TxContext is implicit
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
            // TxContext argument is handled by the SDK implicitly
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::seal_approve_super_message`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [],
            });
    }


    // --- Helper Functions (View functions as Transaction Builders) ---

    function get_current_reader(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessage
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::message::SuperMessage`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::get_current_reader`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    function get_collected_fees(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessage
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::message::SuperMessage`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::get_collected_fees`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [], // SUI type inferred
            });
    }

    function get_remaining_reads(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>, // &SuperMessage
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::message::SuperMessage`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::get_remaining_reads`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    function is_readable_by_time(options: {
        arguments: [
            msg: RawTransactionArgument<ObjectId>,         // &SuperMessage
            ts: RawTransactionArgument<bigint | number>, // u64
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::message::SuperMessage`,
            `u64`,
        ];
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::message::is_readable_by_time`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: [],
            });
    }

    // --- Accessors ---

    function message_cap_get_id(options: {
        arguments: [msg_cap: RawTransactionArgument<ObjectId>] // &MessageOwnerCap
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessageOwnerCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_cap_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_cap_get_message_id(options: {
        arguments: [msg_cap: RawTransactionArgument<ObjectId>] // &MessageOwnerCap
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessageOwnerCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_cap_get_message_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_snapshot_cap_get_id(options: {
        arguments: [msg_snapshot_cap: RawTransactionArgument<ObjectId>] // &MessagesSnapshotCap
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessagesSnapshotCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_snapshot_cap_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_snapshot_cap_get_messages_snapshot_id(options: {
        arguments: [msg_snapshot_cap: RawTransactionArgument<ObjectId>] // &MessagesSnapshotCap
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessagesSnapshotCap`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_snapshot_cap_get_messages_snapshot_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_snapshot_get_id(options: {
        arguments: [msg_snapshot: RawTransactionArgument<ObjectId>] // &MessagesSnapshot
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessagesSnapshot`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_snapshot_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_snapshot_get_group_id(options: {
        arguments: [msg_snapshot: RawTransactionArgument<ObjectId>] // &MessagesSnapshot
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessagesSnapshot`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_snapshot_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_snapshot_get_messages_blob_id(options: {
        arguments: [msg_snapshot: RawTransactionArgument<ObjectId>] // &MessagesSnapshot
    }) {
        const moveArgsTypes = [`&${packageId}::message::MessagesSnapshot`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_snapshot_get_messages_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    // Unified SuperMessage Accessors
    function message_get_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_group_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_group_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_message_blob_id(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_message_blob_id`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_time_lock(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_time_lock`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_limited_read(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_limited_read`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_fee_policy(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_fee_policy`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [], // SUI Type inferred
        });
    }

    function message_get_owner(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_owner`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_readers(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_readers`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [],
        });
    }

    function message_get_fee_collected(options: {
        arguments: [msg: RawTransactionArgument<ObjectId>] // &SuperMessage
    }) {
        const moveArgsTypes = [`&${packageId}::message::SuperMessage`];
        return (tx: Transaction) => tx.moveCall({
            target: `${packageId}::message::message_get_fee_collected`,
            arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
            typeArguments: [], // SUI type inferred
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
        read_message,
        withdraw_fees,
        seal_approve_super_message,

        // View/Helper functions
        get_current_reader,
        get_collected_fees,
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
        message_get_id,
        message_get_group_id,
        message_get_message_blob_id,
        message_get_time_lock,
        message_get_limited_read,
        message_get_fee_policy,
        message_get_owner,
        message_get_readers,
        message_get_fee_collected,
    };
}

export const initMessage = init;