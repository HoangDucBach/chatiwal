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
use sui::clock::Clock;
use sui::table::{Self, Table};
use sui::vec_set::{Self, VecSet};

// === Error Constants ===

const EInvalidGroupCap: u64 = 1000;
const EMemberAlreadyExists: u64 = 1001;
const EMemberNotExists: u64 = 1002;
const ESealNotApproved: u64 = 1004;

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

public struct Registry has key {
    id: UID,
    user_groups: Table<address, VecSet<ID>>,
}

// === Initialization ===

fun init(ctx: &mut TxContext) {
    init_impl(ctx);
}

// === Entry Functions ===

public entry fun mint_group_and_transfer(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext) {
    let g = do_mint_group(metadata_blob_id, c, ctx);
    let g_cap = do_mint_group_cap(object::id(&g), c, ctx);
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

public entry fun add_member(
    group_cap: &GroupCap,
    registry: &mut Registry,
    g: &mut Group,
    member: address,
    c: &Clock,
) {
    assert!(group_cap_has_permission_of_group(group_cap, g), EInvalidGroupCap);
    assert!(!vec_set::contains(&g.member, &member), EMemberAlreadyExists);
    do_add_member(g, member, c);
    registry.register_group_impl(member, g)
}

public entry fun remove_member(
    group_cap: &GroupCap,
    registry: &mut Registry,
    g: &mut Group,
    member: address,
    c: &Clock,
) {
    assert!(group_cap_has_permission_of_group(group_cap, g), EInvalidGroupCap);
    assert!(vec_set::contains(&g.member, &member), EMemberNotExists);
    do_remove_member(g, member, c);
    registry.unregister_group_impl(member, g)
}

// === Internal Functions ===

fun do_mint_group(metadata_blob_id: String, c: &Clock, ctx: &mut TxContext): Group {
    let g = mint_group_impl(metadata_blob_id, ctx);
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

fun add_member_impl(g: &mut Group, member: address) {
    vec_set::insert(&mut g.member, member);
}

fun remove_member_impl(g: &mut Group, member: address) {
    vec_set::remove(&mut g.member, &member);
}

fun register_group_impl(registry: &mut Registry, user: address, g: &Group) {
    let user_groups = &mut registry.user_groups;
    if (!user_groups.contains(user)) {
        user_groups.add(user, vec_set::empty());
    };
    let groups = user_groups.borrow_mut(user);
    groups.insert(object::id(g));
}

fun unregister_group_impl(registry: &mut Registry, user: address, g: &Group) {
    let user_groups = &mut registry.user_groups;
    if (user_groups.contains(user)) {
        let groups = user_groups.borrow_mut(user);
        groups.remove(object::borrow_id(g));
    };
}

fun init_impl(ctx: &mut TxContext) {
    let registry = Registry {
        id: object::new(ctx),
        user_groups: table::new(ctx),
    };
    transfer::share_object(registry);
}

fun mint_group_impl(metadata_blob_id: String, ctx: &mut TxContext): Group {
    Group {
        id: object::new(ctx),
        member: vec_set::empty(),
        metadata_blob_id,
    }
}

public fun namespace(g: &Group): vector<u8> {
    object::id_to_bytes(&object::id(g))
}

// === Seal Interface ===

public(package) fun approve_internal(id: vector<u8>, caller: address, g: &Group): bool {
    let namespace = namespace(g);

    if (!is_prefix(namespace, id)) {
        return false
    };

    vec_set::contains(&g.member, &caller)
}

public entry fun seal_approve(id: vector<u8>, g: &Group, ctx: &TxContext) {
    assert!(approve_internal(id, tx_context::sender(ctx), g), ESealNotApproved);
}

// === Helper Functions ===

fun group_cap_has_permission_of_group(group_cap: &GroupCap, g: &Group): bool {
    group_cap.group_id == object::id(g)
}

// === Accessors ===

public fun registry_get_user_groups(registry: &Registry, user: address): &VecSet<ID> {
    registry.user_groups.borrow(user)
}

public fun group_get_group_id(g: &Group): ID {
    object::id(g)
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
    object::id(group_cap)
}

public fun is_member(g: &Group, addr: address): bool {
    vec_set::contains(&g.member, &addr)
}

#[test_only]
public fun create_and_share_registry_for_testing(ctx: &mut TxContext) {
    let registry = Registry {
        id: object::new(ctx),
        user_groups: table::new(ctx),
    };
    transfer::share_object(registry);
}
