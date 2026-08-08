#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec
};

// Define invoice status enum
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum InvoiceStatus {
    Created = 0,
    Paid = 1,
    Cancelled = 2,
}

// Define the core Invoice structure
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Invoice {
    pub id: String,
    pub creator: Address,
    pub client: Address,
    pub amount: i128, // Amount in Stroops
    pub title: String,
    pub description: String,
    pub due_date: u64, // Epoch timestamp
    pub status: InvoiceStatus,
}

// Storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    PaymentManager,
    Invoice(String), // Individual invoice map
    InvoiceList,     // List of all invoice IDs
}

#[contract]
pub struct InvoiceRegistry;

#[contractimpl]
#[allow(clippy::too_many_arguments)]
impl InvoiceRegistry {
    // Initialize the contract with admin and payment manager addresses
    pub fn initialize(env: Env, admin: Address, payment_manager: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PaymentManager, &payment_manager);
    }

    // Get Admin Address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    // Get Payment Manager Address
    pub fn get_payment_manager(env: Env) -> Address {
        env.storage().instance().get(&DataKey::PaymentManager).unwrap()
    }

    // Create a new invoice (invoked by creator)
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
        // Authenticate creator
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

        // Write to persistent storage
        env.storage().persistent().set(&key, &invoice);

        // Update list of invoices
        let mut list: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::InvoiceList)
            .unwrap_or(Vec::new(&env));
        list.push_back(id.clone());
        env.storage().persistent().set(&DataKey::InvoiceList, &list);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "invoice_created"), id.clone(), creator.clone()),
            (client, amount),
        );
    }

    // Retrieve an invoice
    pub fn get_invoice(env: Env, id: String) -> Invoice {
        let key = DataKey::Invoice(id);
        if !env.storage().persistent().has(&key) {
            panic!("invoice not found");
        }
        env.storage().persistent().get(&key).unwrap()
    }

    // Fetch all invoice IDs
    pub fn get_all_invoices(env: Env) -> Vec<String> {
        env.storage()
            .persistent()
            .get(&DataKey::InvoiceList)
            .unwrap_or(Vec::new(&env))
    }

    // Mark invoice as paid (Restricted to PaymentManager)
    pub fn set_paid(env: Env, caller: Address, id: String) {
        caller.require_auth();

        let payment_mgr = Self::get_payment_manager(env.clone());
        if caller != payment_mgr {
            panic!("unauthorized status transition");
        }

        let key = DataKey::Invoice(id.clone());
        let mut invoice: Invoice = env.storage().persistent().get(&key).unwrap_or_else(|| {
            panic!("invoice not found");
        });

        if invoice.status != InvoiceStatus::Created {
            panic!("invoice cannot be paid in current state");
        }

        invoice.status = InvoiceStatus::Paid;
        env.storage().persistent().set(&key, &invoice);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "invoice_paid"), id.clone(), invoice.creator.clone()),
            (invoice.client.clone(), invoice.amount),
        );
    }

    // Cancel invoice (Restricted to Invoice Creator)
    pub fn cancel_invoice(env: Env, id: String) {
        let key = DataKey::Invoice(id.clone());
        let mut invoice: Invoice = env.storage().persistent().get(&key).unwrap_or_else(|| {
            panic!("invoice not found");
        });

        // Require creator signature
        invoice.creator.require_auth();

        if invoice.status != InvoiceStatus::Created {
            panic!("invoice cannot be cancelled in current state");
        }

        invoice.status = InvoiceStatus::Cancelled;
        env.storage().persistent().set(&key, &invoice);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "invoice_cancelled"), id.clone()),
            invoice.creator.clone(),
        );
    }
}

mod test;
