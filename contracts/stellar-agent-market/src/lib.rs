#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Bytes, Env, String,
    Vec,
};

// —— Access modes (on ServiceRecord.access_mode) ——
pub const ACCESS_PUBLIC: u32 = 0;
pub const ACCESS_PAID: u32 = 1;
pub const ACCESS_RESTRICTED: u32 = 2;

// —— Service lifecycle ——
pub const STATUS_ACTIVE: u32 = 0;
pub const STATUS_DISABLED: u32 = 1;

// —— Settlement status ——
pub const SETTLEMENT_PENDING: u32 = 0;
pub const SETTLEMENT_COMPLETED: u32 = 1;
pub const SETTLEMENT_FAILED: u32 = 2;

// —— Filter sentinel for list_services_filter ——
pub const FILTER_ANY: u32 = u32::MAX;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    Unauthorized = 1,
    ServiceNotFound = 2,
    ServiceDisabled = 3,
    InvalidPrice = 4,
    InvalidAmount = 5,
    InsufficientFunds = 6,
    EscrowNotOpen = 7,
    EscrowAlreadyLocked = 8,
    EscrowAlreadyReleased = 9,
    EscrowAlreadyRefunded = 10,
    InvalidStateTransition = 11,
    ReputationTooLow = 12,
    DuplicateRegistration = 13,
    UnknownAsset = 14,
    NotInitialized = 15,
    EscrowNotFound = 16,
    SettlementNotFound = 17,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ServiceRecord {
    pub service_id: u32,
    pub owner: Address,
    pub name: String,
    pub endpoint: String,
    pub description: String,
    pub price: i128,
    pub asset: String,
    pub access_mode: u32,
    pub status: u32,
    pub price_version: u32,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationRecord {
    pub completed_count: u64,
    pub successful_settlements: u64,
    pub refund_count: u64,
    pub failure_count: u64,
    pub reputation_score: i64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Open = 0,
    Locked = 1,
    PendingVerify = 2,
    Verified = 3,
    Released = 4,
    Refunded = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub id: u64,
    pub payer: Address,
    pub payee: Address,
    pub service_id: u32,
    pub amount: i128,
    pub asset: String,
    pub state: EscrowState,
    pub request_id: u64,
    pub created_at: u64,
    pub updated_at: u64,
    pub tx_hash: Bytes,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettlementRecord {
    pub request_id: u64,
    pub service_id: u32,
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub asset: String,
    pub status: u32,
    pub ts: u64,
    pub tx_ref: Bytes,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActionReceipt {
    pub service_id: u32,
    pub amount: i128,
    pub asset: String,
    pub payer: Address,
    pub owner: Address,
    pub settlement_status: u32,
    pub chain_ref: Bytes,
}

#[contract]
pub struct AgentMarket;

fn now(env: &Env) -> u64 {
    env.ledger().timestamp()
}

fn admin(env: &Env) -> Result<Address, ContractError> {
    env.storage()
        .instance()
        .get(&symbol_short!("adm"))
        .ok_or(ContractError::NotInitialized)
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), ContractError> {
    let a = admin(env)?;
    if caller != &a {
        return Err(ContractError::Unauthorized);
    }
    Ok(())
}

fn load_service(env: &Env, id: u32) -> Option<ServiceRecord> {
    let key = (symbol_short!("svc"), id);
    env.storage().persistent().get(&key)
}

fn save_service(env: &Env, s: &ServiceRecord) {
    let key = (symbol_short!("svc"), s.service_id);
    env.storage().persistent().set(&key, s);
}

fn load_rep(env: &Env, service_id: u32) -> ReputationRecord {
    let key = (symbol_short!("rep"), service_id);
    env.storage().persistent().get(&key).unwrap_or(ReputationRecord {
        completed_count: 0,
        successful_settlements: 0,
        refund_count: 0,
        failure_count: 0,
        reputation_score: 0,
    })
}

fn save_rep(env: &Env, service_id: u32, r: &ReputationRecord) {
    let key = (symbol_short!("rep"), service_id);
    env.storage().persistent().set(&key, r);
}

fn next_service_id(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&symbol_short!("nsvc"))
        .unwrap_or(1u32)
}

fn set_next_service_id(env: &Env, v: u32) {
    env.storage().instance().set(&symbol_short!("nsvc"), &v);
}

fn next_escrow_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&symbol_short!("nesc"))
        .unwrap_or(1u64)
}

