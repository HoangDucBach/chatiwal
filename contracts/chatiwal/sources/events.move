module chatiwal::events;

use std::string::String;
use sui::event::emit;

// === Events ===

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

// Added MessageRead event from message module
public struct MessageRead has copy, drop {
    msg_id: ID,
    reader: address,
    fee_paid: u64,
    timestamp: u64,
}

// Added event for fee withdrawal operations
public struct FeesWithdrawn has copy, drop {
    msg_id: ID,
    owner: address,
    amount: u64,
    timestamp: u64,
}

// === Emit Events ===

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

// New function to emit MessageRead event
public(package) fun emit_message_read(msg_id: ID, reader: address, fee_paid: u64, timestamp: u64) {
    let event = MessageRead {
        msg_id,
        reader,
        fee_paid,
        timestamp,
    };
    emit(event);
}

// New function to emit FeesWithdrawn event
public(package) fun emit_fees_withdrawn(msg_id: ID, owner: address, amount: u64, timestamp: u64) {
    let event = FeesWithdrawn {
        msg_id,
        owner,
        amount,
        timestamp,
    };
    emit(event);
}
