// module chatiwal::group;

// use chatiwal::utils::is_prefix;
// use std::string::String;
// use sui::table::{Self, Table};

// public struct Group has key {
//     id: UID,
//     member: Table<address, bool>,
//     metadata_blob_id: String,
// }

// public struct GroupCap has key {
//     id: UID,
//     group_id: ID,
// }

// public entry fun mint_group(metadata_blob_id: String, ctx: &mut TxContext) {
//     do_mint_group(metadata_blob_id, ctx);
// }

// public entry fun mint_group_cap(group_id: ID, ctx: &mut TxContext) {
//     do_mint_group_cap(group_id, ctx);
// }

// public entry fun add_member(group: &mut Group, member: address, ctx: &mut TxContext) {
//     do_add_member(group, member, ctx);
// }

// public entry fun remove_member(group: &mut Group, member: address, ctx: &mut TxContext) {
//     do_remove_member(group, member, ctx);
// }

// fun do_mint_group(metadata_blob_id: String, ctx: &mut TxContext) {
//     let group = mint_group_impl(metadata_blob_id, ctx);

//     // @todo: emit event
// }

// fun do_mint_group_cap(group_id: ID, ctx: &mut TxContext) {
//     let group_cap = mint_group_cap_impl(group_id, ctx);

//     // @todo: emit event
// }

// fun mint_group_cap_impl(group_id: ID, ctx: &mut TxContext): GroupCap {
//     GroupCap {
//         id: object::new(ctx),
//         group_id: group_id,
//     }
// }

// fun do_add_member(group: &mut Group, member: address, ctx: &mut TxContext) {
//     add_member_impl(group, member);
// }

// fun add_member_impl(group: &mut Group, member: address) {
//     group.member.add(member, true);
// }

// fun do_remove_member(group: &mut Group, member: address, ctx: &mut TxContext) {
//     remove_member_impl(group, member);
// }

// fun remove_member_impl(group: &mut Group, member: address) {
//     group.member.remove(member);
// }

// fun mint_group_impl(metadata_blob_id: String, ctx: &mut TxContext): Group {
//     Group {
//         id: object::new(ctx),
//         member: table::new(ctx),
//         metadata_blob_id: metadata_blob_id,
//     }
// }

// public fun namespace(group: &Group): vector<u8> {
//     group.id.to_bytes()
// }

// // all group members can access all ids with the prefix of group
// fun approve_internal(caller: address, id: vector<u8>, group: &Group): bool {
//     let namespace = namespace(group);

//     if (!is_prefix(namespace, id)) {
//         return false;
//     };

//     group.member.contains(caller)
// }

// entry fun seal_approve_member(id: vector<u8>, group: &Group, ctx: &TxContext) {
//     let approved = approve_internal(ctx.sender(), id, group);
//     assert!(approved, 0);
// }

// public fun get_group_id(group: &Group): ID {
//     group.id.to_inner()
// }

// public fun get_group_metadata_blob_id(group: &Group): String {
//     group.metadata_blob_id
// }

// public fun get_group_member(group: &Group): Table<address, bool> {
//     table::
// }