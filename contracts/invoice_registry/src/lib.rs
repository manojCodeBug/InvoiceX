#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec
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

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    PaymentManager,
    Invoice(String),
    InvoiceList,
}

#[contract]
pub struct InvoiceRegistry;

#[contractimpl]
impl InvoiceRegistry {
    pub fn initialize(env: Env, admin: Address, payment_manager: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PaymentManager, &payment_manager);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_payment_manager(env: Env) -> Address {
        env.storage().instance().get(&DataKey::PaymentManager).unwrap()
    }
}
