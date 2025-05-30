/// Group module of Chatiwal
///
/// This module defines the `Group` structure used in the Chatiwal protocol,
/// representing a set of members that can interact with each other. Groups are
/// controlled via `GroupCap`, a capability object that grants administrative
/// permissions over a group.
module chatiwal::group;

use chatiwal::events;
use chatiwal::utils::is_prefix;
use std::string::String;
use sui::bcs;
use sui::clock::Clock;
use sui::vec_set::{Self, VecSet};

// === Error Constants ===

const EInvalidGroupCap: u64 = 1000;
const EMemberAlreadyExists: u64 = 1001;
const EMemberNotExists: u64 = 1002;
const ENoAccess: u64 = 1004;

// === Access Control ===

public struct GroupCap has key {
    id: UID,
    group_id: ID,
}

public struct Group has key {
    id: UID,
    members: VecSet<address>,
    metadata_blob_id: String,
    created_at: u64,
}

// === Initialization ===

fun init(ctx: &mut TxContext) {
    init_impl(ctx);
}

// === Entry Functions ===

public entry fun mint_group_and_transfer(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext) {
    let mut g = do_mint_group(metadata_blob_id, c, ctx);
    let g_cap = do_mint_group_cap(object::id(&g), c, ctx);
    do_add_member(&mut g, tx_context::sender(ctx), c);
    transfer::share_object(g);
    transfer::transfer(g_cap, tx_context::sender(ctx));
}

public entry fun mint_group_cap(
    group_cap: &GroupCap,
    g: &Group,
    recipient: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    assert!(group_cap_has_permission_of_group(group_cap, g), EInvalidGroupCap);
    let g_cap = do_mint_group_cap(object::id(g), c, ctx);
    transfer::transfer(g_cap, recipient);
}

public entry fun add_member(group_cap: &GroupCap, g: &mut Group, member: address, c: &Clock) {
    assert!(group_cap_has_permission_of_group(group_cap, g), EInvalidGroupCap);
    assert!(!vec_set::contains(&g.members, &member), EMemberAlreadyExists);
    do_add_member(g, member, c);
}

public entry fun remove_member(group_cap: &GroupCap, g: &mut Group, member: address, c: &Clock) {
    assert!(group_cap_has_permission_of_group(group_cap, g), EInvalidGroupCap);
    assert!(vec_set::contains(&g.members, &member), EMemberNotExists);
    do_remove_member(g, member, c);
}

public entry fun leave_group(g: &mut Group, user: address, c: &Clock) {
    assert!(vec_set::contains(&g.members, &user), EMemberNotExists);
    do_leave_group(user, g, c)
}

// === Internal Functions ===

fun do_mint_group(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext): Group {
    let g = mint_group_impl(metadata_blob_id, c, ctx);
    events::emit_group_minted(object::id(&g), g.metadata_blob_id, c.timestamp_ms());
    g
}

fun do_mint_group_cap(group_id: ID, c: &Clock, ctx: &mut TxContext): GroupCap {
    let g_cap = mint_group_cap_impl(group_id, ctx);
    events::emit_group_cap_minted(object::id(&g_cap), g_cap.group_id, c.timestamp_ms());
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
    events::emit_group_member_added(object::id(g), member, c.timestamp_ms());
}

fun do_remove_member(g: &mut Group, member: address, c: &Clock) {
    remove_member_impl(g, member);
    events::emit_group_member_removed(object::id(g), member, c.timestamp_ms());
}

fun do_leave_group(user: address, g: &mut Group, c: &Clock) {
    leave_group_impl(user, g);
    events::emit_group_member_left(object::id(g), user, c.timestamp_ms());
}

fun add_member_impl(g: &mut Group, member: address) {
    vec_set::insert(&mut g.members, member);
}

fun remove_member_impl(g: &mut Group, member: address) {
    vec_set::remove(&mut g.members, &member);
}

fun leave_group_impl(user: address, g: &mut Group) {
    if (g.members.contains(&user)) {
        g.members.remove(&user);
    };
}

fun init_impl(ctx: &mut TxContext) {}

fun mint_group_impl(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext): Group {
    Group {
        id: object::new(ctx),
        members: vec_set::empty(),
        metadata_blob_id,
        created_at: c.timestamp_ms(),
    }
}

public fun namespace(g: &Group): vector<u8> {
    object::id_to_bytes(&object::id(g))
}

// === Seal Interface for Group ===

public(package) fun approve_internal(id: vector<u8>, caller: address, g: &Group): bool {
    let namespace = namespace(g);

    if (!is_prefix(namespace, id)) {
        return false
    };

    vec_set::contains(&g.members, &caller)
}

public entry fun seal_approve(id: vector<u8>, g: &Group, ctx: &TxContext) {
    assert!(approve_internal(id, tx_context::sender(ctx), g), ENoAccess);
}

// === Seal Interface for Direct Messages ===

public(package) fun check_policy_for_direct(id: vector<u8>, ctx: &TxContext): bool {
    let caller_bytes = bcs::to_bytes(&ctx.sender());
    id == caller_bytes
}

entry fun seal_approve_for_direct(id: vector<u8>, ctx: &TxContext) {
    assert!(check_policy_for_direct(id, ctx), ENoAccess);
}

// === Helper Functions ===

fun group_cap_has_permission_of_group(group_cap: &GroupCap, g: &Group): bool {
    group_cap.group_id == object::id(g)
}

// === Accessors ===

public fun group_get_group_id(g: &Group): ID {
    object::id(g)
}

public fun group_get_group_members(g: &Group): VecSet<address> {
    g.members
}

public fun group_get_group_metadata_blob_id(g: &Group): String {
    g.metadata_blob_id
}

public fun group_cap_get_group_id(group_cap: &GroupCap): ID {
    group_cap.group_id
}

public fun group_cap_get_id(group_cap: &GroupCap): ID {
    object::id(group_cap)
}

public fun is_member(g: &Group, addr: address): bool {
    vec_set::contains(&g.members, &addr)
}
