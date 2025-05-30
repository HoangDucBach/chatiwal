#[test_only]
module chatiwal::group_tests;

use chatiwal::group::{Self, Group, GroupCap, check_policy_for_direct};
use std::string::{Self, String};
use sui::clock::{Self, Clock};
use sui::test_scenario::{Self as ts, Scenario};
use sui::bcs;

const ADMIN_1: address = @0xA1;
const ADMIN_2: address = @0xA2;
const USER_1: address = @0xB1;
const USER_2: address = @0xB2;
const NON_MEMBER: address = @0xABC;

const METADATA_ID: vector<u8> = b"test_metadata_1";

fun metadata_string(): String {
    string::utf8(METADATA_ID)
}

fun most_recent_shared_group_id(): ID {
    let g_id_opt = ts::most_recent_id_shared<Group>();
    assert!(option::is_some(&g_id_opt), 200);
    option::destroy_some(g_id_opt)
}

#[test]
fun test_init_creates_registry() {
    let mut scenario = ts::begin(ADMIN_1);
    let ctx = ts::ctx(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN_1);


    ts::end(scenario);
}

#[test]
fun test_mint_group() {
    let mut s = ts::begin(ADMIN_1);
    let c: Clock;
    let ctx = ts::ctx(&mut s);

    ts::next_tx(&mut s, ADMIN_1);


    ts::next_tx(&mut s, ADMIN_1);
    {
        let ctx = ts::ctx(&mut s);
        c = clock::create_for_testing(ctx);
        group::mint_group_and_transfer( metadata_string(), &c, ctx);
    };
    ts::next_tx(&mut s, ADMIN_1);
    {
        let g_id = most_recent_shared_group_id();

        let cap = ts::take_from_sender<GroupCap>(&s);
        assert!(group::group_cap_get_group_id(&cap) == g_id, 1);

        let g = ts::take_shared_by_id<Group>(&s, g_id);
        assert!(group::group_get_group_id(&g) == g_id, 2);
        assert!(g.group_get_group_members().size() == 1, 3);
        assert!(group::group_get_group_metadata_blob_id(&g) == metadata_string(), 4);
        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
    };

    c.destroy_for_testing();
    ts::end(s);
}

#[test]
fun test_add_remove_member() {
    let mut s = ts::begin(ADMIN_1);
    let ctx = ts::ctx(&mut s);
    let c: Clock;
    let g_id: ID;
    c = clock::create_for_testing(ctx);

    ts::next_tx(&mut s, ADMIN_1);


    {
        let ctx = ts::ctx(&mut s);
        group::mint_group_and_transfer( metadata_string(), &c, ctx);
    };
    ts::next_tx(&mut s, ADMIN_1);

    g_id = most_recent_shared_group_id();
    {
        let cap = ts::take_from_sender<GroupCap>(&s);
        let mut g = ts::take_shared_by_id<Group>(&s, g_id);

        group::add_member(&cap,  &mut g, USER_1, &c);
        assert!(group::is_member(&g, USER_1), 1);
        assert!(g.group_get_group_members().contains(&USER_1), 3);

        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
    };
    ts::next_tx(&mut s, ADMIN_1);

    {
        let cap = ts::take_from_sender<GroupCap>(&s);
        let mut g = ts::take_shared_by_id<Group>(&s, g_id);

        group::add_member(&cap,  &mut g, USER_2, &c);
        assert!(group::is_member(&g, USER_1), 3);
        assert!(group::is_member(&g, USER_2), 4);
        assert!(g.group_get_group_members().size() == 3, 5); // admin and 2 user

        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
    };
    ts::next_tx(&mut s, ADMIN_1);

    {
        let cap = ts::take_from_sender<GroupCap>(&s);
        let mut g = ts::take_shared_by_id<Group>(&s, g_id);

        group::remove_member(&cap,  &mut g, USER_1, &c);
        assert!(!group::is_member(&g, USER_1), 6);
        assert!(group::is_member(&g, USER_2), 7);
        assert!(g.group_get_group_members().size() == 2, 8);

        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
    };
    c.destroy_for_testing();
    ts::end(s);
}

