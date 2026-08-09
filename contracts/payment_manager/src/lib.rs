#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum InvoiceStatus {
    Created = 0,
    Paid = 1,
    Cancelled = 2,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Invoice {
    pub id: String,
    pub creator: Address,
    pub client: Address,
    pub amount: i128,
    pub title: String,
    pub description: String,
    pub due_date: u64,
    pub status: InvoiceStatus,
}

#[soroban_sdk::contractclient(name = "InvoiceRegistryClient")]
pub trait InvoiceRegistryClientTrait {
    fn get_invoice(env: Env, id: String) -> Invoice;
    fn set_paid(env: Env, caller: Address, id: String);
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Registry,
}

#[contract]
pub struct PaymentManager;

#[contractimpl]
impl PaymentManager {
    pub fn initialize(env: Env, admin: Address, token: Address, registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Registry, &registry);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    pub fn get_registry(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Registry).unwrap()
    }
}
