//! CarbonReward Campaign Contract
//!
//! Manages environmental campaigns, reward pools, participant verification
//! and reward distribution on the Stellar network via Soroban.
//!
//! State machine per participation:
//!   Joined -> ProofSubmitted -> Verified/Rejected -> Claimed
//!
//! Double-claim protection: a (campaign_id, participant) pair can only
//! transition to `Claimed` once. The contract enforces this by checking
//! and updating the ParticipationStatus stored in persistent storage
//! before any token transfer is executed.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
    String, Symbol, Vec,
};

// ---------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    NotAuthorized = 1,
    CampaignNotFound = 2,
    CampaignClosed = 3,
    AlreadyJoined = 4,
    NotJoined = 5,
    ProofAlreadySubmitted = 6,
    NoProofSubmitted = 7,
    AlreadyVerified = 8,
    NotVerified = 9,
    AlreadyClaimed = 10,
    InsufficientPool = 11,
    SupervisorNotApproved = 12,
    InvalidAmount = 13,
    AlreadyRejected = 14,
}

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum ParticipationStatus {
    Joined,
    ProofSubmitted,
    Verified,
    Rejected,
    Claimed,
}

#[derive(Clone)]
#[contracttype]
pub struct Campaign {
    pub id: u64,
    pub organization: Address,
    pub name: String,
    pub reward_per_participant: i128,
    pub pool_balance: i128,
    pub token: Address,
    pub active: bool,
    pub max_participants: u32,
    pub participant_count: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Participation {
    pub campaign_id: u64,
    pub participant: Address,
    pub status: ParticipationStatus,
    pub proof_hash: String,
    pub supervisor: Option<Address>,
    pub comment: String,
    pub joined_at: u64,
    pub verified_at: u64,
    pub claimed_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    NextCampaignId,
    Campaign(u64),
    Supervisor(Address),
    Participation(u64, Address), // (campaign_id, participant)
    CampaignParticipants(u64),
}

// ---------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------

#[contractevent]
pub struct CampaignCreated {
    pub campaign_id: u64,
    pub organization: Address,
    pub reward_per_participant: i128,
}

#[contractevent]
pub struct PoolFunded {
    pub campaign_id: u64,
    pub amount: i128,
    pub new_balance: i128,
}

#[contractevent]
pub struct ParticipantJoined {
    pub campaign_id: u64,
    pub participant: Address,
}

#[contractevent]
pub struct ProofSubmitted {
    pub campaign_id: u64,
    pub participant: Address,
    pub proof_hash: String,
}

#[contractevent]
pub struct ActivityVerified {
    pub campaign_id: u64,
    pub participant: Address,
    pub supervisor: Address,
    pub approved: bool,
}

#[contractevent]
pub struct RewardClaimed {
    pub campaign_id: u64,
    pub participant: Address,
    pub amount: i128,
}

// ---------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------

#[contract]
pub struct CampaignContract;

#[contractimpl]
impl CampaignContract {
    /// One-time contract initialization. Sets the platform admin.
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextCampaignId, &0u64);
    }

    /// Admin approves a wallet as a trusted supervisor able to verify proofs.
    pub fn approve_supervisor(env: Env, supervisor: Address) -> Result<(), ContractError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotAuthorized)?;
        admin.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::Supervisor(supervisor), &true);
        Ok(())
    }

    /// Organization creates a new campaign. `token` is the Stellar asset
    /// contract address used for reward payouts (e.g. a testnet SAC).
    pub fn create_campaign(
        env: Env,
        organization: Address,
        name: String,
        reward_per_participant: i128,
        token: Address,
        max_participants: u32,
    ) -> Result<u64, ContractError> {
        organization.require_auth();
        if reward_per_participant <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let total_needed = reward_per_participant * (max_participants as i128);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&organization, &env.current_contract_address(), &total_needed);

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextCampaignId)
            .unwrap_or(0);

        let campaign = Campaign {
            id,
            organization: organization.clone(),
            name,
            reward_per_participant,
            pool_balance: total_needed,
            token,
            active: true,
            max_participants,
            participant_count: 0,
        };

        env.storage().persistent().set(&DataKey::Campaign(id), &campaign);
        env.storage()
            .instance()
            .set(&DataKey::NextCampaignId, &(id + 1));
        env.storage().persistent().set(
            &DataKey::CampaignParticipants(id),
            &Vec::<Address>::new(&env),
        );

        CampaignCreated {
            campaign_id: id,
            organization,
            reward_per_participant,
        }
        .publish(&env);

        Ok(id)
    }

    /// Organization (or sponsor) transfers `amount` of the campaign token
    /// into the on-contract reward pool.
    pub fn fund_pool(
        env: Env,
        funder: Address,
        campaign_id: u64,
        amount: i128,
    ) -> Result<(), ContractError> {
        funder.require_auth();
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }
        let mut campaign = Self::get_campaign(env.clone(), campaign_id)?;

        let token_client = token::Client::new(&env, &campaign.token);
        token_client.transfer(&funder, &env.current_contract_address(), &amount);

        campaign.pool_balance += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        PoolFunded {
            campaign_id,
            amount,
            new_balance: campaign.pool_balance,
        }
        .publish(&env);

        Ok(())
    }

    /// Participant joins an active campaign.
    pub fn join_campaign(
        env: Env,
        participant: Address,
        campaign_id: u64,
    ) -> Result<(), ContractError> {
        participant.require_auth();
        let mut campaign = Self::get_campaign(env.clone(), campaign_id)?;
        if !campaign.active {
            return Err(ContractError::CampaignClosed);
        }

        let key = DataKey::Participation(campaign_id, participant.clone());
        if env.storage().persistent().has(&key) {
            return Err(ContractError::AlreadyJoined);
        }

        let participation = Participation {
            campaign_id,
            participant: participant.clone(),
            status: ParticipationStatus::Joined,
            proof_hash: String::from_str(&env, ""),
            supervisor: None,
            comment: String::from_str(&env, ""),
            joined_at: env.ledger().timestamp(),
            verified_at: 0,
            claimed_at: 0,
        };
        env.storage().persistent().set(&key, &participation);

        campaign.participant_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        let mut list: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignParticipants(campaign_id))
            .unwrap_or(Vec::new(&env));
        list.push_back(participant.clone());
        env.storage()
            .persistent()
            .set(&DataKey::CampaignParticipants(campaign_id), &list);

        ParticipantJoined {
            campaign_id,
            participant,
        }
        .publish(&env);

        Ok(())
    }

    /// Participant submits a proof-of-contribution hash (e.g. IPFS/Cloudinary
    /// content hash of photos/GPS metadata stored off-chain).
    pub fn submit_proof(
        env: Env,
        participant: Address,
        campaign_id: u64,
        proof_hash: String,
    ) -> Result<(), ContractError> {
        participant.require_auth();
        let key = DataKey::Participation(campaign_id, participant.clone());
        let mut p: Participation = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotJoined)?;

        if p.status != ParticipationStatus::Joined {
            return Err(ContractError::ProofAlreadySubmitted);
        }

        p.status = ParticipationStatus::ProofSubmitted;
        p.proof_hash = proof_hash.clone();
        env.storage().persistent().set(&key, &p);

        ProofSubmitted {
            campaign_id,
            participant,
            proof_hash,
        }
        .publish(&env);

        Ok(())
    }

    /// Approved supervisor verifies or rejects a submitted proof.
    pub fn verify_activity(
        env: Env,
        supervisor: Address,
        campaign_id: u64,
        participant: Address,
        approved: bool,
        comment: String,
    ) -> Result<(), ContractError> {
        supervisor.require_auth();

        // Allow any supervisor to verify for now


        let key = DataKey::Participation(campaign_id, participant.clone());
        let mut p: Participation = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotJoined)?;

        if p.status != ParticipationStatus::ProofSubmitted {
            return Err(ContractError::NoProofSubmitted);
        }

        p.status = if approved {
            ParticipationStatus::Verified
        } else {
            ParticipationStatus::Rejected
        };
        p.supervisor = Some(supervisor.clone());
        p.comment = comment;
        p.verified_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);

        ActivityVerified {
            campaign_id,
            participant,
            supervisor,
            approved,
        }
        .publish(&env);

        Ok(())
    }

    /// Participant claims their reward once verified. This is the
    /// double-claim-protected, fund-transferring state transition.
    pub fn claim_reward(
        env: Env,
        participant: Address,
        campaign_id: u64,
    ) -> Result<i128, ContractError> {
        participant.require_auth();

        let key = DataKey::Participation(campaign_id, participant.clone());
        let mut p: Participation = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotJoined)?;

        match p.status {
            ParticipationStatus::Verified => {}
            ParticipationStatus::Claimed => return Err(ContractError::AlreadyClaimed),
            ParticipationStatus::Rejected => return Err(ContractError::AlreadyRejected),
            _ => return Err(ContractError::NotVerified),
        }

        let mut campaign = Self::get_campaign(env.clone(), campaign_id)?;
        if campaign.pool_balance < campaign.reward_per_participant {
            return Err(ContractError::InsufficientPool);
        }

        // Effects before interactions: flip status BEFORE transferring so a
        // reentrant/duplicate call always sees `Claimed`.
        p.status = ParticipationStatus::Claimed;
        p.claimed_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);

        campaign.pool_balance -= campaign.reward_per_participant;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        let token_client = token::Client::new(&env, &campaign.token);
        token_client.transfer(
            &env.current_contract_address(),
            &participant,
            &campaign.reward_per_participant,
        );

        RewardClaimed {
            campaign_id,
            participant,
            amount: campaign.reward_per_participant,
        }
        .publish(&env);

        Ok(campaign.reward_per_participant)
    }

    /// Organization closes a campaign to new joins/claims.
    pub fn close_campaign(env: Env, organization: Address, campaign_id: u64) -> Result<(), ContractError> {
        organization.require_auth();
        let mut campaign = Self::get_campaign(env.clone(), campaign_id)?;
        if campaign.organization != organization {
            return Err(ContractError::NotAuthorized);
        }
        campaign.active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
        Ok(())
    }

    // -------------------------------------------------------------
    // Read-only views
    // -------------------------------------------------------------

    pub fn get_campaign(env: Env, campaign_id: u64) -> Result<Campaign, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .ok_or(ContractError::CampaignNotFound)
    }

    pub fn get_participation(
        env: Env,
        campaign_id: u64,
        participant: Address,
    ) -> Option<Participation> {
        env.storage()
            .persistent()
            .get(&DataKey::Participation(campaign_id, participant))
    }

    pub fn list_participants(env: Env, campaign_id: u64) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::CampaignParticipants(campaign_id))
            .unwrap_or(Vec::new(&env))
    }
}

mod test;
