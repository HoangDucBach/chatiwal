import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, RawTransactionArgument } from './utils'; // Assuming utils/index.ts exists
import {
    SUI_CLOCK_OBJECT_ID,
    MOVE_STDLIB_ADDRESS,
    SUI_FRAMEWORK_ADDRESS,
} from '@mysten/sui/utils';
import { Address, ChatiwalClientConfig, ObjectId } from '..';


export const GroupCapStruct = bcs.struct("GroupCap", {
    id: bcs.Address,
    group_id: bcs.Address,
});

export const GroupStruct = bcs.struct("Group", {
    id: bcs.Address,
    members: bcs.vector(bcs.Address),
    metadata_blob_id: bcs.String,
});



export const RegistryStruct = bcs.struct("Registry", {
    id: bcs.Address,
    user_groups: bcs.map(bcs.Address, bcs.vector(bcs.Address))
});

/**
 * Error constants matching the Move module
 */
export const GroupErrorCodes = { // Renamed from ErrorCodes for clarity
    EInvalidGroupCap: 1000,
    EMemberAlreadyExists: 1001,
    EMemberNotExists: 1002,
    ESealNotApproved: 1004, // Assuming this corresponds to ESealApprovalFailed in Move
};

/**
 * Initialize the group module with the package ID
 * @param packageId The ID of the deployed Chatiwal package
 * @param config Optional configuration for the client
 * @returns Object with all group module functions
 */
