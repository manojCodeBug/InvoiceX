import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { getWalletState, type WalletState, fundWithFriendbot, connectWallet as connectWalletService, disconnectWallet as disconnectWalletService } from '../services/wallet';
import { getNetworkConfig, setNetworkMode, setContractId, setContractIds, type NetworkConfig } from '../services/network';
import { createInvoice, payInvoice, cancelInvoice, type InvoiceFormInput } from '../services/invoice';
import confetti from 'canvas-confetti';
import { syncOnChainInvoices, syncOnChainEvents } from '../services/contract';

export type PageName = 'landing' | 'dashboard' | 'create-invoice' | 'invoices' | 'invoice-details' | 'transactions' | '404';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface TransactionModalState {
  isOpen: boolean;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  message: string;
  txHash: string;
  invoiceId: string;
}

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  wallet: WalletState;
  networkConfig: NetworkConfig;
  currentPage: PageName;
  currentInvoiceId: string | null;
  navigateTo: (page: PageName, invoiceId?: string | null) => void;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  changeNetworkMode: (mode: 'testnet' | 'simulator') => void;
  updateContractIdVal: (contractId: string, pmContractId?: string) => void;
  fundWalletAccount: () => Promise<void>;
  createInvoiceAction: (input: InvoiceFormInput) => Promise<boolean>;
  payInvoiceAction: (invoiceId: string) => Promise<boolean>;
  cancelInvoiceAction: (invoiceId: string) => Promise<boolean>;
  txModal: TransactionModalState;
  closeTxModal: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  refreshWallet: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('invoicex_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0.0000',
    isConnected: false,
    walletType: null,
    network: 'InvoiceX Simulator',
    isAccountActive: false,
  });

  // Network configuration
  const [networkConfig, setNetworkConfigState] = useState<NetworkConfig>(getNetworkConfig());

  // Routing state
  const [currentPage, setCurrentPage] = useState<PageName>('landing');
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Transaction Modal state
  const [txModal, setTxModal] = useState<TransactionModalState>({
    isOpen: false,
    status: 'pending',
    message: '',
    txHash: '',
    invoiceId: '',
  });

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('invoicex_theme', theme);
  }, [theme]);

  // Route based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#landing';
      if (hash === '#landing') {
        setCurrentPage('landing');
      } else if (hash === '#dashboard') {
        setCurrentPage('dashboard');
      } else if (hash === '#create-invoice') {
        setCurrentPage('create-invoice');
      } else if (hash === '#invoices') {
        setCurrentPage('invoices');
      } else if (hash.startsWith('#invoice/')) {
        const id = hash.split('/')[1];
        if (id) {
          setCurrentInvoiceId(id);
          setCurrentPage('invoice-details');
        } else {
          setCurrentPage('404');
        }
      } else if (hash === '#transactions') {
        setCurrentPage('transactions');
      } else {
        setCurrentPage('404');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update wallet and network state
  const refreshWallet = async () => {
    const state = await getWalletState();
    setWallet(state);
    const config = getNetworkConfig();
    setNetworkConfigState(config);
    
    // Background sync of on-chain invoices and events
    if (config.mode === 'testnet') {
      try {
        await syncOnChainInvoices();
        await syncOnChainEvents();
      } catch (err) {
        console.error('Error during on-chain background sync:', err);
      }
    }
  };

  useEffect(() => {
    // Initial check
    refreshWallet();

    // Set up auto-reconnect if previously connected in simulator or freighter
    const wasConnected = localStorage.getItem('invoicex_wallet_connected') === 'true' || 
                        localStorage.getItem('invoicex_sim_connected') === 'true';
    if (wasConnected) {
      if (networkConfig.mode === 'simulator') {
        localStorage.setItem('invoicex_sim_connected', 'true');
      } else {
        localStorage.setItem('invoicex_wallet_connected', 'true');
      }
      refreshWallet();
    }

    // Event listeners for balance or invoice changes
    const updateHandler = () => {
      refreshWallet();
    };

    window.addEventListener('invoicex_balance_change', updateHandler);
    window.addEventListener('invoicex_network_change', updateHandler);
    window.addEventListener('invoicex_contract_change', updateHandler);
    window.addEventListener('storage', updateHandler);

    // Poll wallet state every 5 seconds (standard for checking on-chain balance updates)
    const interval = setInterval(refreshWallet, 5000);

    return () => {
      window.removeEventListener('invoicex_balance_change', updateHandler);
      window.removeEventListener('invoicex_network_change', updateHandler);
      window.removeEventListener('invoicex_contract_change', updateHandler);
      window.removeEventListener('storage', updateHandler);
      clearInterval(interval);
    };
  }, [networkConfig.mode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigateTo = (page: PageName, invoiceIdVal: string | null = null) => {
    if (page === 'landing') window.location.hash = 'landing';
    else if (page === 'dashboard') window.location.hash = 'dashboard';
    else if (page === 'create-invoice') window.location.hash = 'create-invoice';
    else if (page === 'invoices') window.location.hash = 'invoices';
    else if (page === 'invoice-details' && invoiceIdVal) window.location.hash = `invoice/${invoiceIdVal}`;
    else if (page === 'transactions') window.location.hash = 'transactions';
    else window.location.hash = '404';
  };

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto dismiss toast after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const connectWallet = async (): Promise<boolean> => {
    try {
      const res = await connectWalletService();
      if (res) {
        await refreshWallet();
        showToast(`${res.walletType === 'simulator' ? 'Simulated' : res.walletType.toUpperCase()} Wallet connected successfully!`, 'success');
        return true;
      } else {
        showToast('Wallet connection cancelled.', 'error');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to connect wallet', 'error');
      return false;
    }
  };

  const disconnectWallet = () => {
    disconnectWalletService();
    setWallet(prev => ({
      ...prev,
      address: null,
      balance: '0.0000',
      isConnected: false,
      walletType: null,
      isAccountActive: false,
    }));
    showToast('Wallet disconnected', 'info');
  };

  const changeNetworkMode = (mode: 'testnet' | 'simulator') => {
    setNetworkMode(mode);
    setNetworkConfigState(getNetworkConfig());
    
    // Disconnect old mode wallet
    localStorage.setItem('invoicex_sim_connected', 'false');
    localStorage.setItem('invoicex_wallet_connected', 'false');
    
    showToast(`Switched to ${mode === 'testnet' ? 'Stellar Testnet' : 'InvoiceX Simulator'}`, 'info');
    refreshWallet();
  };

  const updateContractIdVal = (contractId: string, pmContractId?: string) => {
    if (pmContractId) {
      setContractIds(contractId, pmContractId);
    } else {
      setContractId(contractId);
    }
    setNetworkConfigState(getNetworkConfig());
    showToast(`Soroban Contract configuration updated`, 'success');
  };

  const fundWalletAccount = async () => {
    if (!wallet.address) {
      showToast('Connect wallet first', 'error');
      return;
    }
    
    showToast('Requesting Friendbot XLM funding...', 'info');
    const success = await fundWithFriendbot(wallet.address);
    
    if (success) {
      showToast('Account funded with +1000 XLM!', 'success');
      await refreshWallet();
    } else {
      showToast('Friendbot funding request failed. Try again later.', 'error');
    }
  };

  const createInvoiceAction = async (input: InvoiceFormInput): Promise<boolean> => {
    setTxModal({
      isOpen: true,
      status: 'pending',
      message: 'Preparing transaction. Please approve the signing request in your wallet...',
      txHash: '',
      invoiceId: '',
    });

    try {
      const res = await createInvoice(input);
      if (res.success) {
        setTxModal(prev => ({
          ...prev,
          status: 'success',
          message: 'Invoice created successfully on the Stellar network!',
          txHash: res.txHash,
          invoiceId: res.invoiceId,
        }));
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast('Invoice created successfully!', 'success');
        refreshWallet();
        return true;
      } else {
        setTxModal(prev => ({
          ...prev,
          status: 'failed',
          message: res.error || 'Transaction simulation failed or rejected by wallet.',
        }));
        showToast(res.error || 'Invoice creation failed', 'error');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setTxModal(prev => ({
        ...prev,
        status: 'failed',
        message: err.message || 'Transaction execution failed.',
      }));
      showToast(err.message || 'Transaction failed', 'error');
      return false;
    }
  };

  const payInvoiceAction = async (invoiceId: string): Promise<boolean> => {
    setTxModal({
      isOpen: true,
      status: 'pending',
      message: 'Preparing payment transaction. Please sign the transaction in your wallet...',
      txHash: '',
      invoiceId,
    });

    try {
      const res = await payInvoice(invoiceId);
      if (res.success) {
        setTxModal(prev => ({
          ...prev,
          status: 'success',
          message: 'Payment completed! Funds have been transferred on-chain.',
          txHash: res.txHash,
        }));
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('Payment successful!', 'success');
        refreshWallet();
        return true;
      } else {
        setTxModal(prev => ({
          ...prev,
          status: 'failed',
          message: res.error || 'Payment failed or was rejected.',
        }));
        showToast(res.error || 'Payment failed', 'error');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setTxModal(prev => ({
        ...prev,
        status: 'failed',
        message: err.message || 'Payment execution failed.',
      }));
      showToast(err.message || 'Payment failed', 'error');
      return false;
    }
  };

  const cancelInvoiceAction = async (invoiceId: string): Promise<boolean> => {
    setTxModal({
      isOpen: true,
      status: 'pending',
      message: 'Preparing cancellation request. Please sign the transaction in your wallet...',
      txHash: '',
      invoiceId,
    });

    try {
      const res = await cancelInvoice(invoiceId);
      if (res.success) {
        setTxModal(prev => ({
          ...prev,
          status: 'cancelled',
          message: 'Invoice has been voided/cancelled successfully on-chain.',
          txHash: res.txHash,
        }));
        showToast('Invoice cancelled', 'info');
        refreshWallet();
        return true;
      } else {
        setTxModal(prev => ({
          ...prev,
          status: 'failed',
          message: res.error || 'Cancellation failed or was rejected.',
        }));
        showToast(res.error || 'Cancellation failed', 'error');
        return false;
      }
    } catch (err: any) {
      console.error(err);
      setTxModal(prev => ({
        ...prev,
        status: 'failed',
        message: err.message || 'Cancellation execution failed.',
      }));
      showToast(err.message || 'Cancellation failed', 'error');
      return false;
    }
  };

  const closeTxModal = () => {
    setTxModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        wallet,
        networkConfig,
        currentPage,
        currentInvoiceId,
        navigateTo,
        connectWallet,
        disconnectWallet,
        changeNetworkMode,
        updateContractIdVal,
        fundWalletAccount,
        createInvoiceAction,
        payInvoiceAction,
        cancelInvoiceAction,
        txModal,
        closeTxModal,
        toasts,
        showToast,
        dismissToast,
        refreshWallet,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useInvoiceX() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useInvoiceX must be used within an AppProvider');
  }
  return context;
}
