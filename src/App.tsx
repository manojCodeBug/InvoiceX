import { useState, useEffect } from 'react';
import { 
  AnimatePresence, 
  motion 
} from 'framer-motion';
import { 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Search, 
  ArrowUpDown, 
  Sun, 
  Moon, 
  ExternalLink, 
  FileText, 
  FileCheck, 
  Activity, 
  User, 
  Mail, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  History, 
  Sparkles, 
  Globe, 
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import { AppProvider, useInvoiceX, type PageName } from './hooks/useInvoiceX';
import { getInvoices, getCombinedActivityFeed, getInvoiceById, type InvoiceFormInput } from './services/invoice';
import { getTransactionHistory, type TransactionItem } from './services/transactions';
import { type InvoiceContractState } from './services/contract';
import { getNetworkConfig } from './services/network';

// Helper to format addresses for display
const formatAddress = (address: string | null) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
};

// Helper for date formatting
const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

// Notification Toast Container Component
function ToastsContainer() {
  const { toasts, dismissToast } = useInvoiceX();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`p-4 rounded-lg shadow-lg flex items-start gap-3 border ${
              toast.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-800/40' 
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800/40'
                : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
            <div className="flex-1 text-sm font-jt-rejiro font-medium leading-relaxed">
              {toast.message}
            </div>
            <button 
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Transaction Status Modal Component
function TransactionStatusModal() {
  const { txModal, closeTxModal } = useInvoiceX();

  if (!txModal.isOpen) return null;

  const renderStatusIcon = () => {
    switch (txModal.status) {
      case 'pending':
      case 'processing':
        return (
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue-dark dark:text-brand-blue">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple-light text-brand-purple-dark dark:bg-brand-purple/20 dark:text-brand-purple">
            <AlertCircle className="w-10 h-10" />
          </div>
        );
      case 'failed':
      default:
        return (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <XCircle className="w-10 h-10" />
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (txModal.status) {
      case 'pending': return 'Preparing Transaction';
      case 'processing': return 'Broadcasting to Stellar';
      case 'success': return 'Transaction Succeeded';
      case 'cancelled': return 'Transaction Cancelled';
      case 'failed': return 'Transaction Failed';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-brand-dark/95 border border-brand-border/30 dark:border-white/10 shadow-2xl relative"
      >
        <button 
          onClick={closeTxModal}
          disabled={txModal.status === 'processing' || txModal.status === 'pending'}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          {renderStatusIcon()}

          <h3 className="mt-4 text-xl font-majesti font-bold text-gray-900 dark:text-white">
            {getStatusTitle()}
          </h3>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-jt-rejiro px-2 leading-relaxed">
            {txModal.message}
          </p>

          {txModal.txHash && (
            <div className="mt-6 w-full p-3 rounded bg-brand-light/50 dark:bg-brand-dark/50 border border-brand-border/20 text-left">
              <span className="text-xs text-gray-400 block font-tomket-boys">TRANSACTION HASH</span>
              <a 
                href={txModal.txHash.startsWith('sim_hash_') ? '#' : `https://stellar.expert/explorer/testnet/tx/${txModal.txHash}`}
                target={txModal.txHash.startsWith('sim_hash_') ? '_self' : '_blank'}
                rel="noreferrer"
                className="text-xs text-brand-blue-dark dark:text-brand-blue hover:underline break-all mt-1 flex items-center gap-1 font-tomket-boys"
              >
                {txModal.txHash}
                {!txModal.txHash.startsWith('sim_hash_') && <ExternalLink className="w-3 h-3 inline" />}
              </a>
            </div>
          )}

          {txModal.invoiceId && txModal.status === 'success' && (
            <div className="mt-2 w-full p-3 rounded bg-brand-light/50 dark:bg-brand-dark/50 border border-brand-border/20 text-left">
              <span className="text-xs text-gray-400 block font-tomket-boys">INVOICE ID</span>
              <span className="text-xs text-brand-purple-dark dark:text-brand-purple font-tomket-boys">
                {txModal.invoiceId}
              </span>
            </div>
          )}

          {(txModal.status === 'success' || txModal.status === 'failed' || txModal.status === 'cancelled') && (
            <button
              onClick={closeTxModal}
              className="mt-6 w-full py-2.5 rounded bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-90 font-medium text-sm transition-all"
            >
              Dismiss
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Wallet Connection Modal (Setup network & connect freighter / simulator)
function WalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    wallet, 
    networkConfig, 
    changeNetworkMode, 
    connectWallet, 
    fundWalletAccount,
    updateContractIdVal,
    showToast,
    disconnectWallet
  } = useInvoiceX();

  const [simAddressInput, setSimAddressInput] = useState(
    () => localStorage.getItem('invoicex_sim_address') || 'GCINVOICEXSIMULATEDADDRESS2026XXXYYYZZZ'
  );

  const [contractIdInput, setContractIdInput] = useState(
    () => networkConfig.contractId
  );

  const [pmContractIdInput, setPmContractIdInput] = useState(
    () => networkConfig.paymentManagerContractId
  );

  useEffect(() => {
    setContractIdInput(networkConfig.contractId);
    setPmContractIdInput(networkConfig.paymentManagerContractId);
  }, [networkConfig]);

  const handleSaveSimAddress = () => {
    if (!simAddressInput.trim() || !simAddressInput.startsWith('G')) {
      showToast('Address must start with G (Stellar Public Key format)', 'error');
      return;
    }
    localStorage.setItem('invoicex_sim_address', simAddressInput.trim());
    showToast('Simulated address updated', 'success');
  };

  const handleSaveContractIds = () => {
    if (!contractIdInput.trim() || !/^C[A-Z2-7]{55}$/.test(contractIdInput.trim())) {
      showToast('Registry Contract ID must be a valid 56-character Soroban contract ID starting with C', 'error');
      return;
    }
    if (!pmContractIdInput.trim() || !/^C[A-Z2-7]{55}$/.test(pmContractIdInput.trim())) {
      showToast('Payment Manager Contract ID must be a valid 56-character Soroban contract ID starting with C', 'error');
      return;
    }
    updateContractIdVal(contractIdInput.trim(), pmContractIdInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-xl bg-white dark:bg-brand-dark/95 border border-brand-border/30 dark:border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-brand-border/20 dark:border-white/5 flex justify-between items-center bg-brand-light/30 dark:bg-brand-dark/50">
          <h3 className="text-lg font-majesti font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-purple" />
            Wallet Configuration
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Network Selection */}
          <div>
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-2 font-tomket-boys">
              SELECT DAPP NETWORK MODE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => changeNetworkMode('simulator')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  networkConfig.mode === 'simulator'
                    ? 'border-brand-purple-dark bg-brand-purple-light/25 dark:border-brand-purple dark:bg-brand-purple/10'
                    : 'border-brand-border/30 hover:border-brand-border dark:border-white/5'
                }`}
              >
                <div className="text-sm font-semibold flex items-center gap-1.5 dark:text-white">
                  <Sparkles className="w-4 h-4 text-brand-purple" />
                  InvoiceX Simulator
                </div>
                <span className="text-xs text-gray-500">Run sandbox trials instantly. No wallet extensions needed.</span>
              </button>

              <button
                onClick={() => changeNetworkMode('testnet')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  networkConfig.mode === 'testnet'
                    ? 'border-brand-blue-dark bg-brand-blue/10 dark:border-brand-blue dark:bg-brand-blue/10'
                    : 'border-brand-border/30 hover:border-brand-border dark:border-white/5'
                }`}
              >
                <div className="text-sm font-semibold flex items-center gap-1.5 dark:text-white">
                  <Globe className="w-4 h-4 text-brand-blue-dark" />
                  Stellar Testnet
                </div>
                <span className="text-xs text-gray-500">Execute on-chain smart contracts signed via Freighter.</span>
              </button>
            </div>
          </div>

          {/* Connection Status Section */}
          <div className="p-4 rounded-lg bg-brand-light/30 dark:bg-brand-dark border border-brand-border/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-400 block font-tomket-boys">CONNECTION STATE</span>
                <span className="text-sm font-semibold dark:text-white mt-0.5 block">
                  {wallet.isConnected ? 'Connected' : 'Disconnected'} 
                  <span className="text-xs text-gray-400 font-normal"> ({wallet.network})</span>
                </span>
              </div>
              <div>
                {wallet.isConnected ? (
                  <span className="px-2.5 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 font-semibold font-tomket-boys">
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-brand-dark dark:text-gray-400 font-semibold font-tomket-boys border border-brand-border/25">
                    INACTIVE
                  </span>
                )}
              </div>
            </div>

            {wallet.isConnected && wallet.address && (
              <div className="mt-3 pt-3 border-t border-brand-border/10">
                <span className="text-xs text-gray-400 block font-tomket-boys">WALLET ADDRESS</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-tomket-boys dark:text-gray-300 select-all font-mono break-all pr-2">
                    {wallet.address}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.address || '');
                      showToast('Address copied to clipboard', 'info');
                    }}
                    className="p-1 hover:bg-brand-light dark:hover:bg-brand-dark/40 rounded transition-all text-gray-500"
                    title="Copy Address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <span className="text-xs text-gray-400 block mt-2 font-tomket-boys">ACCOUNT BALANCE</span>
                <span className="text-lg font-bold font-tomket-boys text-brand-purple-dark dark:text-white">
                  {wallet.balance} XLM
                </span>

                {!wallet.isAccountActive && networkConfig.mode === 'testnet' && (
                  <div className="mt-3 p-2.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30 text-xs">
                    <p className="font-semibold mb-1">Account not active on Testnet!</p>
                    Your address has not been registered on the Stellar Testnet ledger yet. Click fund to request 10,000 XLM from Friendbot faucet.
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {!wallet.isConnected ? (
                <button
                  onClick={async () => {
                    const success = await connectWallet();
                    if (success) onClose();
                  }}
                  className="flex-1 py-2 rounded bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-95 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              ) : (
                <>
                  {(!wallet.isAccountActive || networkConfig.mode === 'simulator') && (
                    <button
                      onClick={fundWalletAccount}
                      className="py-2 px-4 rounded bg-brand-blue-dark text-white hover:bg-opacity-90 text-sm font-semibold transition-all"
                    >
                      Fund Wallet
                    </button>
                  )}
                  <button
                    onClick={() => {
                      disconnectWallet();
                    }}
                    className="flex-1 py-2 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 text-sm font-semibold transition-all"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Config Settings Form based on Network Mode */}
          {networkConfig.mode === 'simulator' ? (
            <div className="space-y-3 pt-3 border-t border-brand-border/10">
              <label className="text-xs font-bold text-gray-400 block font-tomket-boys">
                SIMULATOR CUSTOM ADDRESS (MOCK SENDER/RECEIVER)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simAddressInput}
                  onChange={(e) => setSimAddressInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white"
                />
                <button
                  onClick={handleSaveSimAddress}
                  className="px-3 py-2 text-xs rounded bg-brand-dark text-white hover:bg-opacity-90 dark:bg-brand-light dark:text-brand-dark font-semibold transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-3 border-t border-brand-border/10">
              <div>
                <label className="text-xs font-bold text-gray-400 block font-tomket-boys mb-1">
                  INVOICE REGISTRY CONTRACT ADDRESS (TESTNET)
                </label>
                <input
                  type="text"
                  value={contractIdInput}
                  onChange={(e) => setContractIdInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-brand-border/30 rounded focus:outline-none focus:border-brand-blue-dark dark:bg-brand-dark/40 dark:border-white/10 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block font-tomket-boys mb-1">
                  PAYMENT MANAGER CONTRACT ADDRESS (TESTNET)
                </label>
                <input
                  type="text"
                  value={pmContractIdInput}
                  onChange={(e) => setPmContractIdInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-brand-border/30 rounded focus:outline-none focus:border-brand-blue-dark dark:bg-brand-dark/40 dark:border-white/10 dark:text-white font-mono"
                />
              </div>
              <button
                onClick={handleSaveContractIds}
                className="w-full py-2 text-xs rounded bg-brand-dark text-white hover:bg-opacity-90 dark:bg-brand-light dark:text-brand-dark font-semibold transition-all font-tomket-boys"
              >
                SAVE CONTRACT CONFIGURATION
              </button>
              <p className="text-[10px] text-gray-500">
                Provide the active registry and payment manager hashes deployed on testnet.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Navigation Layout Shell (Responsive Sidebar / Top Navbar)
function Layout({ children, onOpenWalletModal }: { children: React.ReactNode; onOpenWalletModal: () => void }) {
  const { 
    wallet, 
    currentPage, 
    currentInvoiceId,
    navigateTo, 
    theme, 
    toggleTheme,
    networkConfig,
    disconnectWallet
  } = useInvoiceX();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  const navItems = [
    { name: 'Dashboard', id: 'dashboard' as PageName, icon: FileSpreadsheet },
    { name: 'Invoices', id: 'invoices' as PageName, icon: FileText },
    { name: 'Transactions', id: 'transactions' as PageName, icon: History },
  ];

  if (currentPage === 'landing') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-brand-light/50 dark:bg-brand-dark/20 flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-brand-dark border-r border-brand-border/20 dark:border-white/5 shrink-0 select-none">
        {/* Brand */}
        <div 
          onClick={() => navigateTo('landing')}
          className="h-16 border-b border-brand-border/10 dark:border-white/5 flex items-center gap-2.5 px-6 cursor-pointer"
        >
          <img src="/logo.png" alt="InvoiceX Logo" className="h-7 w-auto object-contain rounded" />
          <span className="font-majesti text-2xl font-bold bg-gradient-to-r from-brand-purple-dark to-brand-blue-dark dark:from-brand-purple dark:to-brand-blue bg-clip-text text-transparent">
            InvoiceX
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple-dark dark:bg-brand-purple/20 dark:text-brand-purple mt-1 font-tomket-boys">
            v1.0
          </span>
        </div>

        {/* Wallet state card */}
        <div className="p-4 border-b border-brand-border/10 dark:border-white/5">
          <div className="p-3 rounded-lg bg-brand-light/40 dark:bg-brand-dark/40 border border-brand-border/15">
            <span className="text-[10px] text-gray-400 block font-tomket-boys">NETWORK</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${networkConfig.mode === 'testnet' ? 'bg-blue-500 animate-pulse' : 'bg-brand-purple'}`}></span>
              <span className="text-xs font-semibold dark:text-white">{networkConfig.mode === 'testnet' ? 'Stellar Testnet' : 'Simulator'}</span>
            </div>

            {wallet.isConnected ? (
              <div className="mt-3">
                <span className="text-[10px] text-gray-400 block font-tomket-boys">WALLET</span>
                <span className="text-xs font-semibold font-tomket-boys dark:text-gray-200">
                  {formatAddress(wallet.address)}
                </span>
                <span className="text-sm font-bold block font-tomket-boys text-brand-purple-dark dark:text-white mt-1">
                  {wallet.balance} XLM
                </span>
              </div>
            ) : (
              <button 
                onClick={onOpenWalletModal}
                className="mt-3 w-full py-1.5 text-xs font-semibold rounded bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-90 transition-all flex items-center justify-center gap-1"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'invoices' && currentPage === 'invoice-details');
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-purple-dark text-white dark:text-black shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-brand-light/80 dark:hover:bg-brand-dark/40 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-brand-border/10 dark:border-white/5 flex gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded bg-brand-light/50 dark:bg-brand-dark/40 hover:bg-brand-light dark:hover:bg-brand-dark/80 text-gray-500 dark:text-gray-400 transition-all flex-1 flex justify-center"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={onOpenWalletModal}
            className="p-2 rounded bg-brand-light/50 dark:bg-brand-dark/40 hover:bg-brand-light dark:hover:bg-brand-dark/80 text-gray-500 dark:text-gray-400 transition-all flex-1 flex justify-center"
            title="Configure Wallet"
          >
            <Wallet className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Top Navbar - Mobile */}
      <header className="md:hidden h-16 bg-white dark:bg-brand-dark border-b border-brand-border/20 dark:border-white/5 flex items-center justify-between px-4 z-40 select-none">
        <div 
          onClick={() => navigateTo('landing')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src="/logo.png" alt="InvoiceX Logo" className="h-6 w-auto object-contain rounded" />
          <span className="font-majesti text-xl font-bold bg-gradient-to-r from-brand-purple-dark to-brand-blue-dark dark:from-brand-purple dark:to-brand-blue bg-clip-text text-transparent">
            InvoiceX
          </span>
          <span className="text-[8px] font-bold px-1 py-0.25 rounded bg-brand-purple/10 text-brand-purple-dark dark:bg-brand-purple/20 dark:text-brand-purple mt-0.5 font-tomket-boys">
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-brand-light dark:hover:bg-brand-dark/50 text-gray-500 dark:text-gray-400"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded hover:bg-brand-light dark:hover:bg-brand-dark/50 text-gray-500 dark:text-gray-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-brand-dark border-b border-brand-border/20 dark:border-white/5 overflow-hidden z-30 select-none"
          >
            <div className="p-4 space-y-3">
              <div className="p-3 rounded-lg bg-brand-light/30 dark:bg-brand-dark/30 border border-brand-border/15 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-400 block font-tomket-boys">ACTIVE MODE</span>
                  <span className="text-xs font-semibold dark:text-white">{networkConfig.mode === 'testnet' ? 'Stellar Testnet' : 'Simulator'}</span>
                </div>
                {wallet.isConnected ? (
                  <span className="text-xs font-bold font-tomket-boys text-brand-purple-dark dark:text-white">
                    {wallet.balance} XLM
                  </span>
                ) : (
                  <button 
                    onClick={onOpenWalletModal}
                    className="py-1 px-2.5 text-xs font-bold rounded bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-90"
                  >
                    Connect
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id || (item.id === 'invoices' && currentPage === 'invoice-details');
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-purple-dark text-white dark:text-black shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-brand-light/80 dark:hover:bg-brand-dark/40 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/10">
                <button
                  onClick={onOpenWalletModal}
                  className="py-2 border border-brand-border/20 dark:border-white/5 rounded text-xs font-semibold dark:text-white flex items-center justify-center gap-1"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Wallet Config
                </button>
                <button
                  onClick={() => {
                    disconnectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 border border-red-100 rounded text-xs font-semibold text-red-500 hover:bg-red-50"
                  disabled={!wallet.isConnected}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1400px] w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + (currentInvoiceId || '')}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

// ==========================================
// LANDING PAGE

function LandingPage() {
  return <div>Landing Page</div>;
}
function AppContent() {
  return <LandingPage />;
}
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
export default App;
