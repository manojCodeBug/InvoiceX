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

    #[allow(clippy::too_many_arguments)]
    pub fn create_invoice(
        env: Env,
        creator: Address,
        id: String,
        client: Address,
        amount: i128,
        title: String,
        description: String,
        due_date: u64,
    ) {
        creator.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let key = DataKey::Invoice(id.clone());
        if env.storage().persistent().has(&key) {
            panic!("invoice already exists");
        }
        let invoice = Invoice {
            id: id.clone(),
            creator: creator.clone(),
            client: client.clone(),
            amount,
            title,
            description,
            due_date,
            status: InvoiceStatus::Created,
        };
        env.storage().persistent().set(&key, &invoice);
        let mut list: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::InvoiceList)
            .unwrap_or(Vec::new(&env));
        list.push_back(id.clone());
        env.storage().persistent().set(&DataKey::InvoiceList, &list);
    }

    pub fn get_invoice(env: Env, id: String) -> Invoice {
        let key = DataKey::Invoice(id);
        if !env.storage().persistent().has(&key) {
            panic!("invoice not found");
        }
        env.storage().persistent().get(&key).unwrap()
    }

    pub fn get_all_invoices(env: Env) -> Vec<String> {
        env.storage()
            .persistent()
            .get(&DataKey::InvoiceList)
            .unwrap_or(Vec::new(&env))
    }
}