fn set_next_escrow_id(env: &Env, v: u64) {
    env.storage().instance().set(&symbol_short!("nesc"), &v);
}

fn validate_asset(asset: &String) -> Result<(), ContractError> {
    if asset.len() == 0 {
        return Err(ContractError::UnknownAsset);
    }
    Ok(())
}

fn assert_service_usable(env: &Env, id: u32) -> Result<ServiceRecord, ContractError> {
    let s = load_service(env, id).ok_or(ContractError::ServiceNotFound)?;
    if s.status == STATUS_DISABLED {
        return Err(ContractError::ServiceDisabled);
    }
    Ok(s)
}

#[contractimpl]
impl AgentMarket {
    /// One-time setup. Restricted: deployer/admin flow via first caller as admin param.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&symbol_short!("adm")) {
            return Err(ContractError::InvalidStateTransition);
        }
        env.storage().instance().set(&symbol_short!("adm"), &admin);
        set_next_service_id(&env, 1);
        set_next_escrow_id(&env, 1);
        Ok(())
    }

    /// Restricted: authenticated registrant becomes owner.
    pub fn register_service(
        env: Env,
        owner: Address,
        name: String,
        endpoint: String,
        description: String,
        price: i128,
        asset: String,
        access_mode: u32,
    ) -> Result<u32, ContractError> {
        admin(&env)?;
        owner.require_auth();
        validate_asset(&asset)?;
        if price < 0 {
            return Err(ContractError::InvalidPrice);
        }
        if access_mode > ACCESS_RESTRICTED {
            return Err(ContractError::InvalidStateTransition);
        }
        let t = now(&env);
        let id = next_service_id(&env);
        let owner_key = (symbol_short!("oname"), owner.clone(), name.clone());
        if env.storage().persistent().has(&owner_key) {
            return Err(ContractError::DuplicateRegistration);
        }
        let rec = ServiceRecord {
            service_id: id,
            owner: owner.clone(),
            name: name.clone(),
            endpoint,
            description,
            price,
            asset: asset.clone(),
            access_mode,
            status: STATUS_ACTIVE,
            price_version: 1,
            created_at: t,
            updated_at: t,
        };
        save_service(&env, &rec);
        env.storage().persistent().set(&owner_key, &id);
        set_next_service_id(&env, id + 1);
        env.events().publish(
            (symbol_short!("svc_reg"), owner.clone(), id),
            (name, price, asset),
        );
        Ok(id)
    }

    /// Restricted: service owner.
    pub fn update_service(
        env: Env,
        owner: Address,
        service_id: u32,
        name: String,
        endpoint: String,
        description: String,
    ) -> Result<(), ContractError> {
        owner.require_auth();
        let mut s = load_service(&env, service_id).ok_or(ContractError::ServiceNotFound)?;
        if s.owner != owner {
            return Err(ContractError::Unauthorized);
        }
        let old_key = (symbol_short!("oname"), s.owner.clone(), s.name.clone());
        env.storage().persistent().remove(&old_key);
        s.name = name.clone();
        s.endpoint = endpoint;
        s.description = description;
        s.updated_at = now(&env);
        let new_key = (symbol_short!("oname"), s.owner.clone(), name);
        if env.storage().persistent().has(&new_key) {
            return Err(ContractError::DuplicateRegistration);
        }
        env.storage().persistent().set(&new_key, &service_id);
        save_service(&env, &s);
        env.events()
            .publish((symbol_short!("svc_upd"), s.owner.clone(), service_id), ());
        Ok(())
    }

    /// Restricted: service owner.
    pub fn disable_service(env: Env, owner: Address, service_id: u32) -> Result<(), ContractError> {
        owner.require_auth();
        let mut s = load_service(&env, service_id).ok_or(ContractError::ServiceNotFound)?;
        if s.owner != owner {
            return Err(ContractError::Unauthorized);
        }
        s.status = STATUS_DISABLED;
        s.updated_at = now(&env);
        save_service(&env, &s);
        env.events()
            .publish((symbol_short!("svc_dis"), owner, service_id), ());
        Ok(())
    }

    /// Restricted: service owner. Increments `price_version`.
    pub fn set_price(env: Env, owner: Address, service_id: u32, new_price: i128) -> Result<(), ContractError> {
        owner.require_auth();
        if new_price < 0 {
            return Err(ContractError::InvalidPrice);
        }
        let mut s = load_service(&env, service_id).ok_or(ContractError::ServiceNotFound)?;
        if s.owner != owner {
            return Err(ContractError::Unauthorized);
        }
        s.price = new_price;
        s.price_version = s.price_version.saturating_add(1);
        s.updated_at = now(&env);
        save_service(&env, &s);
        env.events().publish(
            (symbol_short!("price"), service_id, s.price_version),
            new_price,
        );
        Ok(())
    }

    /// Public read.
    pub fn get_service(env: Env, service_id: u32) -> Result<Option<ServiceRecord>, ContractError> {
        admin(&env)?;
        Ok(load_service(&env, service_id))
    }

    /// Public read (paginate by id).
    pub fn list_services(
        env: Env,
        start_after: u32,
        limit: u32,
    ) -> Result<Vec<ServiceRecord>, ContractError> {
        admin(&env)?;
        let cap = limit.min(32);
        let next = next_service_id(&env);
        let mut out = Vec::new(&env);
        let mut id = if start_after == 0 {
            1u32
        } else {
            start_after.saturating_add(1)
        };
        while id < next && out.len() < cap {
            if let Some(s) = load_service(&env, id) {
                out.push_back(s);
            }
            id = id.saturating_add(1);
        }
        Ok(out)
    }

    /// Public read with optional filters (`FILTER_ANY` = ignore).
    pub fn list_services_filter(
        env: Env,
        status_filter: u32,
        access_filter: u32,
        start_after: u32,
        limit: u32,
    ) -> Result<Vec<ServiceRecord>, ContractError> {
        admin(&env)?;
        let cap = limit.min(32);
        let next = next_service_id(&env);
        let mut out = Vec::new(&env);
        let mut id = if start_after == 0 {
            1u32
        } else {
            start_after.saturating_add(1)
        };
        while id < next && out.len() < cap {
            if let Some(s) = load_service(&env, id) {
                let ok_status = status_filter == FILTER_ANY || s.status == status_filter;
                let ok_access = access_filter == FILTER_ANY || s.access_mode == access_filter;
                if ok_status && ok_access {
                    out.push_back(s);
                }
            }
            id = id.saturating_add(1);
        }
        Ok(out)
    }

    /// Paid flow: payer opens escrow against a service (logical reservation).
    pub fn open_escrow(
        env: Env,
        payer: Address,
        service_id: u32,
        amount: i128,
        asset: String,
        request_id: u64,
        tx_hash: Bytes,
    ) -> Result<u64, ContractError> {
        payer.require_auth();
        admin(&env)?;
        let svc = assert_service_usable(&env, service_id)?;
        validate_asset(&asset)?;
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }
        if svc.asset != asset {
            return Err(ContractError::UnknownAsset);
        }
        let rep = load_rep(&env, service_id);
        if rep.reputation_score < -1000 {
            return Err(ContractError::ReputationTooLow);
        }
        let key = (symbol_short!("sreq"), request_id);
        if env.storage().persistent().has(&key) {
            return Err(ContractError::DuplicateRegistration);
        }
        let eid = next_escrow_id(&env);
        let t = now(&env);
        let rec = EscrowRecord {
            id: eid,
            payer: payer.clone(),
            payee: svc.owner.clone(),
            service_id,
            amount,
            asset,
            state: EscrowState::Open,
            request_id,
            created_at: t,
            updated_at: t,
            tx_hash,
        };
        let ekey = (symbol_short!("esc"), eid);
        env.storage().persistent().set(&ekey, &rec);
        env.storage().persistent().set(&key, &eid);
        set_next_escrow_id(&env, eid.saturating_add(1));
        env.events().publish((symbol_short!("esc_open"), eid, request_id), amount);
        Ok(eid)
    }

    pub fn lock_escrow(env: Env, payer: Address, escrow_id: u64) -> Result<(), ContractError> {
        payer.require_auth();
        admin(&env)?;
        let ekey = (symbol_short!("esc"), escrow_id);
        let mut e: EscrowRecord = env
            .storage()
            .persistent()
            .get(&ekey)
            .ok_or(ContractError::EscrowNotFound)?;
        if e.payer != payer {
            return Err(ContractError::Unauthorized);
        }
        if !matches!(e.state, EscrowState::Open) {
            return Err(ContractError::EscrowAlreadyLocked);
        }
        e.state = EscrowState::Locked;
        e.updated_at = now(&env);
        env.storage().persistent().set(&ekey, &e);
        env.events().publish((symbol_short!("esc_lok"), escrow_id), ());
        Ok(())
    }

    /// Service owner marks execution complete; funds still held until verify/release.
    pub fn execute_escrow(env: Env, owner: Address, escrow_id: u64) -> Result<(), ContractError> {
        owner.require_auth();
        admin(&env)?;
        let ekey = (symbol_short!("esc"), escrow_id);
        let mut e: EscrowRecord = env
            .storage()
            .persistent()
            .get(&ekey)
            .ok_or(ContractError::EscrowNotFound)?;
        if e.payee != owner {
            return Err(ContractError::Unauthorized);
        }
        if !matches!(e.state, EscrowState::Locked) {
            return Err(ContractError::InvalidStateTransition);
        }
        e.state = EscrowState::PendingVerify;
        e.updated_at = now(&env);
        env.storage().persistent().set(&ekey, &e);
        env.events().publish((symbol_short!("esc_exe"), escrow_id), ());
        Ok(())
    }

    /// Payer verifies successful execution.
    pub fn verify_escrow(env: Env, payer: Address, escrow_id: u64) -> Result<(), ContractError> {
        payer.require_auth();
        admin(&env)?;
        let ekey = (symbol_short!("esc"), escrow_id);
        let mut e: EscrowRecord = env
            .storage()
            .persistent()
            .get(&ekey)
            .ok_or(ContractError::EscrowNotFound)?;
        if e.payer != payer {
            return Err(ContractError::Unauthorized);
        }
        if !matches!(e.state, EscrowState::PendingVerify) {
            return Err(ContractError::InvalidStateTransition);
        }
        e.state = EscrowState::Verified;
        e.updated_at = now(&env);
        env.storage().persistent().set(&ekey, &e);
        env.events().publish((symbol_short!("esc_vfy"), escrow_id), ());
        Ok(())
    }

    /// Admin releases after verification (coordinates payout offchain / via token contract).
    pub fn release_escrow(env: Env, admin_addr: Address, escrow_id: u64) -> Result<(), ContractError> {
        admin_addr.require_auth();
        require_admin(&env, &admin_addr)?;
        let ekey = (symbol_short!("esc"), escrow_id);
        let mut e: EscrowRecord = env
            .storage()
            .persistent()
            .get(&ekey)
            .ok_or(ContractError::EscrowNotFound)?;
        if !matches!(e.state, EscrowState::Verified) {
            return Err(ContractError::InvalidStateTransition);
        }
        e.state = EscrowState::Released;
        e.updated_at = now(&env);
        env.storage().persistent().set(&ekey, &e);
        env.events().publish((symbol_short!("esc_rel"), escrow_id), ());
        Ok(())
    }

    pub fn refund_escrow(env: Env, caller: Address, escrow_id: u64) -> Result<(), ContractError> {
        caller.require_auth();
        admin(&env)?;
        let a = admin(&env)?;
        let ekey = (symbol_short!("esc"), escrow_id);
        let mut e: EscrowRecord = env
            .storage()
            .persistent()
            .get(&ekey)
            .ok_or(ContractError::EscrowNotFound)?;
        let allowed = caller == e.payer || caller == a;
        if !allowed {
            return Err(ContractError::Unauthorized);
        }
        match e.state {
            EscrowState::Open | EscrowState::Locked | EscrowState::PendingVerify => {}
            EscrowState::Released => return Err(ContractError::EscrowAlreadyReleased),
            EscrowState::Refunded => return Err(ContractError::EscrowAlreadyRefunded),
            EscrowState::Verified => return Err(ContractError::InvalidStateTransition),
        }
        e.state = EscrowState::Refunded;
        e.updated_at = now(&env);
        env.storage().persistent().set(&ekey, &e);
        env.events().publish((symbol_short!("esc_ref"), escrow_id), ());
        Ok(())
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Result<Option<EscrowRecord>, ContractError> {
        admin(&env)?;
        let ekey = (symbol_short!("esc"), escrow_id);
        Ok(env.storage().persistent().get(&ekey))
    }

    /// Restricted: admin or service owner records settlement.
    pub fn record_settlement(
        env: Env,
        caller: Address,
        request_id: u64,
        service_id: u32,
        payer: Address,
        payee: Address,
        amount: i128,
        asset: String,
        status: u32,
        tx_ref: Bytes,
    ) -> Result<(), ContractError> {
        caller.require_auth();
        let s = load_service(&env, service_id).ok_or(ContractError::ServiceNotFound)?;
        let a = admin(&env)?;
        if caller != a && caller != s.owner {
            return Err(ContractError::Unauthorized);
        }
        validate_asset(&asset)?;
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }
        let key = (symbol_short!("settle"), request_id);
        if env.storage().persistent().has(&key) {
            return Err(ContractError::DuplicateRegistration);
        }
        let rec = SettlementRecord {
            request_id,
            service_id,
            payer: payer.clone(),
            payee: payee.clone(),
            amount,
            asset,
            status,
            ts: now(&env),
            tx_ref: tx_ref.clone(),
        };
        env.storage().persistent().set(&key, &rec);
        env.events().publish(
            (symbol_short!("set_rec"), request_id, service_id),
            (status, amount),
        );
        Ok(())
    }

    pub fn get_settlement(env: Env, request_id: u64) -> Result<Option<SettlementRecord>, ContractError> {
        admin(&env)?;
        let key = (symbol_short!("settle"), request_id);
        Ok(env.storage().persistent().get(&key))
    }

    pub fn get_action_receipt(env: Env, request_id: u64) -> Result<Option<ActionReceipt>, ContractError> {
        admin(&env)?;
        let st = match Self::get_settlement(env.clone(), request_id)? {
            Some(s) => s,
            None => return Ok(None),
        };
        let svc = load_service(&env, st.service_id).ok_or(ContractError::ServiceNotFound)?;
        Ok(Some(ActionReceipt {
            service_id: st.service_id,
            amount: st.amount,
            asset: st.asset,
            payer: st.payer,
            owner: svc.owner,
            settlement_status: st.status,
            chain_ref: st.tx_ref,
        }))
    }

    /// Restricted: explicit reputation updates (admin only).
    pub fn record_reputation_event(
        env: Env,
        admin_addr: Address,
        service_id: u32,
        event_kind: u32,
    ) -> Result<(), ContractError> {
        admin_addr.require_auth();
        require_admin(&env, &admin_addr)?;
        let _ = load_service(&env, service_id).ok_or(ContractError::ServiceNotFound)?;
        let mut r = load_rep(&env, service_id);
        match event_kind {
            0 => {
                r.completed_count = r.completed_count.saturating_add(1);
                r.successful_settlements = r.successful_settlements.saturating_add(1);
                r.reputation_score = r.reputation_score.saturating_add(10);
            }
            1 => {
                r.refund_count = r.refund_count.saturating_add(1);
                r.reputation_score = (r.reputation_score - 15).max(-10_000);
            }
            2 => {
                r.failure_count = r.failure_count.saturating_add(1);
                r.reputation_score = (r.reputation_score - 5).max(-10_000);
            }
            _ => return Err(ContractError::InvalidStateTransition),
        }
        save_rep(&env, service_id, &r);
        env.events()
            .publish((symbol_short!("rep_evt"), service_id, event_kind), r.reputation_score);
        Ok(())
    }

    pub fn get_reputation(env: Env, service_id: u32) -> Result<ReputationRecord, ContractError> {
        admin(&env)?;
        let _ = load_service(&env, service_id).ok_or(ContractError::ServiceNotFound)?;
        Ok(load_rep(&env, service_id))
    }
}

#[cfg(test)]
mod test;
