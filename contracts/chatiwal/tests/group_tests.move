// #[test_only]
// #[allow(unused_use, unused_const)]
// module chatiwal::group_tests;

// use chatiwal::errors;
// use chatiwal::group::{Self, Group, GroupMemberList, GroupPinnedMessageList, GroupSnapshot};
// use chatiwal::permissions;
// use std::debug::print;
// use std::string::{Self, String};
// use sui::clock::{Self, Clock};
// use sui::test_scenario::{Self, Scenario};

// // Test addresses
// const ADMIN: address = @0xA1;
// const USER1: address = @0xB1;
// const USER2: address = @0xC1;
// const USER3: address = @0xC2;
// const MEMBER1: address = @0xD1;
// const MEMBER2: address = @0xE1;
// const MEMBER3: address = @0xF1;
// const MODERATOR1: address = @0xF2;
// const ADMIN1: address = @0xF3;

// // Test constants
// const GROUP_NAME: vector<u8> = b"Test Chat Group";
// const METADATA_BLOB_ID: vector<u8> = b"test-metadata";
// const SNAPSHOT_BLOB_ID: vector<u8> = b"test-snapshot";
// const MESSAGE_BLOB_ID: vector<u8> = b"test-message";
// const MESSAGE_BLOB_ID_2: vector<u8> = b"test-message-2";
// const EMPTY_NAME: vector<u8> = b"";
// const LONG_NAME: vector<u8> =
//     b"This is a very very very very very very very very very very very very very very very very very very very very very long group name that exceeds the maximum allowed length";

// // === Helper Functions ===

// fun create_clock(scenario: &mut Scenario): Clock {
//     test_scenario::next_tx(scenario, @0x0);
//     clock::create_for_testing(test_scenario::ctx(scenario))
// }

// fun destroy_clock(clock: Clock, scenario: &mut Scenario) {
//     test_scenario::next_tx(scenario, @0x0);
//     clock::destroy_for_testing(clock);
// }

// fun setup_group_with_lists(scenario: &mut Scenario, clock: &Clock) {
//     test_scenario::next_tx(scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             clock,
//             ctx,
//         );
//     };

//     test_scenario::next_tx(scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(scenario);
//         let ctx = test_scenario::ctx(scenario);

//         group::mint_group_member_list(&mut group, clock, ctx);
//         group::mint_group_pinned_message_list(&mut group, clock, ctx);

//         test_scenario::return_shared(group);
//     };
// }

// fun setup_members_with_permissions(scenario: &mut Scenario, clock: &Clock, group: &mut Group) {
//     // Add a regular member
//     test_scenario::next_tx(scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(scenario);
//         group::add_member(group, MEMBER1, permissions::permission_member(), clock, ctx);
//     };

//     // Add a moderator
//     test_scenario::next_tx(scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(scenario);
//         group::add_member(group, MODERATOR1, permissions::permission_moderator(), clock, ctx);
//     };

//     // Add an admin
//     test_scenario::next_tx(scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(scenario);
//         group::add_member(group, ADMIN1, permissions::permission_admin(), clock, ctx);
//     };
// }

// #[test]
// fun test_mint_group() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Verify group properties
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let group = test_scenario::take_shared<Group>(&scenario);

//         assert!(group::group_get_name(&group) == string::utf8(GROUP_NAME), 0);
//         assert!(group::group_get_owner(&group) == ADMIN, 1);
//         assert!(group::group_get_metadata_blob_id(&group) == string::utf8(METADATA_BLOB_ID), 3);

//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::EEmptyRequiredField)]
// fun test_mint_group_with_empty_name() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         // This should fail because the name is empty
//         group::mint_group(
//             string::utf8(EMPTY_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::EMaxNameLength)]
// fun test_mint_group_with_too_long_name() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         // This should fail because the name is too long
//         group::mint_group(
//             string::utf8(LONG_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_mint_and_transfer_group() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Verify the group was created and shared
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let group = test_scenario::take_shared<Group>(&scenario);

//         assert!(group::group_get_name(&group) == string::utf8(GROUP_NAME), 0);
//         assert!(group::group_get_owner(&group) == ADMIN, 1);
//         assert!(group::group_get_metadata_blob_id(&group) == string::utf8(METADATA_BLOB_ID), 2);

//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_mint_group_member_list() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // First mint a group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Create member list for the group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::mint_group_member_list(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::EAlreadyExists)]
// fun test_mint_duplicate_group_member_list() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // Setup a group with member list
//     setup_group_with_lists(&mut scenario, &clock);

