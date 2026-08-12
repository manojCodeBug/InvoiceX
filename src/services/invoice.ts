import { 
  createInvoiceContract, 
  payInvoiceContract, 
  cancelInvoiceContract, 
  getSimulatedInvoices,
  getSimulatedEvents,
  type InvoiceContractState
} from './contract';
import { getWalletState } from './wallet';
import { getTransactionHistory } from './transactions';

export interface InvoiceFormInput {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  notes: string;
}

export function validateInvoiceInput(input: InvoiceFormInput): string | null {
  if (!input.clientName.trim()) return 'Client name is required';
  if (!input.clientEmail.trim()) return 'Client email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.clientEmail.trim())) return 'Invalid client email address';
  if (!input.clientAddress.trim()) return 'Client Stellar address is required';
  if (!/^[GC][A-Z2-7]{55}$/.test(input.clientAddress.trim())) return 'Invalid client Stellar address (must start with G or C, 56 characters)';
  if (!input.title.trim()) return 'Invoice title is required';
  if (!input.description.trim()) return 'Description is required';
  
  const amt = parseFloat(input.amount);
  if (isNaN(amt) || amt <= 0) return 'Amount must be a positive number';
  if (!input.dueDate) return 'Due date is required';
  
  const dueDateObj = new Date(input.dueDate);
  if (isNaN(dueDateObj.getTime())) return 'Invalid due date';
  
  return null;
}

export async function createInvoice(input: InvoiceFormInput): Promise<{ success: boolean; invoiceId: string; txHash: string; error?: string }> {
  const validationError = validateInvoiceInput(input);
  if (validationError) {
    return { success: false, invoiceId: '', txHash: '', error: validationError };
  }

  const wallet = await getWalletState();
  if (!wallet.isConnected || !wallet.address) {
    return { success: false, invoiceId: '', txHash: '', error: 'Wallet not connected' };
  }

  return await createInvoiceContract(wallet.address, {
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim(),
    clientAddress: input.clientAddress.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    amount: input.amount.trim(),
    dueDate: input.dueDate,
    notes: input.notes.trim(),
  });
}

export async function payInvoice(invoiceId: string): Promise<{ success: boolean; txHash: string; error?: string }> {
  const wallet = await getWalletState();
  if (!wallet.isConnected || !wallet.address) {
    return { success: false, txHash: '', error: 'Wallet not connected' };
  }

  const invoices = getInvoices();
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return { success: false, txHash: '', error: 'Invoice not found' };
  }

  if (invoice.status !== 'pending') {
    return { success: false, txHash: '', error: `Invoice is already ${invoice.status}` };
  }

  // Check balance
  const walletBalance = parseFloat(wallet.balance);
  const paymentAmount = parseFloat(invoice.amount);
  if (walletBalance < paymentAmount) {
    return { success: false, txHash: '', error: 'Insufficient XLM balance for payment' };
  }

  return await payInvoiceContract(wallet.address, invoiceId, invoice.amount, invoice.clientName);
}

export async function cancelInvoice(invoiceId: string): Promise<{ success: boolean; txHash: string; error?: string }> {
  const wallet = await getWalletState();
  if (!wallet.isConnected || !wallet.address) {
    return { success: false, txHash: '', error: 'Wallet not connected' };
  }

  const invoices = getInvoices();
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    return { success: false, txHash: '', error: 'Invoice not found' };
  }

  if (invoice.creator !== wallet.address) {
    return { success: false, txHash: '', error: 'Only the invoice creator can cancel it' };
  }

  if (invoice.status !== 'pending') {
    return { success: false, txHash: '', error: `Invoice is already ${invoice.status}` };
  }

  return await cancelInvoiceContract(wallet.address, invoiceId, invoice.clientName, invoice.amount);
}

export function getInvoices(): InvoiceContractState[] {
  return getSimulatedInvoices();
}

export function getInvoiceById(id: string): InvoiceContractState | undefined {
  return getInvoices().find((i) => i.id === id);
}

export interface ActivityFeedItem {
  id: string;
  type: 'invoice_created' | 'invoice_paid' | 'invoice_cancelled' | 'tx_processing' | 'tx_failed';
  title: string;
  description: string;
  timestamp: number;
  hash: string;
}

export function getCombinedActivityFeed(): ActivityFeedItem[] {
  const events = getSimulatedEvents();
  const txs = getTransactionHistory();

  const feed: ActivityFeedItem[] = [];

  // Map events
  events.forEach((evt) => {
    let type: ActivityFeedItem['type'] = 'invoice_created';
    let title = 'Invoice Created';
    let description = `Invoice of ${evt.amount} XLM was created`;

    if (evt.type === 'paid') {
      type = 'invoice_paid';
      title = 'Payment Received';
      description = `Invoice paid: +${evt.amount} XLM from client`;
    } else if (evt.type === 'cancelled') {
      type = 'invoice_cancelled';
      title = 'Invoice Cancelled';
      description = `Invoice was voided/cancelled by owner`;
    }

    feed.push({
      id: evt.id,
      type,
      title,
      description,
      timestamp: evt.timestamp,
      hash: evt.txHash,
    });
  });

  // Map pending or failed transactions
  txs.forEach((tx) => {
    if (tx.status === 'processing') {
      feed.push({
        id: tx.id,
        type: 'tx_processing',
        title: 'Transaction Broadcasting',
        description: `Broadcasting ${tx.type === 'pay' ? 'payment' : tx.type === 'cancel' ? 'cancellation' : 'creation'} transaction...`,
        timestamp: tx.timestamp,
        hash: tx.hash || tx.id,
      });
    } else if (tx.status === 'failed') {
      feed.push({
        id: tx.id,
        type: 'tx_failed',
        title: 'Transaction Failed',
        description: `${tx.type === 'pay' ? 'Payment' : tx.type === 'cancel' ? 'Cancellation' : 'Invoice creation'} transaction failed or was rejected`,
        timestamp: tx.timestamp,
        hash: tx.hash || tx.id,
      });
    }
  });

  // Sort by timestamp descending
  return feed.sort((a, b) => b.timestamp - a.timestamp);
}
