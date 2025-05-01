import { MetadataGroup } from "@/libs/schema";
import { FeeBasedPolicyStruct, LimitedReadPolicyStruct, TimeLockPolicyStruct, SuperMessageStruct } from "@/sdk";

export type MediaContent = {
    id: string;
    url?: string;
    raw?: string | Uint8Array;
    mimeType: string;
};

export type TGroup = {
    id: string;
    members: Set<string>;
    metadata?: MetadataGroup;
};

export enum MessageType {
    BASE,
    SUPER_MESSAGE,
}

export type TTimeLockPolicy = typeof TimeLockPolicyStruct.$inferType;

export type TLimitedReadPolicy = typeof LimitedReadPolicyStruct.$inferType;

export type TFeeBasedPolicy = typeof FeeBasedPolicyStruct.$inferType;

type SuperMessage = typeof SuperMessageStruct.$inferType;
export type TMessage = {
    id: SuperMessage['id'];
    owner: SuperMessage['owner'];
    groupId: SuperMessage['group_id'];
    auxId: SuperMessage['aux_id'];
    blobId?: SuperMessage['message_blob_id'];
    readers: SuperMessage['readers'];
    feeCollected: SuperMessage['fee_collected'];
    timeLockPolicy?: TTimeLockPolicy | null;
    limitedReadPolicy?: TLimitedReadPolicy | null;
    feePolicy?: TFeeBasedPolicy | null;
    createdAt: SuperMessage['created_at'];
    content: Uint8Array
};

export function hasTimeLock(msg: TMessage): msg is TMessage & { timeLockPolicy: TTimeLockPolicy } {
    return msg.timeLockPolicy !== undefined;
}

export function hasLimitedRead(msg: TMessage): msg is TMessage & { limitedReadPolicy: TLimitedReadPolicy } {
    return msg.limitedReadPolicy !== undefined;
}

export function hasFeePolicy(msg: TMessage): msg is TMessage & { feePolicy: TFeeBasedPolicy } {
    return msg.feePolicy !== undefined;
}

export function getMessagePolicyType(msg: TMessage): MessageType {
    const hasTL = hasTimeLock(msg);
    const hasLR = hasLimitedRead(msg);
    const hasFP = hasFeePolicy(msg);

    if (hasTL || hasLR || hasFP) return MessageType.SUPER_MESSAGE

    return MessageType.BASE;

}