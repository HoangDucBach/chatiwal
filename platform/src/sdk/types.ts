import { SuiClient } from "@mysten/sui/client";
import { ClientWithExtensions } from "@mysten/sui/experimental";

/**
 * Configuration for the Chatiwal package.
 */
export interface ChatiwalPackageConfig {
    chatiwalId: string;
}

/**
 * Represents a group capability that grants administrative permissions over a group.
 */
export interface GroupCap {
    id: string;
    groupId: string;
}

/**
 * Represents a group of members that can interact with each other in the Chatiwal protocol.
 */
export interface Group {
    id: string;
    members: string[]; // Array of member addresses
    metadataBlobId: string;
}
/**
 * Options for Group operations.
 */
export interface GroupOptions {
    /** Optional timestamp for operations */
    timestamp?: number;
    /** Custom metadata to associate with the operation */
    metadata?: Record<string, any>;
    /** Whether to emit events for group operations */
    emitEvents?: boolean;
}

/**
 * Options for GroupCap operations.
 */
export interface GroupCapOptions {
    /** Optional timestamp for capability operations */
    timestamp?: number;
    /** Permission level for the capability */
    permissionLevel?: 'admin' | 'moderator' | 'member';
    /** Expiration time for the capability, if applicable */
    expiresAt?: number;
}

/**
 * Represents a message in the Chatiwal protocol.
 */
export interface Message {
    id: string;
    groupId: string;
    messageBlobId: string;
    owner: string;
}

/**
 * Represents a time-locked message policy configuration.
 */
export interface TimeLockPolicy {
    from: number; // Timestamp from which message is readable
    to: number;   // Timestamp until which message is readable (0 for never expires)
}

/**
 * Represents a limited-read message policy configuration.
 */
export interface LimitedReadPolicy {
    maxReads: number;
    currentReads?: number;
}

/**
 * Represents a fee-based message policy configuration.
 */
export interface FeeBasedPolicy<T = string> {
    feeAmount: number;
    recipient: string;
    coinType: T;
}

/**
 * Represents a capability to own and manage a message.
 */
export interface MessageOwnerCap {
    id: string;
    messageId: string;
}

/**
 * Represents a snapshot of messages for a group.
 */
export interface MessagesSnapshot {
    id: string;
    groupId: string;
    messagesBlobId: string;
}

/**
 * Options for creating a message.
 */
export interface MessageCreateOptions {
    /** Optional timestamp for message creation */
    timestamp?: number;
    /** Custom metadata to associate with the message */
    metadata?: Record<string, any>;
    /** Whether this message should be stored permanently */
    persistent?: boolean;
}

/**
 * Options for time-locked message creation.
 */
export interface TimeLockMessageOptions extends MessageCreateOptions {
    /** Timestamp from which the message becomes readable */
    availableFrom: number;
    /** Timestamp until which the message remains readable (0 for never expires) */
    availableUntil: number;
}

/**
 * Options for limited-read message creation.
 */
export interface LimitedReadMessageOptions extends MessageCreateOptions {
    /** Maximum number of times the message can be read */
    maxReads: number;
}

/**
 * Options for fee-based message creation.
 */
export interface FeeBasedMessageOptions<T = string> extends MessageCreateOptions {
    /** Amount required to pay for reading the message */
    feeAmount: number;
    /** Address of the recipient who will receive the fees */
    recipient: string;
    /** Type of coin to be used for the fee */
    coinType: T;
}

/**
 * Options for compound message creation with multiple policies.
 */
export interface CompoundMessageOptions<T = string> extends MessageCreateOptions {
    /** Time lock configuration */
    timeLock: {
        availableFrom: number;
        availableUntil: number;
    };
    /** Limited read configuration */
    limitedRead: {
        maxReads: number;
    };
    /** Fee-based configuration */
    feeBased: {
        feeAmount: number;
        recipient: string;
        coinType: T;
    };
}

/**
 * Options for message reading operations.
 */
export interface MessageReadOptions {
    /** Optional payment for fee-based messages */
    payment?: any;
    /** Current timestamp for validation */
    timestamp?: number;
    /** Reader's address */
    reader?: string;
}

type SuiClientConfig = {
    suiClient: SuiClient;
};

type ChatiwalNetowrkOrPackageConfig =
    | {
        network: string;
        packageConfig?: never;
    }
    | {
        packageConfig: ChatiwalPackageConfig;
        network?: never;
    };
export type ChatiwalClientConfig = ChatiwalNetowrkOrPackageConfig & SuiClientConfig;