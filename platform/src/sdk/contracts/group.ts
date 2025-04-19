import { bcs } from '@mysten/sui/bcs';
import { SuiTransactionBlockResponse } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments } from './utils';

import { SUI_CLOCK_OBJECT_ID, MOVE_STDLIB_ADDRESS, SUI_FRAMEWORK_ADDRESS } from '@mysten/sui/utils';

/**
 * RawTransactionArgument type definition
 * This type represents raw transaction arguments
 */
export type RawTransationArgument<T> = T;

/**
 * BCS struct definitions mapping the Move structs
 */
export const GroupCap = bcs.struct("GroupCap", {
    id: bcs.Address,
    group_id: bcs.Address,
});

export const Group = bcs.struct("Group", {
    id: bcs.Address,
    member: bcs.vector(bcs.Address),
    metadata_blob_id: bcs.String,
});

/**
 * Error constants matching the Move module
 */
export const ErrorCodes = {
    EInvalidGroupCap: 1000,
    EMemberAlreadyExists: 1001,
    EMemberNotExists: 1002,
    ESealNotApproved: 1004,
};

/**
 * Initialize the group module with the package ID
 * @param packageId The ID of the deployed package
 * @returns Object with all group module functions
 */
export function init(packageId: string) {
    /**
     * Mint a group and transfer it
     * @param metadataBlobId Metadata blob ID
     * @returns Transaction function
     */
    function mint_group_and_transfer(options: {
        arguments: [
            metadataBlobId: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${MOVE_STDLIB_ADDRESS}::string::String`,
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "mint_group_and_transfer",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                    SUI_CLOCK_OBJECT_ID,
                ], typesArgs),
            });
    }

    /**
     * Mint a group cap
     * @param groupCap Group cap object ID
     * @param group Group object ID
     * @param recipient Recipient address
     * @param clock Clock object ID
     * @returns Transaction function
     */
    function mint_group_cap(options: {
        arguments: [
            groupCap: RawTransationArgument<string>,
            group: RawTransationArgument<string>,
            recipient: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::GroupCap`,
            `${packageId}::group::Group`,
            `${MOVE_STDLIB_ADDRESS}::address::Address`,
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ]

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "mint_group_cap",
                arguments: normalizeMoveArguments(args, typesArgs),
            });
    }

    /**
     * Add a member to a group
     * @param groupCap Group cap object ID
     * @param group Group object ID
     * @param member Member address to add
     * @returns Transaction function
     */
    function add_member(options: {
        arguments: [
            groupCapId: RawTransationArgument<string>,
            groupId: RawTransationArgument<string>,
            member: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::GroupCap`,
            `${packageId}::group::Group`,
            `${MOVE_STDLIB_ADDRESS}::address::Address`,
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ]

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "add_member",
                arguments: normalizeMoveArguments(args, typesArgs),
            });
    }

    /**
     * Remove a member from a group
     * @param groupCap Group cap object ID
     * @param group Group object ID
     * @param member Member address to remove
     * @returns Transaction function
     */
    function remove_member(options: {
        arguments: [
            groupCapId: RawTransationArgument<string>,
            groupId: RawTransationArgument<string>,
            member: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::GroupCap`,
            `${packageId}::group::Group`,
            `${MOVE_STDLIB_ADDRESS}::address::Address`,
            `${SUI_FRAMEWORK_ADDRESS}::clock::Clock`,
        ];
        const args = [
            ...options.arguments,
            SUI_CLOCK_OBJECT_ID,
        ]

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "remove_member",
                arguments: normalizeMoveArguments(args, typesArgs),
            });
    }

    /**
     * Approve a seal for the given ID
     * @param id The ID to approve
     * @param group Group object ID
     * @returns Transaction function
     */
    function seal_approve(options: {
        arguments: [
            id: RawTransationArgument<Uint8Array>,
            group: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `vector<u8>`,
            `${packageId}::group::Group`,
        ];
        
        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "seal_approve",
                arguments: [
                    tx.pure.vector("u8", options.arguments[0]),
                    tx.object(options.arguments[1]),
                ],
            });
    }

    /**
     * Get group ID
     * @param group Group object
     * @returns Transaction function
     */
    function group_get_group_id(options: {
        arguments: [
            group: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "group_get_group_id",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    /**
     * Get group member set
     * @param group Group object
     * @returns Transaction function
     */
    function group_get_group_member(options: {
        arguments: [
            group: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "group_get_group_member",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    /**
     * Get group metadata blob ID
     * @param group Group object
     * @returns Transaction function
     */
    function group_get_group_metadata_blob_id(options: {
        arguments: [
            group: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "group_get_group_metadata_blob_id",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    /**
     * Get group ID from a group cap
     * @param groupCap GroupCap object
     * @returns Transaction function
     */
    function group_cap_get_group_id(options: {
        arguments: [
            groupCap: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::GroupCap`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "group_cap_get_group_id",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    /**
     * Get the ID of a group cap
     * @param groupCap GroupCap object
     * @returns Transaction function
     */
    function group_cap_get_id(options: {
        arguments: [
            groupCap: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::GroupCap`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "group_cap_get_id",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    /**
     * Check if an address is a member of a group
     * @param group Group object
     * @param addr Address to check
     * @returns Transaction function
     */
    function is_member(options: {
        arguments: [
            group: RawTransationArgument<string>,
            addr: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::Group`,
            `${MOVE_STDLIB_ADDRESS}::address::Address`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "is_member",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    /**
     * Get the namespace of a group
     * @param group Group object
     * @returns Transaction function
     */
    function namespace(options: {
        arguments: [
            group: RawTransationArgument<string>,
        ]
    }) {
        const typesArgs = [
            `${packageId}::group::Group`,
        ];

        return (tx: Transaction) =>
            tx.moveCall({
                package: packageId,
                module: "group",
                function: "namespace",
                arguments: normalizeMoveArguments([
                    ...options.arguments,
                ], typesArgs),
            });
    }

    return {
        mint_group_and_transfer,
        mint_group_cap,
        add_member,
        remove_member,
        seal_approve,
        group_get_group_id,
        group_get_group_member,
        group_get_group_metadata_blob_id,
        group_cap_get_group_id,
        group_cap_get_id,
        is_member,
        namespace,
    };
}

/**
 * Helper function to parse group from transaction response
 * @param txResponse Transaction response
 * @returns Parsed Group object
 */
export function parseGroupFromTx(txResponse: SuiTransactionBlockResponse): any {
    // Implementation would depend on the structure of the transaction response
    // This is just a placeholder for the function signature
    return null;
}

/**
 * Helper function to parse group cap from transaction response
 * @param txResponse Transaction response
 * @returns Parsed GroupCap object
 */
export function parseGroupCapFromTx(txResponse: SuiTransactionBlockResponse): any {
    // Implementation would depend on the structure of the transaction response
    // This is just a placeholder for the function signature
    return null;
}

/**
 * Helper function to check if a group cap has permission for a group
 * @param groupCap GroupCap object
 * @param group Group object
 * @returns Boolean indicating if cap has permission
 */
export function groupCapHasPermissionOfGroup(groupCap: any, group: any): boolean {
    return groupCap.group_id === group.id;
}