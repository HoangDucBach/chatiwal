import { Address, ID } from "./utils";

export interface IChatiwalGroup {
    getId(): ID;
    addMember(address: Address): void
    removeMember(address: Address): void;
    getMembers(): Set<Address>;
    getMetadataBlobId(): string;
    setMetadataBlobId(blobId: string): void;
}
export interface ChatiwalGroupOptions {
    id: ID;
    metadataBlobId?: string;
}
export class ChatiwalGroup implements IChatiwalGroup {
    private id: ID;
    private members: Set<Address> = new Set();
    private metadataBlobId: string;

    constructor(options: ChatiwalGroupOptions) {
        this.id = options.id;
        this.metadataBlobId = options.metadataBlobId || "";
    }

    getId(): ID {
        return this.id;
    }

    addMember(address: Address): void {
        this.members.add(address);
    }

    removeMember(address: Address): void {
        this.members.delete(address);
    }

    getMembers(): Set<Address> {
        return this.members;
    }

    getMetadataBlobId(): string {
        return this.metadataBlobId;
    }

    setMetadataBlobId(blobId: string): void {
        this.metadataBlobId = blobId;
    }
}

// public struct GroupCap has key {
//     id: UID,
//     group_id: ID,
// }

export interface GroupCapOptions {
    id: ID;
    groupId: ID;
}

export class GroupCap {
    private id: ID;
    private groupId: ID;

    constructor(options: GroupCapOptions) {
        this.id = options.id;
        this.groupId = options.groupId;
    }

    getId(): ID {
        return this.id;
    }

    getGroupId(): ID {
        return this.groupId;
    }
}