function init(packageId: ObjectId, config?: ChatiwalClientConfig) {
    /**
     * Mint a group and transfer it to the sender.
     */
    function mint_group_and_transfer(options: {
        arguments: [
            metadataBlobId: RawTransactionArgument<string>,
        ]
    }) {
        const moveArgsTypes = [
            `${packageId}::group::Registry`,
            `${MOVE_STDLIB_ADDRESS}::string::String`, // metadataBlobId
            `&${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,   // c
        ];
        const args = [
            REGISTRY_OBJECT_ID,
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::mint_group_and_transfer`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: [] // No type arguments for this function
            });
    }

    function mint_group_cap(options: {
        arguments: [
            group_cap_id: RawTransactionArgument<ObjectId>,
            group_id: RawTransactionArgument<ObjectId>,
            recipient: RawTransactionArgument<Address>,
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::GroupCap`,     // group_cap (as reference)
            `&${packageId}::group::Group`,    // group_id (as reference)
            `address`,                              // recipient
            `&${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,// c - assuming needed
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID, // Assuming clock is needed
        ];

        // Placeholder - Adjust target and args if this function exists in Move
        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::mint_group_cap`, // Adjust function name if needed
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: []
            });
        // If the function is meant to transfer an *existing* cap, the signature would be different.
    }

    /**
     * Add a member to a group. Requires GroupCap.
     */
    function add_member(options: {
        arguments: [
            groupCapId: RawTransactionArgument<ObjectId>, // ID of GroupCap object
            groupId: RawTransactionArgument<ObjectId>,    // ID of Group object
            member: RawTransactionArgument<Address>,      // Address of member to add
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::GroupCap`,       // groupCapId (as reference to the cap object)
            `&${packageId}::group::Registry`,      // groupId (as reference to the group object)
            `&mut ${packageId}::group::Group`,      // groupId (as mutable reference to group object)
            `address`,                              // member
            `&${SUI_FRAMEWORK_ADDRESS}::clock::Clock`, // c
        ];
        const args = [
            options.arguments[0], // groupCapId
            REGISTRY_OBJECT_ID,
            options.arguments[1], // groupId
            options.arguments[2], // member
            SUI_CLOCK_OBJECT_ID,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::add_member`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Remove a member from a group. Requires GroupCap.
     */
    function remove_member(options: {
        arguments: [
            groupCapId: RawTransactionArgument<ObjectId>, // ID of GroupCap object
            groupId: RawTransactionArgument<ObjectId>,    // ID of Group object
            member: RawTransactionArgument<Address>,      // Address of member to remove
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::GroupCap`,       // groupCapId (as reference)
            `&${packageId}::group::Registry`,      // groupId (as reference)
            `&mut ${packageId}::group::Group`,      // groupId (as mutable reference)
            `address`,                              // member
            `&${SUI_FRAMEWORK_ADDRESS}::clock::Clock`, // c
        ];
        const args = [
            options.arguments[0], // groupCapId
            REGISTRY_OBJECT_ID,
            options.arguments[1], // groupId
            options.arguments[2], // member
            SUI_CLOCK_OBJECT_ID,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::remove_member`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: []
            });
    }

    function leave_group(options: {
        arguments: [
            user: RawTransactionArgument<Address>,
            group: RawTransactionArgument<ObjectId>,
        ]
    }) {
        const moveArgsTypes = [
            `&mut ${packageId}::group::Registry`, // registry
            `address`,                              // user
            `&mut ${packageId}::group::Group`,      // group (as mutable reference)
            `&${SUI_FRAMEWORK_ADDRESS}::clock::Clock`, // c
        ];
        const args = [
            REGISTRY_OBJECT_ID,
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::leave_group`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: []
            });
    }
    /**
     * Approve a seal for the given ID if the sender is a member.
     */
    function seal_approve(options: {
        arguments: [
            id: RawTransactionArgument<Uint8Array>, // vector<u8>
            group: RawTransactionArgument<ObjectId>,    // &Group (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `vector<u8>`,
            `&${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::seal_approve`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    // --- View Functions (Transaction Builders) ---

    function registry_get_user_groups(options: {
        arguments: [
            user: RawTransactionArgument<Address>, // address
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::Registry`,
            `address`, // user
        ];

        const args = [
            REGISTRY_OBJECT_ID,
            ...options.arguments,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::registry_get_user_groups`,
                arguments: normalizeMoveArguments(args, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Get group ID from the Group object.
     */
    function group_get_group_id(options: {
        arguments: [
            group: RawTransactionArgument<ObjectId>, // &Group (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::group_get_group_id`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Get the member set (vector<address>) from the Group object.
     */
    function group_get_group_member(options: {
        arguments: [
            group: RawTransactionArgument<ObjectId>, // &Group (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::group_get_group_member`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Get group metadata blob ID from the Group object.
     */
    function group_get_group_metadata_blob_id(options: {
        arguments: [
            group: RawTransactionArgument<ObjectId>, // &Group (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::group_get_group_metadata_blob_id`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Get group ID from a GroupCap object.
     */
    function group_cap_get_group_id(options: {
        arguments: [
            groupCap: RawTransactionArgument<ObjectId>, // &GroupCap (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::GroupCap`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::group_cap_get_group_id`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Get the ID of a GroupCap object itself.
     */
    function group_cap_get_id(options: {
        arguments: [
            groupCap: RawTransactionArgument<ObjectId>, // &GroupCap (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::GroupCap`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::group_cap_get_id`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Check if an address is a member of a group.
     */
    function is_member(options: {
        arguments: [
            group: RawTransactionArgument<ObjectId>, // &Group (Object ID)
            addr: RawTransactionArgument<Address>,   // address
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::Group`,
            `address`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::is_member`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    /**
     * Get the namespace of a group (likely related to its ID).
     */
    function namespace(options: {
        arguments: [
            group: RawTransactionArgument<ObjectId>, // &Group (Object ID)
        ]
    }) {
        const moveArgsTypes = [
            `&${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                target: `${packageId}::group::namespace`,
                arguments: normalizeMoveArguments(options.arguments, moveArgsTypes),
                typeArguments: []
            });
    }

    return {
        mint_group_and_transfer,
        mint_group_cap, // Kept for structural similarity, review based on Move code
        add_member,
        remove_member,
        leave_group,
        seal_approve,
        registry_get_user_groups,
        group_get_group_id,
        group_get_group_member,
        group_get_group_metadata_blob_id,
        group_cap_get_group_id,
        group_cap_get_id,
        is_member,
        namespace,
    };
}

export const initGroup = init;