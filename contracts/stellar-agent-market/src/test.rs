#![cfg(test)]

extern crate std;

use crate::{
    AgentMarket, AgentMarketClient, EscrowState, ACCESS_PAID, ACCESS_PUBLIC, SETTLEMENT_COMPLETED,
};
use soroban_sdk::{testutils::Address as _, Address, Bytes, Env, String};

#[test]
fn register_list_price_disable() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AgentMarket);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    env.mock_all_auths();

    let client = AgentMarketClient::new(&env, &contract_id);
    client.initialize(&admin).expect("init");

    let id = client
        .register_service(
            &owner,
            &String::from_str(&env, "search"),
            &String::from_str(&env, "https://ex.example/rpc"),
            &String::from_str(&env, "demo"),
            &100i128,
            &String::from_str(&env, "native"),
            &ACCESS_PUBLIC,
        )
        .expect("reg");

    let listed = client.list_services(&0u32, &10u32).expect("list");
    assert_eq!(listed.len(), 1);

    client.set_price(&owner, &id, &200i128).expect("price");
    client.disable_service(&owner, &id).expect("dis");

    let svc = client.get_service(&id).expect("get").expect("some");
    assert_eq!(svc.status, crate::STATUS_DISABLED);
}

#[test]
fn escrow_lifecycle_and_settlement() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AgentMarket);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let payer = Address::generate(&env);
    env.mock_all_auths();

    let client = AgentMarketClient::new(&env, &contract_id);
    client.initialize(&admin).unwrap();

    let asset = String::from_str(&env, "native");
    let sid = client
        .register_service(
            &owner,
            &String::from_str(&env, "svc"),
            &String::from_str(&env, "e"),
            &String::from_str(&env, "d"),
            &50i128,
            &asset,
            &ACCESS_PAID,
        )
        .unwrap();

    let txh = Bytes::from_array(&env, &[1u8; 32]);
    let eid = client
        .open_escrow(&payer, &sid, &50i128, &asset, &1u64, &txh)
        .unwrap();
    client.lock_escrow(&payer, &eid).unwrap();
    client.execute_escrow(&owner, &eid).unwrap();
    client.verify_escrow(&payer, &eid).unwrap();
    client.release_escrow(&admin, &eid).unwrap();

    let esc = client.get_escrow(&eid).unwrap().unwrap();
    assert!(matches!(esc.state, EscrowState::Released));

    let txr = Bytes::from_array(&env, &[2u8; 32]);
    client
        .record_settlement(
            &admin,
            &2u64,
            &sid,
            &payer,
            &owner,
            &50i128,
            &asset,
            &SETTLEMENT_COMPLETED,
            &txr,
        )
        .unwrap();

    let st = client.get_settlement(&2u64).unwrap().unwrap();
    assert_eq!(st.status, SETTLEMENT_COMPLETED);
}

#[test]
fn typed_error_duplicate_service_name_same_owner() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AgentMarket);
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    env.mock_all_auths();

    let client = AgentMarketClient::new(&env, &contract_id);
    client.initialize(&admin).unwrap();

    let n = String::from_str(&env, "dup");
    let asset = String::from_str(&env, "native");
    client
        .register_service(
            &owner,
            &n,
            &String::from_str(&env, "a"),
            &String::from_str(&env, "b"),
            &1i128,
            &asset,
            &ACCESS_PUBLIC,
        )
        .unwrap();
    assert!(
        client
            .register_service(
                &owner,
                &n,
                &String::from_str(&env, "c"),
                &String::from_str(&env, "d"),
                &1i128,
                &asset,
                &ACCESS_PUBLIC,
            )
            .is_err()
    );
}
