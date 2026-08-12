import {
  Operation,
  TransactionBuilder,
  Networks,
  rpc,
  nativeToScVal,
  Horizon,
  Address,
  Account,
  scValToNative,
  StrKey
} from '@stellar/stellar-sdk';
import { getNetworkConfig } from './network';
import { signTxWithWallet } from './wallet';
import { addTransaction, updateTransactionStatus } from './transactions';

export interface InvoiceContractState {
  id: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  title: string;
  description: string;
  amount: string; // XLM
  dueDate: string;
  notes: string;
  creator: string;
  status: 'pending' | 'paid' | 'cancelled';
  txHash: string;
  payTxHash?: string;
  cancelTxHash?: string;
  timestamp: number;
}

// Global in-memory list for simulator mode, backed by LocalStorage
const SIMULATED_INVOICES_KEY = 'invoicex_simulated_invoices';

const MOCK_INVOICES: InvoiceContractState[] = [
  {
    id: 'inv_lh2026',
    clientName: 'Lighthouse NFT Marketplace',
    clientEmail: 'info@lighthousenft.xyz',
    clientAddress: 'GBMOCKCLIENTLH2026XXXYYYZZZAAABBBCCC',
    title: 'Soroban Asset Minting Portal UI',
    description: 'Frontend implementation of Web3 wallet authentication and token minting widgets using React & TailwindCSS.',
    amount: '2200.0000',
    dueDate: '2026-07-31',
    notes: 'Please release payment upon successful staging deployment review.',
    creator: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    status: 'pending',
    txHash: 'sim_hash_create_lh0192830293',
    timestamp: Date.now() - 5 * 3600 * 1000, // 5 hours ago
  },
  {
    id: 'inv_ult2026',
    clientName: 'Ultra Stellar LLC',
    clientEmail: 'finance@ultrastellar.com',
    clientAddress: 'GBMOCKCLIENTULT2026XXXYYYZZZAAABBBCCC',
    title: 'LumenPay Integration Design System',
    description: 'Creation of typography, component styling, and CSS structures following the Technical Prestige design guidelines.',
    amount: '4800.0000',
    dueDate: '2026-07-20',
    notes: 'Payable in XLM native tokens only.',
    creator: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    status: 'pending',
    txHash: 'sim_hash_create_ult5839201948',
    timestamp: Date.now() - 1 * 24 * 3600 * 1000, // 1 day ago
  },
  {
    id: 'inv_sdf2026',
    clientName: 'Stellar Development Foundation',
    clientEmail: 'billing@stellar.org',
    clientAddress: 'GBMOCKCLIENTSDF2026XXXYYYZZZAAABBBCCC',
    title: 'Soroban Smart Contract Integration Audit',
    description: 'Security audit and integration support for the core escrow contracts on Stellar Testnet.',
    amount: '12500.0000',
    dueDate: '2026-08-15',
    notes: 'Net-30 payment terms. Funded via testnet pool.',
    creator: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    status: 'paid',
    txHash: 'sim_hash_create_sdf9812739812',
    payTxHash: 'sim_hash_pay_sdf09812039812',
    timestamp: Date.now() - 3 * 24 * 3600 * 1000, // 3 days ago
  },
  {
    id: 'inv_sat2026',
    clientName: 'SatoshiPay Limited',
    clientEmail: 'ap@satoshipay.io',
    clientAddress: 'GBMOCKCLIENTSAT2026XXXYYYZZZAAABBBCCC',
    title: 'Cross-Border Micropayments API v2',
    description: 'Technical development and code review of the Stellar Horizon client wrapper module for payment channels.',
    amount: '8500.0000',
    dueDate: '2026-06-30',
    notes: 'This project was paused. Invoice cancelled by client request.',
    creator: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    status: 'cancelled',
    txHash: 'sim_hash_create_sat7482910392',
    cancelTxHash: 'sim_hash_cancel_sat0293029302',
    timestamp: Date.now() - 10 * 24 * 3600 * 1000, // 10 days ago
  }
];

