export interface TransactionItem {
  id: string; // generated UUID or Tx Hash
  invoiceId: string;
  type: 'create' | 'pay' | 'cancel';
  amount: string;
  clientName: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  hash: string;
  network: 'testnet' | 'simulator';
}

export function getTransactionHistory(): TransactionItem[] {
  try {
    const data = localStorage.getItem('invoicex_transactions');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error loading transaction history:', err);
    return [];
  }
}

export function saveTransactionHistory(txs: TransactionItem[]): void {
  try {
    localStorage.setItem('invoicex_transactions', JSON.stringify(txs));
    window.dispatchEvent(new Event('invoicex_transactions_change'));
  } catch (err) {
    console.error('Error saving transaction history:', err);
  }
}

export function addTransaction(tx: Omit<TransactionItem, 'timestamp'>): TransactionItem {
  const newTx: TransactionItem = {
    ...tx,
    timestamp: Date.now(),
  };
  const history = getTransactionHistory();
  history.unshift(newTx); // Newest first
  saveTransactionHistory(history);
  return newTx;
}

export function updateTransactionStatus(id: string, status: TransactionItem['status'], hash?: string): void {
  const history = getTransactionHistory();
  const txIndex = history.findIndex((t) => t.id === id || t.hash === id);
  if (txIndex !== -1) {
    history[txIndex].status = status;
    if (hash) {
      history[txIndex].hash = hash;
      history[txIndex].id = hash; // Map ID to final hash for standard lookups
    }
    saveTransactionHistory(history);
  }
}

export function clearTransactionHistory(): void {
  saveTransactionHistory([]);
}
