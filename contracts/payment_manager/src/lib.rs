#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol
};

// Define invoice status enum locally (matching invoice_registry XDR schema)
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum InvoiceStatus {
    Created = 0,
    Paid = 1,
    Cancelled = 2,
}

// Define the core Invoice structure locally (matching invoice_registry XDR schema)
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

// Define the client interface for invoice_registry contract-to-contract calls
#[soroban_sdk::contractclient(name = "InvoiceRegistryClient")]
pub trait InvoiceRegistryClientTrait {
    fn get_invoice(env: Env, id: String) -> Invoice;
    fn set_paid(env: Env, caller: Address, id: String);
}

// Storage keys
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
    // Initialize the PaymentManager with references to dependencies
    pub fn initialize(env: Env, admin: Address, token: Address, registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Registry, &registry);
    }

    // Get Admin Address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    // Get Token Address
    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    // Get Registry Address
    pub fn get_registry(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Registry).unwrap()
    }

    // Process a payment for an invoice (Client invokes this)
    pub fn pay_invoice(env: Env, client: Address, invoice_id: String) {
        // Authenticate client paying the invoice
        client.require_auth();

        let token_addr = Self::get_token(env.clone());
        let registry_addr = Self::get_registry(env.clone());

        // Instantiate clients for other contracts
        let token_client = soroban_sdk::token::Client::new(&env, &token_addr);
        let registry_client = InvoiceRegistryClient::new(&env, &registry_addr);

        // Fetch invoice details from Registry (Contract-to-Contract Call)
        let invoice: Invoice = registry_client.get_invoice(&invoice_id);

        // Validate client is the designated payer
        if client != invoice.client {
            panic!("caller is not the designated client");
        }

        // Validate invoice status is Created
        if invoice.status != InvoiceStatus::Created {
            panic!("invoice status is not Created");
        }

        // Transfer payment from client to creator (Stellar Asset Contract Call)
        token_client.transfer(&client, &invoice.creator, &invoice.amount);

        // Update Registry invoice status to Paid (Contract-to-Contract Call)
        registry_client.set_paid(&env.current_contract_address(), &invoice_id);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "payment_processed"), invoice_id.clone(), client.clone()),
            (invoice.creator.clone(), invoice.amount),
        );
    }
}

mod test;
