/// Events for the Chatiwal module.
module chatiwal::events;

use std::string::String;
use sui::event::emit;

// === Events ===

public struct GroupMinted has copy, drop {
    id: ID,
    metadata_blob_id: String,
    timestamp: u64,
}

public struct GroupCapMinted has copy, drop {
    id: ID,
    group_id: ID,
    timestamp: u64,
}

public struct GroupMemberAdded has copy, drop {
    group_id: ID,
    member: address,
    timestamp: u64,
}

public struct GroupMemberRemoved has copy, drop {
    group_id: ID,
    member: address,
    timestamp: u64,
}

public struct GroupMemberLeft has copy, drop {
    group_id: ID,
    member: address,
    timestamp: u64,
}

public struct GroupMetadataUpdated has copy, drop {
    group_id: ID,
    metadata_blob_id: String,
    timestamp: u64,
}

public struct SuperMessageCapMinted has copy, drop {
    id: ID,
    super_message_id: ID,
}

public struct MessagesSnapshotCapMinted has copy, drop {
    id: ID,
    messages_snapshot_id: ID,
}

public struct SuperMessageMinted has copy, drop {
    id: ID,
    group_id: ID,
    timestamp: u64,
}

public struct MessagesSnapshotMinted has copy, drop {
    id: ID,
    group_id: ID,
    messages_blob_id: String,
    timestamp: u64,
}

public struct MessageRead has copy, drop {
    msg_id: ID,
    reader: address,
    fee_paid: u64,
    timestamp: u64,
}

public struct FeesWithdrawn has copy, drop {
    msg_id: ID,
    receipent: address,
    amount: u64,
    timestamp: u64,
}

// === Emit Events ===

public(package) fun emit_group_minted(id: ID, metadata_blob_id: String, timestamp: u64) {
    let event = GroupMinted {
        id,
        metadata_blob_id,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_group_cap_minted(id: ID, group_id: ID, timestamp: u64) {
    let event = GroupCapMinted {
        id,
        group_id,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_group_member_added(group_id: ID, member: address, timestamp: u64) {
    let event = GroupMemberAdded {
        group_id,
        member,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_group_member_removed(group_id: ID, member: address, timestamp: u64) {
    let event = GroupMemberRemoved {
        group_id,
        member,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_group_member_left(group_id: ID, member: address, timestamp: u64) {
    let event = GroupMemberLeft {
        group_id,
        member,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_group_metadata_updated(
    group_id: ID,
    metadata_blob_id: String,
    timestamp: u64,
) {
    let event = GroupMetadataUpdated {
        group_id,
        metadata_blob_id,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_super_message_cap_minted(id: ID, super_message_id: ID) {
    let event = SuperMessageCapMinted {
        id,
        super_message_id,
    };
    emit(event);
}

public(package) fun emit_messages_snapshot_cap_minted(id: ID, messages_snapshot_id: ID) {
    let event = MessagesSnapshotCapMinted {
        id,
        messages_snapshot_id,
    };
    emit(event);
}

public(package) fun emit_super_message_minted(id: ID, group_id: ID, timestamp: u64) {
    let event = SuperMessageMinted {
        id,
        group_id,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_messages_snapshot_minted(
    id: ID,
    group_id: ID,
    messages_blob_id: String,
    timestamp: u64,
) {
    let event = MessagesSnapshotMinted {
        id,
        group_id,
        messages_blob_id,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_message_read(msg_id: ID, reader: address, fee_paid: u64, timestamp: u64) {
    let event = MessageRead {
        msg_id,
        reader,
        fee_paid,
        timestamp,
    };
    emit(event);
}

public(package) fun emit_fees_withdrawn(
    msg_id: ID,
    receipent: address,
    amount: u64,
    timestamp: u64,
) {
    let event = FeesWithdrawn {
        msg_id,
        receipent,
        amount,
        timestamp,
    };
    emit(event);
}