//     // Try to create another member list (should fail)
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group_member_list(&mut group, &clock, ctx);
//         destroy_clock(clock, &mut scenario);
//         test_scenario::return_shared(group);
//     };

//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::EForbidden)]
// fun test_mint_group_member_list_not_owner() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // First mint a group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Try to create member list by non-owner (should fail)
//     test_scenario::next_tx(&mut scenario, USER1);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::mint_group_member_list(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_mint_group_pinned_message_list() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // First mint a group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Create pinned message list for the group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::mint_group_pinned_message_list(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::EAlreadyExists)]
// fun test_mint_duplicate_pinned_message_list() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // Setup a group with member list and pinned message list
//     setup_group_with_lists(&mut scenario, &clock);

//     // Try to create another pinned message list (should fail)
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group_pinned_message_list(&mut group, &clock, ctx);
//         test_scenario::return_shared(group);
//     };

//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_mint_group_snapshot() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // First mint a group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Create a snapshot of the group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::mint_group_snapshot(
//             &group,
//             string::utf8(SNAPSHOT_BLOB_ID),
//             &clock,
//             ctx,
//         );

//         test_scenario::return_shared(group);
//     };

//     // Verify the snapshot was created
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let snapshot = test_scenario::take_from_sender<GroupSnapshot>(&scenario);
//         let group = test_scenario::take_shared<Group>(&scenario);

//         assert!(group::group_snapshot_get_group_id(&snapshot) == group::group_get_id(&group), 0);
//         assert!(
//             group::group_snapshot_get_messages_blob_id(&snapshot) == string::utf8(SNAPSHOT_BLOB_ID),
//             1,
//         );

//         test_scenario::return_to_sender(&scenario, snapshot);
//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_member_management() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // Create a group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Initialize member list
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::mint_group_member_list(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Test request to join
//     test_scenario::next_tx(&mut scenario, USER1);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::request_join(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Test accept request
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         // Use permission_member() for basic membership level
//         group::accept_request(&mut group, USER1, permissions::permission_member(), &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Test adding member directly
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::add_member(&mut group, USER2, permissions::permission_member(), &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Test member leaving the group
//     test_scenario::next_tx(&mut scenario, USER1);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::leave_group(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Test kicking a member
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::kick_member(&mut group, USER2, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::EAlreadyExists)]
// fun test_duplicate_request_join() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // Setup a group with member list
//     setup_group_with_lists(&mut scenario, &clock);

//     // User requests to join
//     test_scenario::next_tx(&mut scenario, USER1);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::request_join(&mut group, &clock, ctx);
//         test_scenario::return_shared(group);
//     };

//     // User tries to request again (should fail)
//     test_scenario::next_tx(&mut scenario, USER1);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::request_join(&mut group, &clock, ctx);
//         test_scenario::return_shared(group);
//     };

//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = errors::ENotFound)]
// fun test_accept_nonexistent_request() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // Setup a group with member list
//     setup_group_with_lists(&mut scenario, &clock);

//     // Admin tries to accept a request that doesn't exist
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::accept_request(&mut group, USER1, permissions::permission_member(), &clock, ctx);
//         test_scenario::return_shared(group);
//     };

//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_message_pinning() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     // Create a group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let ctx = test_scenario::ctx(&mut scenario);
//         group::mint_group(
//             string::utf8(GROUP_NAME),
//             string::utf8(METADATA_BLOB_ID),
//             &clock,
//             ctx,
//         );
//     };

//     // Initialize member list and pinned message list
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::mint_group_member_list(&mut group, &clock, ctx);
//         group::mint_group_pinned_message_list(&mut group, &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Pin a message
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::pin_message(&mut group, string::utf8(MESSAGE_BLOB_ID), &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Unpin the message
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let mut group = test_scenario::take_shared<Group>(&scenario);
//         let ctx = test_scenario::ctx(&mut scenario);

//         group::unpin_message(&mut group, string::utf8(MESSAGE_BLOB_ID), &clock, ctx);

//         test_scenario::return_shared(group);
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }

// #[test]
// fun test_delete_group() {
//     let mut scenario = test_scenario::begin(ADMIN);
//     let clock = create_clock(&mut scenario);

//     setup_group_with_lists(&mut scenario, &clock);

//     // Delete the group
//     test_scenario::next_tx(&mut scenario, ADMIN);
//     {
//         let group = test_scenario::take_shared<Group>(&scenario);

//         group::delete_group(group, &clock, scenario.ctx());
//     };

//     // Clean up
//     destroy_clock(clock, &mut scenario);
//     test_scenario::end(scenario);
// }