const MOCK_EVENTS: ContractEvent[] = [
  {
    id: 'evt_1',
    type: 'created',
    invoiceId: 'inv_lh2026',
    amount: '2200.0000',
    actor: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    timestamp: Date.now() - 5 * 3600 * 1000,
    txHash: 'sim_hash_create_lh0192830293',
  },
  {
    id: 'evt_2',
    type: 'created',
    invoiceId: 'inv_ult2026',
    amount: '4800.0000',
    actor: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    timestamp: Date.now() - 1 * 24 * 3600 * 1000,
    txHash: 'sim_hash_create_ult5839201948',
  },
  {
    id: 'evt_3',
    type: 'paid',
    invoiceId: 'inv_sdf2026',
    amount: '12500.0000',
    actor: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    timestamp: Date.now() - 2 * 24 * 3600 * 1000,
    txHash: 'sim_hash_pay_sdf09812039812',
  },
  {
    id: 'evt_4',
    type: 'created',
    invoiceId: 'inv_sdf2026',
    amount: '12500.0000',
    actor: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    timestamp: Date.now() - 3 * 24 * 3600 * 1000,
    txHash: 'sim_hash_create_sdf9812739812',
  },
  {
    id: 'evt_5',
    type: 'cancelled',
    invoiceId: 'inv_sat2026',
    amount: '8500.0000',
    actor: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    timestamp: Date.now() - 9 * 24 * 3600 * 1000,
    txHash: 'sim_hash_cancel_sat0293029302',
  },
  {
    id: 'evt_6',
    type: 'created',
    invoiceId: 'inv_sat2026',
    amount: '8500.0000',
    actor: 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ',
    timestamp: Date.now() - 10 * 24 * 3600 * 1000,
    txHash: 'sim_hash_create_sat7482910392',
  }
];

export function getSimulatedInvoices(): InvoiceContractState[] {
  try {
    const data = localStorage.getItem(SIMULATED_INVOICES_KEY);
    if (!data) {
      localStorage.setItem(SIMULATED_INVOICES_KEY, JSON.stringify(MOCK_INVOICES));
      return MOCK_INVOICES;
    }
    const parsed: InvoiceContractState[] = JSON.parse(data);
    return parsed.map(inv => ({
      ...inv,
      clientAddress: inv.clientAddress || 'GBMOCKCLIENTDEFAULT2026XXXYYYZZZAAABBBCCC'
    }));
  } catch {
    return MOCK_INVOICES;
  }
}

export function saveSimulatedInvoices(invoices: InvoiceContractState[]): void {
  localStorage.setItem(SIMULATED_INVOICES_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new Event('invoicex_invoices_change'));
  window.dispatchEvent(new Event('invoicex_events_update'));
}

// Soroban event interface
export interface ContractEvent {
  id: string;
  type: 'created' | 'paid' | 'cancelled';
  invoiceId: string;
  amount: string;
  actor: string;
  timestamp: number;
  txHash: string;
}

export function getSimulatedEvents(): ContractEvent[] {
  try {
    const data = localStorage.getItem('invoicex_simulated_events');
    if (!data) {
      localStorage.setItem('invoicex_simulated_events', JSON.stringify(MOCK_EVENTS));
      return MOCK_EVENTS;
    }
    return JSON.parse(data);
  } catch {
    return MOCK_EVENTS;
  }
}

export function saveSimulatedEvents(events: ContractEvent[]): void {
  localStorage.setItem('invoicex_simulated_events', JSON.stringify(events));
  window.dispatchEvent(new Event('invoicex_events_update'));
}

export function addSimulatedEvent(event: Omit<ContractEvent, 'id' | 'timestamp'>) {
  const events = getSimulatedEvents();
  const newEvent: ContractEvent = {
    ...event,
    id: `evt_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  events.unshift(newEvent);
  saveSimulatedEvents(events);
}

export function isValidStellarAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  try {
    return StrKey.isValidEd25519PublicKey(address) || StrKey.isValidContract(address);
  } catch {
    return false;
  }
}

// --- On-Chain Integration Helpers ---