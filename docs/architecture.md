# InvoiceX Architecture & Design Specification

This document outlines the planning, architectural decisions, and diagrams for the InvoiceX platform, built on Stellar and Soroban.

---

## 1. System Topology

InvoiceX uses a decoupled multi-contract architecture where the **InvoiceRegistry** serves as the single source of truth for invoice records, and the **PaymentManager** orchestrates payments, validates states, and updates registry entries via contract-to-contract (C2C) calls.

```mermaid
graph TD
    User[Client / Freelancer] -->|freighter / stellar-wallets-kit| Frontend[React + TS App]
    Frontend -->|Services Layer| RPC[Stellar Testnet RPC / Horizon]
    RPC -->|C2C Invocation| PM[PaymentManager Contract]
    PM -->|C2C State Update| IR[InvoiceRegistry Contract]
```

---

## 2. Folder Structure Blueprint

```text
InvoiceX/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── contracts/
│   ├── invoice_registry/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   └── types.rs
│   │   └── Cargo.toml
│   └── payment_manager/
│       ├── src/
│       │   └── lib.rs
│       └── Cargo.toml
├── docs/
│   └── architecture.md
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceDetails.tsx
│   │   ├── TransactionCenter.tsx
│   │   └── ActivityFeed.tsx
│   ├── hooks/
│   │   └── useInvoiceX.ts
│   ├── lib/
│   │   └── stellar-kit.ts
│   ├── services/
│   │   ├── contract.ts
│   │   ├── events.ts
│   │   ├── logging.ts
│   │   ├── network.ts
│   │   └── wallet.ts
│   ├── state/
│   │   └── store.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── tests/
│   │   ├── components.test.tsx
│   │   └── wallet.test.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── Cargo.toml
├── package.json
└── README.md
```

---

## 3. Invoice State Machine

Invoices follow a strict, one-way state transition validation to prevent double-payments or illegal cancellations:

```mermaid
stateDiagram-v2
    [*] --> Created : creator invokes create_invoice
    Created --> Paid : client pays via PaymentManager
    Created --> Cancelled : creator cancels invoice
    Paid --> [*]
    Cancelled --> [*]
```

### State Constraints:
- An invoice can only transition from `Created` to `Paid` or `Cancelled`.
- Transitions from `Paid` or `Cancelled` to any other state are rejected with access control errors.

---

## 4. Inter-Contract Communication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant PM as PaymentManager Contract
    participant IR as InvoiceRegistry Contract
    participant Token as Native XLM Token Contract

    Client->>PM: pay_invoice(invoice_id)
    Note over PM: Read Registry Contract Address
    PM->>IR: get_invoice(invoice_id)
    IR-->>PM: return InvoiceState (amount, creator, status)
    Note over PM: Validate invoice.status == Created
    PM->>Token: transfer(client, creator, amount)
    Token-->>PM: return Success
    PM->>IR: update_invoice_status(invoice_id, Paid)
    IR-->>PM: return Success
    PM->>Client: Emit PaymentProcessed Event
```

---

## 5. Event Emission & Subscription Architecture

All critical state transitions emit structured events to facilitate external indexing (e.g., via Mercury, Zephyr, or RPC polling):

```mermaid
graph LR
    Contract[Soroban Contract] -->|emit_event| Ledger[Stellar Ledger]
    Ledger -->|Event Polling / Streaming| Service[Event Streaming Layer]
    Service -->|Filter & Parse| Store[Zustand State Store]
    Store -->|Reactive Binding| UI[Activity Feed / Notification Popups]
```

### Event Structs:
- **`InvoiceCreated`**: `[invoice_id, creator, amount, client]`
- **`InvoicePaid`**: `[invoice_id, payer, amount]`
- **`InvoiceCancelled`**: `[invoice_id]`
- **`PaymentProcessed`**: `[invoice_id, amount, tx_hash]`

---

## 6. Deployment Architecture

```mermaid
flowchart TD
    Build[Cargo Build WASM] --> Optimize[Soroban Contract Optimize]
    Optimize --> DeployIR[Deploy InvoiceRegistry WASM]
    Optimize --> DeployPM[Deploy PaymentManager WASM]
    DeployIR --> InitIR[Initialize InvoiceRegistry with Admin]
    DeployPM --> InitPM[Initialize PaymentManager with Registry Address]
    InitIR --> Frontend[Link addresses in client services/network.ts]
    InitPM --> Frontend
```