#[test]
#[expected_failure(abort_code = group::EMemberAlreadyExists)]
fun test_add_existing_member_fails() {
    let mut s = ts::begin(ADMIN_1);
    let mut c: Clock;
    let g_id: ID;
    let ctx = ts::ctx(&mut s);
    c = clock::create_for_testing(ctx);

    ts::next_tx(&mut s, ADMIN_1);


    {
        let ctx = ts::ctx(&mut s);
        group::mint_group_and_transfer( metadata_string(), &c, ctx);
    };
    ts::next_tx(&mut s, ADMIN_1);

    g_id = most_recent_shared_group_id();
    {
        let cap = ts::take_from_sender<GroupCap>(&s);
        let mut g = ts::take_shared_by_id<Group>(&s, g_id);

        group::add_member(&cap,  &mut g, USER_1, &c);
        group::add_member(&cap,  &mut g, USER_1, &c);

        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
    };
    c.destroy_for_testing();
    ts::end(s);
}

#[test]
#[expected_failure(abort_code = group::EMemberNotExists)]
fun test_remove_non_member_fails() {
    let mut s = ts::begin(ADMIN_1);
    let c = clock::create_for_testing(ts::ctx(&mut s));
    let g_id: ID;
    let ctx = ts::ctx(&mut s);

    ts::next_tx(&mut s, ADMIN_1);


    ts::next_tx(&mut s, ADMIN_1);
    {
        let ctx = ts::ctx(&mut s);
        group::mint_group_and_transfer( metadata_string(), &c, ctx);
    };
    {
        let ctx = ts::ctx(&mut s);
        group::mint_group_and_transfer( metadata_string(), &c, ctx);
    };
    ts::next_tx(&mut s, ADMIN_1);

    g_id = most_recent_shared_group_id();
    {
        let cap = ts::take_from_sender<GroupCap>(&s);
        let mut g = ts::take_shared_by_id<Group>(&s, g_id);

        group::remove_member(&cap,  &mut g, NON_MEMBER, &c);

        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
    };

    c.destroy_for_testing();
    ts::end(s);
}

#[test]
fun test_seal_approve() {
    let mut s = ts::begin(ADMIN_1);
    let c = clock::create_for_testing(ts::ctx(&mut s));
    let g_id: ID;
    let ctx = ts::ctx(&mut s);
    ts::next_tx(&mut s, ADMIN_1);


    ts::next_tx(&mut s, ADMIN_1);
    {
        let ctx = ts::ctx(&mut s);
        group::mint_group_and_transfer( metadata_string(), &c, ctx);
    };
    ts::next_tx(&mut s, ADMIN_1);

    g_id = most_recent_shared_group_id();
    {
        let cap = ts::take_from_sender<GroupCap>(&s);
        let mut g = ts::take_shared_by_id<Group>(&s, g_id);

        group::add_member(&cap,  &mut g, USER_1, &c);
        assert!(group::is_member(&g, USER_1), 1);

        ts::return_to_sender(&s, cap);
        ts::return_shared(g);
        };

    ts::next_tx(&mut s, USER_1);
    {
        let g = ts::take_shared_by_id<Group>(&s, g_id);
        let ctx = ts::ctx(&mut s);
        // get group package id
        let g_id_bytes = g.group_get_group_id().to_bytes();
        group::seal_approve(g_id_bytes, &g, ctx);

        ts::return_shared(g);
    };
    c.destroy_for_testing();
    ts::end(s);
}

#[test]
fun test_check_policy_for_direct() {
    let ctx = tx_context::dummy();
    let sender = ctx.sender();
    let id = bcs::to_bytes(&sender);
    assert!(check_policy_for_direct(id, &ctx), 0);

    let id = bcs::to_bytes(&USER_1);
    assert!(!check_policy_for_direct(id, &ctx), 0);
}