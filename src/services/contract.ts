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

function parseStatus(nativeStatus: any): 'pending' | 'paid' | 'cancelled' {
  if (typeof nativeStatus === 'string') {
    const s = nativeStatus.toLowerCase();
    if (s.includes('paid')) return 'paid';
    if (s.includes('cancel')) return 'cancelled';
    return 'pending';
  }
  if (typeof nativeStatus === 'object' && nativeStatus !== null) {
    const keys = Object.keys(nativeStatus);
    if (keys.length > 0) {
      const key = keys[0].toLowerCase();
      if (key.includes('paid')) return 'paid';
      if (key.includes('cancel')) return 'cancelled';
    }
  }
  if (typeof nativeStatus === 'number') {
    if (nativeStatus === 1) return 'paid';
    if (nativeStatus === 2) return 'cancelled';
  }
  return 'pending';
}

async function simulateReadOnlyCall(
  contractId: string,
  functionName: string,
  args: any[] = []
): Promise<any> {
  const config = getNetworkConfig();
  const rpcServer = new rpc.Server(config.rpcUrl);
  const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');

  const operation = Operation.invokeContractFunction({
    contract: contractId,
    function: functionName,
    args,
  });

  const tx = new TransactionBuilder(dummyAccount, {
    fee: '100000',
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const simResult = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation error for ${functionName}: ${simResult.error}`);
  }

  if (!simResult.result || !simResult.result.retval) {
    throw new Error(`No return value in simulation for ${functionName}`);
  }

  return scValToNative(simResult.result.retval);
}

export async function getOnChainInvoices(): Promise<InvoiceContractState[]> {
  const config = getNetworkConfig();
  if (config.mode === 'simulator') {
    return getSimulatedInvoices();
  }

  if (!isValidStellarAddress(config.contractId)) {
    console.warn(`[getOnChainInvoices] Invalid registry contract ID configured: ${config.contractId}. Falling back to simulator data.`);
    return getSimulatedInvoices();
  }

  try {
    const ids: any = await simulateReadOnlyCall(
      config.contractId,
      'get_all_invoices'
    );

    if (!ids || !Array.isArray(ids)) {
      return getSimulatedInvoices();
    }

    const localInvoices = getSimulatedInvoices();
    const invoices: InvoiceContractState[] = [];

    for (const idVal of ids) {
      try {
        const id = typeof idVal === 'string' ? idVal : idVal.toString();
        const nativeInvoice = await simulateReadOnlyCall(
          config.contractId,
          'get_invoice',
          [nativeToScVal(id)]
        );

        const status = parseStatus(nativeInvoice.status);
        const amount = (Number(nativeInvoice.amount) / 10000000).toFixed(4);
        const dueDate = new Date(Number(nativeInvoice.due_date) * 1000).toISOString().split('T')[0];

        const localMatch = localInvoices.find(i => i.id === id);

        invoices.push({
          id,
          clientName: localMatch?.clientName || `Client (${nativeInvoice.client.toString().substring(0, 6)}...)`,
          clientEmail: localMatch?.clientEmail || 'client@invoicex.org',
          clientAddress: nativeInvoice.client.toString(),
          title: nativeInvoice.title?.toString() || '',
          description: nativeInvoice.description?.toString() || '',
          amount,
          dueDate,
          notes: localMatch?.notes || '',
          creator: nativeInvoice.creator.toString(),
          status,
          txHash: localMatch?.txHash || '',
          payTxHash: localMatch?.payTxHash || (status === 'paid' ? 'onchain_payment' : undefined),
          cancelTxHash: localMatch?.cancelTxHash || (status === 'cancelled' ? 'onchain_cancellation' : undefined),
          timestamp: localMatch?.timestamp || (Number(nativeInvoice.due_date) * 1000),
        });
      } catch (e) {
        console.error(`Error decoding invoice ${idVal}:`, e);
      }
    }

    return invoices.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to fetch on-chain invoices:', error);
    return getSimulatedInvoices();
  }
}

export async function syncOnChainInvoices(): Promise<InvoiceContractState[]> {
  const config = getNetworkConfig();
  if (config.mode === 'simulator') {
    return getSimulatedInvoices();
  }

  try {
    const onChainInvoices = await getOnChainInvoices();
    localStorage.setItem(SIMULATED_INVOICES_KEY, JSON.stringify(onChainInvoices));
    window.dispatchEvent(new Event('invoicex_invoices_change'));
    window.dispatchEvent(new Event('invoicex_events_update'));
    return onChainInvoices;
  } catch (error) {
    console.error('Failed to sync on-chain invoices:', error);
    return getSimulatedInvoices();
  }
}

function parseEvent(event: any): ContractEvent | null {
  try {
    const topics = event.topic.map((t: any) => scValToNative(t));
    const value = scValToNative(event.value);
    const txHash = event.txHash;
    const timestamp = event.ledgerClosedAt ? new Date(event.ledgerClosedAt).getTime() : Date.now();

    if (topics.length === 0) return null;
    const eventTypeSymbol = topics[0];
    const eventType = typeof eventTypeSymbol === 'string' ? eventTypeSymbol : eventTypeSymbol?.toString();

    if (eventType === 'invoice_created') {
      const invoiceId = topics[1];
      const creator = topics[2];
      const amount = (Number(value[1]) / 10000000).toFixed(4);
      return {
        id: event.id,
        type: 'created',
        invoiceId,
        amount,
        actor: creator,
        timestamp,
        txHash,
      };
    } else if (eventType === 'invoice_paid') {
      const invoiceId = topics[1];
      const creator = topics[2];
      const amount = (Number(value[1]) / 10000000).toFixed(4);
      return {
        id: event.id,
        type: 'paid',
        invoiceId,
        amount,
        actor: creator,
        timestamp,
        txHash,
      };
    } else if (eventType === 'invoice_cancelled') {
      const invoiceId = topics[1];
      const creator = value;
      return {
        id: event.id,
        type: 'cancelled',
        invoiceId,
        amount: '0.0000',
        actor: creator,
        timestamp,
        txHash,
      };
    } else if (eventType === 'payment_processed') {
      const invoiceId = topics[1];
      const client = topics[2];
      const amount = (Number(value[1]) / 10000000).toFixed(4);
      return {
        id: event.id,
        type: 'paid',
        invoiceId,
        amount,
        actor: client,
        timestamp,
        txHash,
      };
    }
  } catch (err) {
    console.error('Error parsing contract event:', err);
  }
  return null;
}

export async function syncOnChainEvents(): Promise<ContractEvent[]> {
  const config = getNetworkConfig();
  if (config.mode === 'simulator') {
    return getSimulatedEvents();
  }

  try {
    const rpcServer = new rpc.Server(config.rpcUrl);
    const latestLedgerResponse = await rpcServer.getLatestLedger();
    const startLedger = Math.max(1, latestLedgerResponse.sequence - 5000);

    const eventsResponse = await rpcServer.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [config.contractId, config.paymentManagerContractId],
        }
      ],
      limit: 100,
    });

    const parsedEvents: ContractEvent[] = [];
    if (eventsResponse && eventsResponse.events) {
      for (const rawEvt of eventsResponse.events) {
        const parsed = parseEvent(rawEvt);
        if (parsed) {
          parsedEvents.push(parsed);
        }
      }
    }

    const cachedEvents = getSimulatedEvents();
    const allEvents = [...parsedEvents, ...cachedEvents];
    const uniqueEvents = allEvents.filter(
      (evt, index, self) => self.findIndex(e => e.id === evt.id) === index
    );

    localStorage.setItem('invoicex_simulated_events', JSON.stringify(uniqueEvents));
    window.dispatchEvent(new Event('invoicex_events_update'));
    return uniqueEvents;
  } catch (error) {
    console.error('Failed to sync on-chain events:', error);
    return getSimulatedEvents();
  }
}

/**
 * Creates an invoice
 */
export async function createInvoiceContract(
  creatorAddress: string,
  params: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    title: string;
    description: string;
    amount: string;
    dueDate: string;
    notes: string;
  }
): Promise<{ success: boolean; txHash: string; invoiceId: string; error?: string }> {
  const config = getNetworkConfig();
  const invoiceId = `inv_${Math.random().toString(36).substr(2, 9)}`;

  // Log a pending transaction to transaction history
  const txLog = addTransaction({
    id: `pending_${Math.random().toString(36).substr(2, 9)}`,
    invoiceId,
    type: 'create',
    amount: params.amount,
    clientName: params.clientName,
    status: 'pending',
    hash: '',
    network: config.mode,
  });

  if (config.mode === 'simulator') {
    // Simulate smart contract delay & confirmation
    updateTransactionStatus(txLog.id, 'processing');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const invoices = getSimulatedInvoices();
    const txHash = `sim_hash_create_${Math.random().toString(36).substr(2, 16)}`;

    const newInvoice: InvoiceContractState = {
      id: invoiceId,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      clientAddress: params.clientAddress,
      title: params.title,
      description: params.description,
      amount: params.amount,
      dueDate: params.dueDate,
      notes: params.notes,
      creator: creatorAddress,
      status: 'pending',
      txHash,
      timestamp: Date.now(),
    };

    invoices.unshift(newInvoice);
    saveSimulatedInvoices(invoices);

    // Add Contract Event
    addSimulatedEvent({
      type: 'created',
      invoiceId,
      amount: params.amount,
      actor: creatorAddress,
      txHash,
    });

    updateTransactionStatus(txLog.id, 'success', txHash);
    return { success: true, txHash, invoiceId };
  } else {
    // Testnet Mode (Soroban actual integration)
    try {
      updateTransactionStatus(txLog.id, 'processing');
      const rpcServer = new rpc.Server(config.rpcUrl);
      const horizonServer = new Horizon.Server(config.horizonUrl);

      // Load active account sequence
      const account = await horizonServer.loadAccount(creatorAddress);

      // Build Soroban operation matching create_invoice signature in registry contract
      const operation = Operation.invokeContractFunction({
        contract: config.contractId,
        function: 'create_invoice',
        args: [
          Address.fromString(creatorAddress).toScVal(),
          nativeToScVal(invoiceId),
          Address.fromString(params.clientAddress).toScVal(),
          nativeToScVal(BigInt(Math.round(parseFloat(params.amount) * 10000000)), { type: 'i128' }),
          nativeToScVal(params.title),
          nativeToScVal(params.description),
          nativeToScVal(BigInt(Math.floor(new Date(params.dueDate).getTime() / 1000))),
        ],
      });

      const tx = new TransactionBuilder(account, {
        fee: '100000', // Stroops max fee
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate Transaction to get transaction foot print and fee
      const simResult = await rpcServer.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simResult)) {
        throw new Error(`Simulation failed: ${simResult.error}`);
      }

      // Assemble simulated transaction (adds footprints, auth, resources etc.)
      const assembledTx = rpc.assembleTransaction(tx, simResult).build();

      // Sign with Wallet
      const signedTxXdr = await signTxWithWallet(assembledTx.toXDR(), creatorAddress);
      const finalTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);

      // Submit
      const sendResult = await rpcServer.sendTransaction(finalTx);
      if (sendResult.status === 'ERROR') {
        throw new Error(`RPC submission error: ${(sendResult as any).errorResultXdr || (sendResult as any).errorResult}`);
      }

      // Poll until completed
      let txResult = await rpcServer.getTransaction(sendResult.hash);
      let attempts = 0;
      while (txResult.status === 'NOT_FOUND' || txResult.status === 'SUCCESS' && txResult.resultMetaXdr === undefined) {
        if (attempts > 30) throw new Error('Transaction execution timeout');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        txResult = await rpcServer.getTransaction(sendResult.hash);
        attempts++;
      }

      if (txResult.status === 'FAILED') {
        throw new Error('Soroban contract execution failed');
      }

      // Save locally to display immediately
      const invoices = getSimulatedInvoices();
      const newInvoice: InvoiceContractState = {
        id: invoiceId,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        clientAddress: params.clientAddress,
        title: params.title,
        description: params.description,
        amount: params.amount,
        dueDate: params.dueDate,
        notes: params.notes,
        creator: creatorAddress,
        status: 'pending',
        txHash: sendResult.hash,
        timestamp: Date.now(),
      };
      invoices.unshift(newInvoice);
      saveSimulatedInvoices(invoices);

      // Add Contract Event
      addSimulatedEvent({
        type: 'created',
        invoiceId,
        amount: params.amount,
        actor: creatorAddress,
        txHash: sendResult.hash,
      });

      updateTransactionStatus(txLog.id, 'success', sendResult.hash);
      return { success: true, txHash: sendResult.hash, invoiceId };
    } catch (err: any) {
      console.error('Testnet Invoice Creation Failed:', err);
      updateTransactionStatus(txLog.id, 'failed');
      return { success: false, txHash: '', invoiceId: '', error: err.message || 'Unknown transaction error' };
    }
  }
}

/**
 * Pays an invoice
 */
export async function payInvoiceContract(
  payerAddress: string,
  invoiceId: string,
  amount: string,
  clientName: string
): Promise<{ success: boolean; txHash: string; error?: string }> {
  const config = getNetworkConfig();

  // Log a pending transaction to transaction history
  const txLog = addTransaction({
    id: `pending_${Math.random().toString(36).substr(2, 9)}`,
    invoiceId,
    type: 'pay',
    amount,
    clientName,
    status: 'pending',
    hash: '',
    network: config.mode,
  });

  if (config.mode === 'simulator') {
    // Simulator pay
    updateTransactionStatus(txLog.id, 'processing');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const invoices = getSimulatedInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    const txHash = `sim_hash_pay_${Math.random().toString(36).substr(2, 16)}`;

    if (index !== -1) {
      // Check simulated balance
      const currentSimBal = parseFloat(localStorage.getItem('invoicex_sim_balance') || '7500.00');
      const paymentAmount = parseFloat(amount);
      if (currentSimBal < paymentAmount) {
        updateTransactionStatus(txLog.id, 'failed');
        return { success: false, txHash: '', error: 'Insufficient simulated balance!' };
      }

      // Deduct balance and credit creator (simulated)
      localStorage.setItem('invoicex_sim_balance', (currentSimBal - paymentAmount).toFixed(4));

      invoices[index].status = 'paid';
      invoices[index].payTxHash = txHash;
      saveSimulatedInvoices(invoices);

      // Add Event
      addSimulatedEvent({
        type: 'paid',
        invoiceId,
        amount,
        actor: payerAddress,
        txHash,
      });

      updateTransactionStatus(txLog.id, 'success', txHash);
      window.dispatchEvent(new Event('invoicex_balance_change'));
      return { success: true, txHash };
    }

    updateTransactionStatus(txLog.id, 'failed');
    return { success: false, txHash: '', error: 'Invoice not found!' };
  } else {
    // Testnet Mode
    try {
      updateTransactionStatus(txLog.id, 'processing');
      const rpcServer = new rpc.Server(config.rpcUrl);
      const horizonServer = new Horizon.Server(config.horizonUrl);

      // Load active account sequence
      const account = await horizonServer.loadAccount(payerAddress);

      // Build Soroban operation on PaymentManager contract
      const operation = Operation.invokeContractFunction({
        contract: config.paymentManagerContractId,
        function: 'pay_invoice',
        args: [
          Address.fromString(payerAddress).toScVal(),
          nativeToScVal(invoiceId),
        ],
      });

      const tx = new TransactionBuilder(account, {
        fee: '150000',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate
      const simResult = await rpcServer.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simResult)) {
        throw new Error(`Simulation failed: ${simResult.error}`);
      }

      const assembledTx = rpc.assembleTransaction(tx, simResult).build();

      // Sign with Wallet
      const signedTxXdr = await signTxWithWallet(assembledTx.toXDR(), payerAddress);
      const finalTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);

      // Submit
      const sendResult = await rpcServer.sendTransaction(finalTx);
      if (sendResult.status === 'ERROR') {
        throw new Error(`RPC submission error: ${(sendResult as any).errorResultXdr || (sendResult as any).errorResult}`);
      }

      // Poll until completed
      let txResult = await rpcServer.getTransaction(sendResult.hash);
      while (txResult.status === 'NOT_FOUND' || txResult.status === 'SUCCESS' && txResult.resultMetaXdr === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        txResult = await rpcServer.getTransaction(sendResult.hash);
      }

      if (txResult.status === 'FAILED') {
        throw new Error('Soroban contract payment call failed');
      }

      // Update locally
      const invoices = getSimulatedInvoices();
      const index = invoices.findIndex((i) => i.id === invoiceId);
      if (index !== -1) {
        invoices[index].status = 'paid';
        invoices[index].payTxHash = sendResult.hash;
        saveSimulatedInvoices(invoices);
      }

      // Add Event
      addSimulatedEvent({
        type: 'paid',
        invoiceId,
        amount,
        actor: payerAddress,
        txHash: sendResult.hash,
      });

      updateTransactionStatus(txLog.id, 'success', sendResult.hash);
      return { success: true, txHash: sendResult.hash };
    } catch (err: any) {
      console.error('Testnet Invoice Payment Failed:', err);
      updateTransactionStatus(txLog.id, 'failed');
      return { success: false, txHash: '', error: err.message || 'Unknown payment error' };
    }
  }
}

/**
 * Cancels an invoice
 */
export async function cancelInvoiceContract(
  creatorAddress: string,
  invoiceId: string,
  clientName: string,
  amount: string
): Promise<{ success: boolean; txHash: string; error?: string }> {
  const config = getNetworkConfig();

  // Log pending transaction
  const txLog = addTransaction({
    id: `pending_${Math.random().toString(36).substr(2, 9)}`,
    invoiceId,
    type: 'cancel',
    amount,
    clientName,
    status: 'pending',
    hash: '',
    network: config.mode,
  });

  if (config.mode === 'simulator') {
    updateTransactionStatus(txLog.id, 'processing');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const invoices = getSimulatedInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    const txHash = `sim_hash_cancel_${Math.random().toString(36).substr(2, 16)}`;

    if (index !== -1) {
      invoices[index].status = 'cancelled';
      invoices[index].cancelTxHash = txHash;
      saveSimulatedInvoices(invoices);

      // Add Event
      addSimulatedEvent({
        type: 'cancelled',
        invoiceId,
        amount,
        actor: creatorAddress,
        txHash,
      });

      updateTransactionStatus(txLog.id, 'success', txHash);
      return { success: true, txHash };
    }

    updateTransactionStatus(txLog.id, 'failed');
    return { success: false, txHash: '', error: 'Invoice not found!' };
  } else {
    // Testnet Mode
    try {
      updateTransactionStatus(txLog.id, 'processing');
      const rpcServer = new rpc.Server(config.rpcUrl);
      const horizonServer = new Horizon.Server(config.horizonUrl);

      // Load active account sequence
      const account = await horizonServer.loadAccount(creatorAddress);

      // Build Soroban operation
      const operation = Operation.invokeContractFunction({
        contract: config.contractId,
        function: 'cancel_invoice',
        args: [
          nativeToScVal(invoiceId),
        ],
      });

      const tx = new TransactionBuilder(account, {
        fee: '120000',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate
      const simResult = await rpcServer.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simResult)) {
        throw new Error(`Simulation failed: ${simResult.error}`);
      }

      const assembledTx = rpc.assembleTransaction(tx, simResult).build();

      // Sign with Wallet
      const signedTxXdr = await signTxWithWallet(assembledTx.toXDR(), creatorAddress);
      const finalTx = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);

      // Submit
      const sendResult = await rpcServer.sendTransaction(finalTx);
      if (sendResult.status === 'ERROR') {
        throw new Error(`RPC submission error: ${(sendResult as any).errorResultXdr || (sendResult as any).errorResult}`);
      }

      // Poll until completed
      let txResult = await rpcServer.getTransaction(sendResult.hash);
      while (txResult.status === 'NOT_FOUND' || txResult.status === 'SUCCESS' && txResult.resultMetaXdr === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        txResult = await rpcServer.getTransaction(sendResult.hash);
      }

      if (txResult.status === 'FAILED') {
        throw new Error('Soroban contract cancellation call failed');
      }

      // Update locally
      const invoices = getSimulatedInvoices();
      const index = invoices.findIndex((i) => i.id === invoiceId);
      if (index !== -1) {
        invoices[index].status = 'cancelled';
        invoices[index].cancelTxHash = sendResult.hash;
        saveSimulatedInvoices(invoices);
      }

      // Add Event
      addSimulatedEvent({
        type: 'cancelled',
        invoiceId,
        amount,
        actor: creatorAddress,
        txHash: sendResult.hash,
      });

      updateTransactionStatus(txLog.id, 'success', sendResult.hash);
      return { success: true, txHash: sendResult.hash };
    } catch (err: any) {
      console.error('Testnet Invoice Cancellation Failed:', err);
      updateTransactionStatus(txLog.id, 'failed');
      return { success: false, txHash: '', error: err.message || 'Unknown cancellation error' };
    }
  }
}
