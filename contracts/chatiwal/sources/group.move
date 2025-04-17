/// Group module of Chatiwal
///
/// This module defines the Group of the Chatiwal protocol, which is a
/// collection of members that can interact with each other.
module chatiwal::group;

use chatiwal::events;
use chatiwal::utils::is_prefix;
use std::string::String;
use sui::clock::Clock;
use sui::vec_set::{Self, VecSet};

// === Access Control ===

public struct GroupCap has key {
    id: UID,
    group_id: ID,
}

public struct Group has key {
    id: UID,
    member: VecSet<address>,
    metadata_blob_id: String,
}

// === Entry Functions ===

public entry fun mint_group_and_transfer(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext) {
    let g = do_mint_group(metadata_blob_id, c, ctx);
    let g_cap = do_mint_group_cap(g.id.to_inner(), c, ctx);
    transfer::share_object(g);
    transfer::transfer(g_cap, ctx.sender());
}

public entry fun mint_group_cap(
    group_cap: &GroupCap,
    g: &Group,
    recipient: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    assert!(group_cap.group_cap_has_permission_of_group(g));
    let g_cap = do_mint_group_cap(g.id.to_inner(), c, ctx);
    transfer::transfer(g_cap, recipient);
}

public entry fun add_member(group_cap: &GroupCap, g: &mut Group, member: address, c: &Clock) {
    assert!(group_cap.group_cap_has_permission_of_group(g));
    do_add_member(g, member, c);
}

public entry fun remove_member(group_cap: &GroupCap, g: &mut Group, member: address, c: &Clock) {
    assert!(group_cap.group_cap_has_permission_of_group(g));
    do_remove_member(g, member, c);
}

// === Internal Functions ===

fun do_mint_group(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext): Group {
    let g = mint_group_impl(metadata_blob_id, ctx);
    events::emit_group_minted(g.id.to_inner(), g.metadata_blob_id, c.timestamp_ms());
    g
}

fun do_mint_group_cap(group_id: ID, c: &Clock, ctx: &mut TxContext): GroupCap {
    let g_cap = mint_group_cap_impl(group_id, ctx);
    events::emit_group_cap_minted(g_cap.id.to_inner(), g_cap.group_id, c.timestamp_ms());
    g_cap
}

fun mint_group_cap_impl(g_id: ID, ctx: &mut TxContext): GroupCap {
    GroupCap {
        id: object::new(ctx),
        group_id: g_id,
    }
}

fun do_add_member(g: &mut Group, member: address, c: &Clock) {
    add_member_impl(g, member);
    events::emit_group_member_added(g.id.to_inner(), member, c.timestamp_ms());
}

fun do_remove_member(g: &mut Group, member: address, c: &Clock) {
    remove_member_impl(g, member);
    events::emit_group_member_removed(g.id.to_inner(), member, c.timestamp_ms());
}

fun add_member_impl(g: &mut Group, member: address) {
    g.member.insert(member);
}

fun remove_member_impl(g: &mut Group, member: address) {
    g.member.remove(&member);
}

fun mint_group_impl(metadata_blob_id: String, ctx: &mut TxContext): Group {
    Group {
        id: object::new(ctx),
        member: vec_set::empty(),
        metadata_blob_id: metadata_blob_id,
    }
}

public fun namespace(g: &Group): vector<u8> {
    g.id.to_bytes()
}

// === Seal Interface ===

public(package) fun approve_internal(id: vector<u8>, caller: address, g: &Group): bool {
    let namespace = namespace(g);

    if (!is_prefix(namespace, id)) {
        return false;
    };

    g.member.contains(&caller)
}

entry fun seal_approve(id: vector<u8>, g: &Group, ctx: &TxContext) {
    assert!(approve_internal(id, ctx.sender(), g), 0);
}

// === Helper Functions ===

fun group_cap_has_permission_of_group(group_cap: &GroupCap, g: &Group): bool {
    group_cap.group_id == g.id.to_inner()
}

// === Accessors ===

public fun group_get_group_id(g: &Group): ID {
    g.id.to_inner()
}

public fun group_get_group_member(g: &Group): VecSet<address> {
    g.member
}

public fun group_get_group_metadata_blob_id(g: &Group): String {
    g.metadata_blob_id
}

public fun group_cap_get_group_id(group_cap: &GroupCap): ID {
    group_cap.group_id
}

public fun group_cap_get_id(group_cap: &GroupCap): ID {
    group_cap.id.to_inner()
}
