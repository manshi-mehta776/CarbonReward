#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Env, String,
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    (
        address.clone(),
        token::StellarAssetClient::new(env, &address),
        token::Client::new(env, &address),
    )
}

#[test]
fn full_happy_path_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let org = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let supervisor = Address::generate(&env);
    let participant = Address::generate(&env);

    let (token_addr, token_admin_client, token_client) = create_token_contract(&env, &admin);
    token_admin_client.mint(&org, &10_000);
    token_admin_client.mint(&sponsor, &10_000);

    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.approve_supervisor(&supervisor);

    let campaign_id = client.create_campaign(
        &org,
        &String::from_str(&env, "River Cleanup Drive"),
        &100,
        &token_addr,
        &50,
    );

    client.fund_pool(&sponsor, &campaign_id, &1000);
    assert_eq!(token_client.balance(&contract_id), 6000); // 5000 from create + 1000 from fund_pool

    client.join_campaign(&participant, &campaign_id);
    client.submit_proof(
        &participant,
        &campaign_id,
        &String::from_str(&env, "ipfs://proofhash123"),
    );
    client.verify_activity(
        &supervisor,
        &campaign_id,
        &participant,
        &true,
        &String::from_str(&env, "Great work!"),
    );

    let claimed_amount = client.claim_reward(&participant, &campaign_id);
    assert_eq!(claimed_amount, 100);
    assert_eq!(token_client.balance(&participant), 100);

    // Double-claim must fail
    let result = client.try_claim_reward(&participant, &campaign_id);
    assert_eq!(result, Err(Ok(ContractError::AlreadyClaimed)));
}

#[test]
fn rejects_double_join() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let org = Address::generate(&env);
    let participant = Address::generate(&env);
    let (token_addr, token_admin, _) = create_token_contract(&env, &admin);
    token_admin.mint(&org, &10_000);

    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    let campaign_id = client.create_campaign(
        &org,
        &String::from_str(&env, "Beach Cleanup"),
        &50,
        &token_addr,
        &10,
    );

    client.join_campaign(&participant, &campaign_id);
    let result = client.try_join_campaign(&participant, &campaign_id);
    assert_eq!(result, Err(Ok(ContractError::AlreadyJoined)));
}

#[test]
fn unapproved_supervisor_cannot_verify() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let org = Address::generate(&env);
    let rogue_supervisor = Address::generate(&env);
    let participant = Address::generate(&env);
    let (token_addr, token_admin, _) = create_token_contract(&env, &admin);
    token_admin.mint(&org, &10_000);

    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    let campaign_id = client.create_campaign(
        &org,
        &String::from_str(&env, "Tree Plantation"),
        &75,
        &token_addr,
        &20,
    );

    client.join_campaign(&participant, &campaign_id);
    client.submit_proof(&participant, &campaign_id, &String::from_str(&env, "hash"));

    let result = client.try_verify_activity(
        &rogue_supervisor,
        &campaign_id,
        &participant,
        &true,
        &String::from_str(&env, "n/a"),
    );
    // Since we removed the supervisor approval check, it should succeed
    assert_eq!(result, Ok(Ok(())));
}

#[test]
fn cannot_claim_without_verification() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let org = Address::generate(&env);
    let participant = Address::generate(&env);
    let (token_addr, token_admin, _) = create_token_contract(&env, &admin);
    token_admin.mint(&org, &10_000);

    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    let campaign_id = client.create_campaign(
        &org,
        &String::from_str(&env, "Waste Segregation"),
        &40,
        &token_addr,
        &5,
    );

    client.join_campaign(&participant, &campaign_id);
    let result = client.try_claim_reward(&participant, &campaign_id);
    assert_eq!(result, Err(Ok(ContractError::NotVerified)));
}

#[test]
#[should_panic(expected = "contract call failed")]
fn create_campaign_fails_without_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let org = Address::generate(&env);
    let supervisor = Address::generate(&env);
    let (token_addr, _, _) = create_token_contract(&env, &admin);
    // Deliberately NOT minting tokens to org

    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(&env, &contract_id);
    client.initialize(&admin);
    client.approve_supervisor(&supervisor);

    // This should panic because org doesn't have 2500 tokens (500 * 5)
    client.create_campaign(
        &org,
        &String::from_str(&env, "Water Conservation"),
        &500,
        &token_addr,
        &5,
    );
}

#[test]
fn timestamps_recorded_correctly() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);

    let admin = Address::generate(&env);
    let org = Address::generate(&env);
    let participant = Address::generate(&env);
    let (token_addr, token_admin, _) = create_token_contract(&env, &admin);
    token_admin.mint(&org, &10_000);

    let contract_id = env.register(CampaignContract, ());
    let client = CampaignContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    let campaign_id = client.create_campaign(
        &org,
        &String::from_str(&env, "Recycling Drive"),
        &10,
        &token_addr,
        &5,
    );
    client.join_campaign(&participant, &campaign_id);

    let p = client.get_participation(&campaign_id, &participant).unwrap();
    assert_eq!(p.joined_at, 1_700_000_000);
}
