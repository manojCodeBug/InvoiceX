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
// ==========================================
function LandingPage() {
  const { navigateTo, wallet, theme, toggleTheme } = useInvoiceX();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-light/20 dark:bg-brand-dark/40 flex flex-col font-jt-rejiro">
      {/* Landing Nav */}
      <header className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between select-none">
        <div 
          onClick={() => navigateTo('landing')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img src="/logo.png" alt="InvoiceX Logo" className="h-10 w-auto object-contain rounded-md" />
          <span className="font-majesti text-3xl font-extrabold bg-gradient-to-r from-brand-purple-dark via-brand-purple to-brand-blue-dark dark:from-brand-purple dark:to-brand-blue bg-clip-text text-transparent">
            InvoiceX
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-brand-light/80 dark:hover:bg-brand-dark text-gray-600 dark:text-gray-400"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          {wallet.isConnected ? (
            <button 
              onClick={() => navigateTo('dashboard')}
              className="px-5 py-2 rounded-lg bg-brand-purple-dark hover:bg-opacity-95 text-white dark:text-black font-medium text-sm transition-all shadow-md flex items-center gap-1.5"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => setWalletModalOpen(true)}
              className="px-5 py-2 rounded-lg border border-brand-purple-dark text-brand-purple-dark dark:border-brand-purple dark:text-brand-purple font-semibold text-sm hover:bg-brand-purple-dark hover:text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-12 pb-20 flex flex-col lg:flex-row items-center gap-16 flex-grow">
        <div className="flex-1 space-y-6 text-left">
          <h1 className="text-5xl lg:text-6xl font-majesti font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
            Create. Send. Get Paid. <br />
            <span className="bg-gradient-to-r from-brand-purple-dark to-brand-blue-dark dark:from-brand-purple dark:to-brand-blue bg-clip-text text-transparent">
              On the Stellar Network.
            </span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-jt-rejiro max-w-xl">
            A premium, decentralized invoicing engine built on Soroban smart contracts. Invoice clients, receive secure payments in XLM, and manage your billing cycle transparently, directly on-chain.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => {
                if (wallet.isConnected) {
                  navigateTo('dashboard');
                } else {
                  setWalletModalOpen(true);
                }
              }}
              className="px-8 py-3.5 rounded-lg bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-95 font-semibold text-base transition-all shadow-lg ambient-glow flex items-center gap-2"
            >
              Launch InvoiceX
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#how-it-works"
              className="px-8 py-3.5 rounded-lg border border-brand-border/40 text-gray-600 dark:text-gray-400 font-semibold text-base hover:bg-brand-light/50 dark:hover:bg-brand-dark transition-all flex items-center justify-center"
            >
              Explore Sandbox
            </a>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-gray-400 font-tomket-boys">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-brand-purple" /> SECURE SMART CONTRACTS</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-brand-purple" /> FREIGHTER WALLET SUPPORT</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-brand-purple" /> ZERO INTERMEDIARIES</span>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="p-1 rounded-xl bg-gradient-to-tr from-brand-purple/20 via-brand-border/20 to-brand-blue/20 shadow-2xl"
          >
            <div className="rounded-lg bg-white dark:bg-brand-dark/95 border border-brand-border/10 p-6 space-y-6">
              {/* Mock Invoice header */}
              <div className="flex justify-between items-start border-b border-brand-border/10 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-brand-purple block font-tomket-boys">INVOICEX PREVIEW</span>
                  <h4 className="text-lg font-majesti font-bold text-gray-900 dark:text-white mt-1">Audit Escrow Payment</h4>
                  <span className="text-xs text-gray-400 mt-0.5 block font-tomket-boys">ID: inv_test_88f9</span>
                </div>
                <div className="px-2.5 py-1 text-[10px] font-bold rounded bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 font-tomket-boys">
                  PENDING
                </div>
              </div>

              {/* Mock Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block font-tomket-boys">CLIENT</span>
                  <span className="font-semibold dark:text-white">Stellar Foundation</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-tomket-boys">DUE DATE</span>
                  <span className="font-semibold dark:text-white font-tomket-boys">2026-07-31</span>
                </div>
              </div>

              {/* Amount and pay button */}
              <div className="p-4 rounded-lg bg-brand-light/30 dark:bg-brand-dark border border-brand-border/20 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-400 block font-tomket-boys">TOTAL DUE</span>
                  <span className="text-xl font-extrabold text-brand-purple-dark dark:text-white font-tomket-boys">2,500.00 XLM</span>
                </div>
                <button className="px-4 py-2 rounded bg-brand-purple-dark text-white dark:text-black font-bold text-xs hover:bg-opacity-90 transition-all flex items-center gap-1 shadow-sm">
                  <Wallet className="w-3.5 h-3.5" />
                  Sign Payment
                </button>
              </div>

              {/* Event Monitor Feed preview */}
              <div className="pt-2">
                <span className="text-xs text-gray-400 block font-tomket-boys mb-2">LIVE ACTIVITY LOG</span>
                <div className="flex gap-2.5 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></span>
                  <p className="flex-1 text-left leading-relaxed">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 font-tomket-boys">inv_test_88f9</span> created on-chain. <br />
                    <span className="text-[10px] text-gray-400 font-tomket-boys">Tx Hash: sim_hash_create_77ac21...</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-brand-border/10 dark:border-white/5 bg-white dark:bg-brand-dark/20">
        <div className="max-w-7xl mx-auto w-full px-6 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-majesti font-bold text-gray-900 dark:text-white">
              Why Invoicing on Stellar?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Decentralized invoice structures solve key trust, speed, and cost inefficiencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-brand-light/30 dark:bg-brand-dark/30 border border-brand-border/20 text-left space-y-4 hover:border-brand-purple/40 transition-all">
              <div className="w-10 h-10 rounded bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Freighter Wallet Sign</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Connect Freighter, click Pay, and securely approve the transaction payload. Fully integrated with Stellar signature requests.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-brand-light/30 dark:bg-brand-dark/30 border border-brand-border/20 text-left space-y-4 hover:border-brand-purple/40 transition-all">
              <div className="w-10 h-10 rounded bg-brand-blue/20 flex items-center justify-center text-brand-blue-dark">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Soroban Smart Contracts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Create, cancel, and execute payments through deployed Soroban contract modules on Testnet. Real-time updates prevent double billing.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-brand-light/30 dark:bg-brand-dark/30 border border-brand-border/20 text-left space-y-4 hover:border-brand-purple/40 transition-all">
              <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center text-green-700 dark:bg-green-950/40 dark:text-green-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Event Monitoring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                On-chain events are parsed instantly. Creation, payment, and cancellation updates are indexed to feed real-time analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-brand-border/10 dark:border-white/5">
        <div className="max-w-7xl mx-auto w-full px-6 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-majesti font-bold text-gray-900 dark:text-white">How InvoiceX Works</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Get billing up and running in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="space-y-3 text-center">
              <span className="w-12 h-12 rounded-full border-2 border-brand-purple-dark text-brand-purple-dark dark:border-brand-purple dark:text-brand-purple flex items-center justify-center mx-auto text-xl font-bold font-tomket-boys">1</span>
              <h4 className="text-base font-bold dark:text-white">Connect Wallet</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">Link your Freighter wallet on Testnet or test instantly with our zero-install dApp simulator mode.</p>
            </div>

            <div className="space-y-3 text-center">
              <span className="w-12 h-12 rounded-full border-2 border-brand-purple-dark text-brand-purple-dark dark:border-brand-purple dark:text-brand-purple flex items-center justify-center mx-auto text-xl font-bold font-tomket-boys">2</span>
              <h4 className="text-base font-bold dark:text-white">Create On-Chain Invoice</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">Fill out client info, set billing amounts in XLM, and broadcast your invoice contract state to the ledger.</p>
            </div>

            <div className="space-y-3 text-center">
              <span className="w-12 h-12 rounded-full border-2 border-brand-purple-dark text-brand-purple-dark dark:border-brand-purple dark:text-brand-purple flex items-center justify-center mx-auto text-xl font-bold font-tomket-boys">3</span>
              <h4 className="text-base font-bold dark:text-white">Get Paid Directly</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">Clients pay using the invoice reference link, triggering automated contract transfers instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="py-8 border-t border-brand-border/10 dark:border-white/5 bg-white dark:bg-brand-dark/20 text-center select-none">
        <p className="text-xs text-gray-400 font-tomket-boys">
          InvoiceX © 2026. Decentralized Escrow Billing System.
        </p>
      </footer>

      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}

// ==========================================
// DASHBOARD
// ==========================================
function DashboardPage({ onOpenWalletModal }: { onOpenWalletModal: () => void }) {
  const { wallet, navigateTo, networkConfig, fundWalletAccount } = useInvoiceX();
  const [invoices, setInvoices] = useState<InvoiceContractState[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  const fetchDashboardData = () => {
    setInvoices(getInvoices());
    setActivityFeed(getCombinedActivityFeed().slice(0, 5));
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh updates
    const handleInvoiceUpdate = () => {
      fetchDashboardData();
    };

    window.addEventListener('invoicex_invoices_change', handleInvoiceUpdate);
    window.addEventListener('invoicex_events_update', handleInvoiceUpdate);

    return () => {
      window.removeEventListener('invoicex_invoices_change', handleInvoiceUpdate);
      window.removeEventListener('invoicex_events_update', handleInvoiceUpdate);
    };
  }, []);

  // Compute Stats
  const activeAddress = wallet.address;
  const userInvoices = invoices.filter(i => i.creator === activeAddress || !activeAddress); // show all if not connected for simulator demo
  const pendingInvoices = userInvoices.filter(i => i.status === 'pending');
  const paidInvoices = userInvoices.filter(i => i.status === 'paid');
  
  const totalVolume = paidInvoices.reduce((sum, current) => sum + parseFloat(current.amount), 0).toFixed(2);
  const pendingVolume = pendingInvoices.reduce((sum, current) => sum + parseFloat(current.amount), 0).toFixed(2);

  return (
    <div className="space-y-6 font-jt-rejiro text-left">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-majesti font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-tomket-boys mt-0.5">
            {networkConfig.mode === 'testnet' ? 'STELLAR TESTNET INTEGRATION' : 'SIMULATOR SANDBOX MODE'}
          </p>
        </div>
        <div className="flex gap-2">
          {wallet.isConnected && networkConfig.mode === 'simulator' && (
            <button
              onClick={fundWalletAccount}
              className="px-4 py-2 border border-brand-border/30 rounded text-xs font-semibold hover:bg-brand-light/50 dark:hover:bg-brand-dark dark:border-white/5 dark:text-white flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              Request XLM Faucet
            </button>
          )}
          <button
            onClick={() => navigateTo('create-invoice')}
            className="px-4 py-2 bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-95 font-semibold text-xs rounded transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Network Alert Notification */}
      {!wallet.isConnected && (
        <div className="p-4 rounded bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Wallet Not Connected</p>
            Connect Freighter Wallet or launch Simulator to view balance details and initiate smart contract calls.
            <button 
              onClick={onOpenWalletModal}
              className="underline font-semibold block mt-1 hover:text-amber-900"
            >
              Connect Wallet Now
            </button>
          </div>
        </div>
      )}

      {/* Cards - Row 1 (Balance Management & Wallet Details) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Wallet Connection Status */}
        <div className="p-5 rounded-lg bg-white dark:bg-brand-dark border border-brand-border/20 shadow-sm flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block font-tomket-boys">WALLET DETAILS</span>
            {wallet.isConnected ? (
              <div className="mt-2 space-y-1">
                <span className="text-sm font-semibold dark:text-white block font-tomket-boys truncate pr-4">
                  {wallet.address}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                  Network: {wallet.network}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                Connect Freighter to query active address on the Stellar ledger.
              </p>
            )}
          </div>
          <div>
            {!wallet.isConnected ? (
              <button 
                onClick={onOpenWalletModal}
                className="py-1.5 px-4 bg-brand-purple-dark text-white dark:text-black rounded font-semibold text-xs hover:bg-opacity-95"
              >
                Connect Freighter
              </button>
            ) : (
              <div className="flex gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 font-tomket-boys">
                  CONNECTED
                </span>
                {wallet.isAccountActive ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-tomket-boys">
                    ON-CHAIN ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-tomket-boys">
                    INACTIVE
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-5 rounded-lg bg-white dark:bg-brand-dark border border-brand-border/20 shadow-sm flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block font-tomket-boys">AVAILABLE BALANCE</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-purple-dark dark:text-white font-tomket-boys">
                {wallet.isConnected ? wallet.balance : '0.0000'}
              </span>
              <span className="text-xs text-gray-500 font-bold font-tomket-boys">XLM</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">Stellar Native Gas Token</span>
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1 font-tomket-boys border-t border-brand-border/10 pt-2">
            <RefreshCw className="w-3 h-3 text-brand-purple" />
            AUTO-REFRESH EVERY 5S
          </div>
        </div>

        {/* Contract Identity card */}
        <div className="p-5 rounded-lg bg-white dark:bg-brand-dark border border-brand-border/20 shadow-sm flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block font-tomket-boys">SOROBAN ESCROW CONTRACT</span>
            <span className="text-[10px] font-mono text-gray-500 block truncate mt-2 font-tomket-boys select-all bg-brand-light/30 dark:bg-brand-dark/50 p-1.5 rounded">
              {networkConfig.contractId}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-brand-border/10 pt-2">
            <span className="text-[10px] text-gray-400 font-tomket-boys">STATUS: IMPLEMENTED</span>
            <button 
              onClick={onOpenWalletModal}
              className="text-[10px] text-brand-purple-dark dark:text-brand-purple hover:underline font-bold font-tomket-boys"
            >
              CHANGE ID
            </button>
          </div>
        </div>

      </div>

      {/* Row 2 (Quick Metrics Row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-brand-dark border border-brand-border/15 rounded-lg shadow-sm">
          <span className="text-[10px] text-gray-400 block font-tomket-boys">PENDING INVOICES</span>
          <span className="text-2xl font-bold font-tomket-boys dark:text-white mt-1 block">{pendingInvoices.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-brand-dark border border-brand-border/15 rounded-lg shadow-sm">
          <span className="text-[10px] text-gray-400 block font-tomket-boys">PAID INVOICES</span>
          <span className="text-2xl font-bold font-tomket-boys dark:text-white mt-1 block">{paidInvoices.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-brand-dark border border-brand-border/15 rounded-lg shadow-sm">
          <span className="text-[10px] text-gray-400 block font-tomket-boys">REVENUE RECEIVED</span>
          <span className="text-2xl font-bold font-tomket-boys text-green-600 dark:text-green-400 mt-1 block">{totalVolume} XLM</span>
        </div>
        <div className="p-4 bg-white dark:bg-brand-dark border border-brand-border/15 rounded-lg shadow-sm">
          <span className="text-[10px] text-gray-400 block font-tomket-boys">OUTSTANDING AMOUNT</span>
          <span className="text-2xl font-bold font-tomket-boys text-amber-600 dark:text-amber-400 mt-1 block">{pendingVolume} XLM</span>
        </div>
      </div>

      {/* Row 3 (Recent Activity / Invoices Table & Event monitor feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Invoices Card */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-white dark:bg-brand-dark border border-brand-border/20 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-majesti font-bold text-gray-900 dark:text-white">Recent Invoices</h3>
              <button 
                onClick={() => navigateTo('invoices')}
                className="text-xs text-brand-purple-dark dark:text-brand-purple hover:underline font-semibold"
              >
                View All Invoices
              </button>
            </div>

            {userInvoices.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-sm font-jt-rejiro">No Invoices Found</p>
                <p className="text-xs text-gray-400 mt-1">Create your first invoice to initialize the smart contract storage.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userInvoices.slice(0, 3).map((invoice) => (
                  <div 
                    key={invoice.id}
                    onClick={() => navigateTo('invoice-details', invoice.id)}
                    className="p-3.5 rounded border border-brand-border/15 hover:border-brand-purple/30 dark:border-white/5 dark:hover:bg-brand-dark/40 cursor-pointer flex justify-between items-center transition-all bg-brand-light/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        invoice.status === 'paid' 
                          ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' 
                          : invoice.status === 'cancelled'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{invoice.title}</h4>
                        <span className="text-[11px] text-gray-400 block font-tomket-boys mt-0.5">
                          CLIENT: {invoice.clientName} | DUE: {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold block dark:text-white font-tomket-boys">
                        {parseFloat(invoice.amount).toFixed(2)} XLM
                      </span>
                      <span className={`text-[10px] font-bold font-tomket-boys px-2 py-0.5 rounded-full inline-block mt-1 ${
                        invoice.status === 'paid'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                          : invoice.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {userInvoices.length > 3 && (
            <button
              onClick={() => navigateTo('invoices')}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 mt-4 border-t border-brand-border/10 pt-3"
            >
              Show {userInvoices.length - 3} more invoices
            </button>
          )}
        </div>

        {/* Live Activity Feed Monitor */}
        <div className="p-5 rounded-lg bg-white dark:bg-brand-dark border border-brand-border/20 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-majesti font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-purple" />
              Live Activity Feed
            </h3>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-slow"></span>
          </div>
          <span className="text-[10px] text-gray-400 block font-tomket-boys border-b border-brand-border/10 pb-2 mb-4">
            REAL-TIME CONTRACT EVENT MONITOR
          </span>

          {activityFeed.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
              <Activity className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-xs">No ledger events recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[260px] pr-1">
              {activityFeed.map((feed) => {
                let statusColor = 'bg-brand-purple';
                if (feed.type === 'invoice_paid') statusColor = 'bg-green-500';
                else if (feed.type === 'invoice_cancelled') statusColor = 'bg-red-500';
                else if (feed.type === 'tx_processing') statusColor = 'bg-blue-400 animate-pulse';

                return (
                  <div key={feed.id} className="flex gap-3 text-xs leading-normal">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${statusColor}`}></span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {feed.title}
                      </p>
                      <p className="text-gray-500 mt-0.5">{feed.description}</p>
                      <span className="text-[10px] text-gray-400 font-tomket-boys mt-1 block">
                        TX HASH: {feed.hash.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// ==========================================
// ALL INVOICES PAGE
// ==========================================
function InvoicesPage() {
  const { navigateTo, wallet } = useInvoiceX();
  const [invoices, setInvoices] = useState<InvoiceContractState[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [sortField, setSortField] = useState<'dueDate' | 'amount' | 'clientName'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 5;

  const loadInvoices = () => {
    setInvoices(getInvoices());
  };

  useEffect(() => {
    loadInvoices();

    const handleInvoiceUpdate = () => {
      loadInvoices();
    };

    window.addEventListener('invoicex_invoices_change', handleInvoiceUpdate);
    return () => window.removeEventListener('invoicex_invoices_change', handleInvoiceUpdate);
  }, []);

  // Filter & Search
  const activeAddress = wallet.address;
  const userInvoices = invoices.filter(i => i.creator === activeAddress || !activeAddress);

  const filteredInvoices = userInvoices
    .filter((invoice) => {
      const matchSearch = 
        invoice.clientName.toLowerCase().includes(search.toLowerCase()) || 
        invoice.title.toLowerCase().includes(search.toLowerCase()) ||
        invoice.id.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'amount') {
        return (parseFloat(a.amount) - parseFloat(b.amount)) * multiplier;
      }
      if (sortField === 'clientName') {
        return a.clientName.localeCompare(b.clientName) * multiplier;
      }
      // default: dueDate
      return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * multiplier;
    });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPageNum(1);
  };

  return (
    <div className="space-y-6 font-jt-rejiro text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-majesti font-bold text-gray-900 dark:text-white">All Invoices</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-tomket-boys mt-0.5">
            ON-CHAIN INVOICE LEDGER QUERY
          </p>
        </div>
        <button
          onClick={() => navigateTo('create-invoice')}
          className="px-4 py-2 bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-95 font-semibold text-xs rounded transition-all shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="p-4 rounded-lg bg-white dark:bg-brand-dark border border-brand-border/20 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client name, title, or invoice ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPageNum(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-brand-light/40 dark:bg-brand-dark/60 p-1 rounded-md border border-brand-border/15 w-full md:w-auto">
          {(['all', 'pending', 'paid', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPageNum(1); }}
              className={`px-3 py-1.5 text-xs rounded font-semibold transition-all capitalize flex-1 md:flex-none ${
                statusFilter === status
                  ? 'bg-brand-purple-dark text-white dark:text-black'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white dark:bg-brand-dark border border-brand-border/20 rounded-lg shadow-sm overflow-hidden">
        
        {/* Table Head - Desktop */}
        <div className="hidden md:grid grid-cols-6 p-4 border-b border-brand-border/15 bg-brand-light/30 dark:bg-brand-dark/50 text-xs font-bold text-gray-400 font-tomket-boys select-none">
          <div className="col-span-2">INVOICE TITLE / ID</div>
          <div className="cursor-pointer flex items-center gap-1 hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('clientName')}>
            CLIENT {sortField === 'clientName' && <ArrowUpDown className="w-3.5 h-3.5" />}
          </div>
          <div className="cursor-pointer flex items-center gap-1 hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('amount')}>
            AMOUNT {sortField === 'amount' && <ArrowUpDown className="w-3.5 h-3.5" />}
          </div>
          <div className="cursor-pointer flex items-center gap-1 hover:text-gray-600 dark:hover:text-white" onClick={() => handleSort('dueDate')}>
            DUE DATE {sortField === 'dueDate' && <ArrowUpDown className="w-3.5 h-3.5" />}
          </div>
          <div className="text-right">STATUS</div>
        </div>

        {/* Table Body */}
        {paginatedInvoices.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="font-medium text-sm">No Invoices Found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or create a new invoice to publish.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border/10 dark:divide-white/5">
            {paginatedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => navigateTo('invoice-details', invoice.id)}
                className="grid grid-cols-1 md:grid-cols-6 p-4 items-center gap-2 hover:bg-brand-light/20 dark:hover:bg-brand-dark/40 cursor-pointer transition-all text-sm"
              >
                {/* Title / ID */}
                <div className="col-span-2 text-left">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate pr-4">{invoice.title}</h4>
                  <span className="text-[10px] text-gray-400 font-mono font-tomket-boys mt-0.5 block">{invoice.id}</span>
                </div>

                {/* Client */}
                <div className="text-left font-medium dark:text-gray-300">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">CLIENT</span>
                  {invoice.clientName}
                </div>

                {/* Amount */}
                <div className="text-left font-bold font-tomket-boys text-brand-purple-dark dark:text-white">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">AMOUNT</span>
                  {parseFloat(invoice.amount).toFixed(2)} XLM
                </div>

                {/* Due Date */}
                <div className="text-left font-semibold text-gray-500 dark:text-gray-400 font-tomket-boys">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">DUE DATE</span>
                  {formatDate(invoice.dueDate)}
                </div>

                {/* Status Badge */}
                <div className="text-left md:text-right">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-1">STATUS</span>
                  <span className={`text-[10px] font-bold font-tomket-boys px-2.5 py-1 rounded-full inline-block ${
                    invoice.status === 'paid'
                      ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/20'
                      : invoice.status === 'cancelled'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/20'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20'
                  }`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination row */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-brand-border/10 pt-4 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-tomket-boys">
            PAGE {currentPageNum} OF {totalPages} ({filteredInvoices.length} INVOICES)
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
              disabled={currentPageNum === 1}
              className="p-1.5 border border-brand-border/30 dark:border-white/5 rounded text-gray-500 dark:text-gray-400 hover:bg-brand-light/80 dark:hover:bg-brand-dark/40 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentPageNum(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPageNum === totalPages}
              className="p-1.5 border border-brand-border/30 dark:border-white/5 rounded text-gray-500 dark:text-gray-400 hover:bg-brand-light/80 dark:hover:bg-brand-dark/40 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface InvoiceTemplate {
  name: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  title: string;
  description: string;
  amount: string;
  daysToDue: number;
  notes: string;
}

const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    name: 'Web Development',
    clientName: 'Acme Software Corp',
    clientEmail: 'billing@acmesoftware.io',
    clientAddress: 'GDACMEWEBCORP2026XXXYYYZZZAAABBBCCC',
    title: 'Next.js Frontend Development & Soroban Integration',
    description: 'Implementation of the high-fidelity billing dashboard, transaction status modals, and custom hook-based contract event handlers.',
    amount: '3500.00',
    daysToDue: 14,
    notes: 'Payment terms: Net-14. Release of escrow funds is requested upon deployment to the staging server.',
  },
  {
    name: 'UI/UX Design',
    clientName: 'Stellar Design Studio',
    clientEmail: 'finance@stellardesign.co',
    clientAddress: 'GDSTELLARDESIGN2026XXXYYYZZZAAABBBCCC',
    title: 'Fintech SaaS Platform Rebranding & UI Kit',
    description: 'Creation of typography guidelines, harmonious modern color schemes, Figma design structures, and responsive CSS tokens.',
    amount: '1850.00',
    daysToDue: 7,
    notes: 'Source design files (Figma, SVGs) will be delivered immediately upon network transaction confirmation.',
  },
  {
    name: 'Smart Contract Audit',
    clientName: 'Decentralized Escrow DAO',
    clientEmail: 'audit@escrowdao.org',
    clientAddress: 'GDESCROWDAO2026XXXYYYZZZAAABBBCCC',
    title: 'Soroban Escrow Rust Smart Contract Audit',
    description: 'Line-by-line review of the InvoiceRegistry and PaymentManager Rust contracts, identifying reentrancy, authorization logic, and memory safety vulnerabilities.',
    amount: '7500.00',
    daysToDue: 30,
    notes: 'Includes detailed security audit report and recommendation guides. Code audit completed successfully.',
  }
];

// ==========================================
// CREATE INVOICE FORM
// ==========================================
function CreateInvoicePage() {
  const { createInvoiceAction, wallet, navigateTo, showToast } = useInvoiceX();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<InvoiceFormInput>({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    notes: '',
  });

  const handleInputChange = (field: keyof InvoiceFormInput, value: string) => {
    setForm((prev: InvoiceFormInput) => ({ ...prev, [field]: value }));
  };

  const handleApplyTemplate = (tmpl: InvoiceTemplate) => {
    const today = new Date();
    today.setDate(today.getDate() + tmpl.daysToDue);
    const dueDateStr = today.toISOString().split('T')[0];

    setForm({
      clientName: tmpl.clientName,
      clientEmail: tmpl.clientEmail,
      clientAddress: tmpl.clientAddress,
      title: tmpl.title,
      description: tmpl.description,
      amount: tmpl.amount,
      dueDate: dueDateStr,
      notes: tmpl.notes,
    });
    showToast(`Template "${tmpl.name}" applied!`, 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      showToast('Please connect your Freighter or Simulator wallet first', 'error');
      return;
    }

    setSubmitting(true);
    const success = await createInvoiceAction(form);
    setSubmitting(false);

    if (success) {
      navigateTo('dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-jt-rejiro text-left">
      <div>
        <h2 className="text-2xl font-majesti font-bold text-gray-900 dark:text-white">Create On-Chain Invoice</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-tomket-boys mt-0.5">
          BROADCAST NEW INVOICE TO SOROBAN LEDGER
        </p>
      </div>

      {/* Quick Templates Selector */}
      <div className="p-4 bg-brand-light/30 dark:bg-brand-dark/40 border border-brand-border/15 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-tomket-boys uppercase tracking-wider">
            Quick Invoice Templates
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {INVOICE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3 bg-white dark:bg-brand-dark border border-brand-border/20 dark:border-white/5 rounded-md text-left hover:border-brand-purple hover:shadow-sm transition-all group"
            >
              <div className="font-bold text-xs dark:text-white group-hover:text-brand-purple-dark dark:group-hover:text-brand-purple transition-colors">
                {tmpl.name}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                {tmpl.title}
              </div>
              <div className="text-[10px] font-bold text-brand-purple-dark dark:text-brand-purple mt-2 font-tomket-boys">
                {tmpl.amount} XLM
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 bg-white dark:bg-brand-dark border border-brand-border/20 rounded-lg shadow-sm space-y-6">
        
        {/* Row 1: Client details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 font-tomket-boys border-b border-brand-border/10 pb-1.5 uppercase">
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stellar Development Foundation"
                value={form.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Client Email *
              </label>
              <input
                type="email"
                required
                placeholder="billing@stellar.org"
                value={form.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
              Client Stellar Wallet Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. G... (56-character Stellar public key)"
              value={form.clientAddress}
              onChange={(e) => handleInputChange('clientAddress', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Row 2: Billing details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 font-tomket-boys border-b border-brand-border/10 pb-1.5 uppercase">
            Invoice details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Invoice Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Smart Contract Audit Escrow"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  Billing Amount (XLM) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    placeholder="2500.00"
                    value={form.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full pl-3 pr-12 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white font-tomket-boys font-semibold"
                  />
                  <span className="text-xs font-bold text-gray-400 absolute right-3 top-2.5 font-tomket-boys select-none">
                    XLM
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white font-tomket-boys"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Description / Line Items *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detail the work performed, milestones reached or specific deliverables..."
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1 font-tomket-boys">
                ADDITIONAL NOTES / MEMO (OPTIONAL)
              </label>
              <textarea
                rows={2}
                placeholder="Include wallet public keys, special transfer conditions or standard greetings..."
                value={form.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border/30 rounded focus:outline-none focus:border-brand-purple dark:bg-brand-dark/40 dark:border-white/10 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="pt-4 border-t border-brand-border/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="px-5 py-2.5 rounded border border-brand-border/30 hover:bg-brand-light/50 dark:border-white/5 dark:text-white text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-95 font-semibold text-sm transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Publish Escrow Invoice
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

// ==========================================
// INVOICE DETAILS
// ==========================================
function InvoiceDetailsPage() {
  const { currentInvoiceId, payInvoiceAction, cancelInvoiceAction, wallet, navigateTo } = useInvoiceX();
  const [invoice, setInvoice] = useState<InvoiceContractState | undefined>(undefined);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadInvoiceDetails = () => {
      if (currentInvoiceId) {
        setInvoice(getInvoiceById(currentInvoiceId));
      }
    };

    loadInvoiceDetails();

    const handleInvoiceUpdate = () => {
      loadInvoiceDetails();
    };

    window.addEventListener('invoicex_invoices_change', handleInvoiceUpdate);
    return () => window.removeEventListener('invoicex_invoices_change', handleInvoiceUpdate);
  }, [currentInvoiceId]);

  if (!invoice) {
    return (
      <div className="text-center py-16 text-gray-500 font-jt-rejiro text-left">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
        <h3 className="font-bold text-base">Invoice Not Found</h3>
        <p className="text-xs text-gray-400 mt-1">The requested invoice hash does not exist in local storage or smart contract index.</p>
        <button 
          onClick={() => navigateTo('invoices')}
          className="mt-6 px-4 py-2 bg-brand-purple-dark text-white dark:text-black rounded font-semibold text-xs hover:bg-opacity-95"
        >
          Return to Invoice Ledger
        </button>
      </div>
    );
  }

  const isOwner = wallet.isConnected && wallet.address === invoice.creator;

  const handlePay = async () => {
    setPaying(true);
    await payInvoiceAction(invoice.id);
    setPaying(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    await cancelInvoiceAction(invoice.id);
    setCancelling(false);
  };

  // Determine relative due date text
  const getDueStatus = () => {
    const due = new Date(invoice.dueDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (invoice.status === 'paid') return 'Paid';
    if (invoice.status === 'cancelled') return 'Cancelled';
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-jt-rejiro text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-brand-border/10 pb-4">
        <div>
          <button 
            onClick={() => navigateTo('invoices')}
            className="text-xs text-brand-purple-dark dark:text-brand-purple font-semibold hover:underline"
          >
            ← Back to All Invoices
          </button>
          <h2 className="text-xl font-majesti font-bold text-gray-900 dark:text-white mt-1">Invoice Details</h2>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === 'pending' && (
            <>
              {isOwner ? (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 rounded font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Voiding...' : 'Cancel Invoice'}
                </button>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="px-5 py-2 bg-brand-purple-dark text-white dark:text-black hover:bg-opacity-95 rounded font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {paying ? 'Paying...' : 'Sign & Pay XLM'}
                </button>
              )}
            </>
          )}

          <span className={`text-[10px] font-bold font-tomket-boys px-3 py-1.5 rounded-full ${
            invoice.status === 'paid'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/20'
              : invoice.status === 'cancelled'
              ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/20'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20'
          }`}>
            STATUS: {invoice.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Invoice Document View */}
      <div className="bg-white dark:bg-brand-dark/90 border border-brand-border/20 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Invoice Document Body */}
        <div className="flex-1 p-6 md:p-8 space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="font-majesti text-2xl font-bold bg-gradient-to-r from-brand-purple-dark to-brand-blue-dark dark:from-brand-purple dark:to-brand-blue bg-clip-text text-transparent">
                InvoiceX
              </span>
              <span className="text-[10px] text-gray-400 font-mono block mt-1">ON-CHAIN BILLING SYSTEM</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block font-tomket-boys">INVOICE REFERENCE ID</span>
              <span className="text-sm font-bold font-tomket-boys text-gray-700 dark:text-gray-300">{invoice.id}</span>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-brand-border/10">
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">DATE PUBLISHED</span>
              <span className="text-xs font-semibold dark:text-white mt-0.5 block">{new Date(invoice.timestamp).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">DUE DATE</span>
              <span className="text-xs font-semibold dark:text-white mt-0.5 block font-tomket-boys">{invoice.dueDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">PAYMENT WINDOW</span>
              <span className="text-xs font-semibold text-brand-purple-dark dark:text-brand-purple mt-0.5 block">
                {getDueStatus()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">CREATOR CONTRACT TYPE</span>
              <span className="text-xs font-semibold dark:text-white mt-0.5 block font-tomket-boys">SOROBAN V1</span>
            </div>
          </div>

          {/* Client & Billing addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">BILL TO (CLIENT)</span>
              <div className="mt-2 space-y-1">
                <span className="font-bold text-gray-900 dark:text-white block">{invoice.clientName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {invoice.clientEmail}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-mono select-all">
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  {formatAddress(invoice.clientAddress)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">BILL FROM (CREATOR WALLET)</span>
              <div className="mt-2 space-y-1">
                <span className="font-bold text-gray-900 dark:text-white block">Stellar Developer</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-tomket-boys select-all font-mono">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {formatAddress(invoice.creator)}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Itemized Lines */}
          <div className="space-y-3">
            <span className="text-[10px] text-gray-400 block font-tomket-boys">DELIVERABLES DESCRIPTION</span>
            <div className="p-4 rounded-lg bg-brand-light/20 dark:bg-brand-dark/40 border border-brand-border/10">
              <h4 className="text-sm font-bold dark:text-white">{invoice.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {invoice.description}
              </p>
            </div>
          </div>

          {/* Invoice Notes */}
          {invoice.notes && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 block font-tomket-boys">ADDITIONAL MEMO / PAYMENT TERMS</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                "{invoice.notes}"
              </p>
            </div>
          )}

          {/* Pricing Total */}
          <div className="flex justify-end pt-4 border-t border-brand-border/10">
            <div className="w-60 text-right space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Subtotal</span>
                <span className="font-tomket-boys">{parseFloat(invoice.amount).toFixed(2)} XLM</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Ledger transaction fee</span>
                <span className="font-tomket-boys">0.00 XLM</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-brand-purple-dark dark:text-white pt-2 border-t border-brand-border/10">
                <span>Total Due</span>
                <span className="font-tomket-boys">{parseFloat(invoice.amount).toFixed(2)} XLM</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Ledger / Contract Metadata panel */}
        <div className="w-full md:w-80 bg-brand-light/30 dark:bg-brand-dark border-t md:border-t-0 md:border-l border-brand-border/20 p-6 md:p-8 space-y-6">
          <h3 className="text-xs font-bold text-gray-400 font-tomket-boys border-b border-brand-border/10 pb-2 mb-4 uppercase">
            Ledger Proof Panel
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">SOROBAN ID</span>
              <span className="text-[10px] font-mono text-gray-600 dark:text-gray-300 block truncate mt-1 bg-white dark:bg-brand-dark/50 p-1.5 rounded border border-brand-border/10 select-all font-tomket-boys">
                {getNetworkConfig().contractId}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block font-tomket-boys">CONTRACT STATUS</span>
              {invoice.status === 'paid' ? (
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 inline-block mt-1 font-tomket-boys">
                  PAYMENT_SETTLED
                </span>
              ) : invoice.status === 'cancelled' ? (
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 inline-block mt-1 font-tomket-boys">
                  INVOICE_VOIDED
                </span>
              ) : (
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 inline-block mt-1 font-tomket-boys">
                  OPEN_ESCROW
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-brand-border/10 space-y-3">
              <div>
                <span className="text-[10px] text-gray-400 block font-tomket-boys">CREATION HASH</span>
                <a 
                  href={invoice.txHash.startsWith('sim_hash_') ? '#' : `https://stellar.expert/explorer/testnet/tx/${invoice.txHash}`}
                  target={invoice.txHash.startsWith('sim_hash_') ? '_self' : '_blank'}
                  rel="noreferrer"
                  className="text-xs text-brand-purple hover:underline block truncate mt-1 font-tomket-boys font-mono"
                >
                  {invoice.txHash}
                </a>
              </div>

              {invoice.payTxHash && (
                <div>
                  <span className="text-[10px] text-gray-400 block font-tomket-boys">PAYMENT HASH</span>
                  <a 
                    href={invoice.payTxHash.startsWith('sim_hash_') ? '#' : `https://stellar.expert/explorer/testnet/tx/${invoice.payTxHash}`}
                    target={invoice.payTxHash.startsWith('sim_hash_') ? '_self' : '_blank'}
                    rel="noreferrer"
                    className="text-xs text-brand-purple hover:underline block truncate mt-1 font-tomket-boys font-mono"
                  >
                    {invoice.payTxHash}
                  </a>
                </div>
              )}

              {invoice.cancelTxHash && (
                <div>
                  <span className="text-[10px] text-gray-400 block font-tomket-boys">CANCEL HASH</span>
                  <a 
                    href={invoice.cancelTxHash.startsWith('sim_hash_') ? '#' : `https://stellar.expert/explorer/testnet/tx/${invoice.cancelTxHash}`}
                    target={invoice.cancelTxHash.startsWith('sim_hash_') ? '_self' : '_blank'}
                    rel="noreferrer"
                    className="text-xs text-brand-purple hover:underline block truncate mt-1 font-tomket-boys font-mono"
                  >
                    {invoice.cancelTxHash}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-brand-border/10 text-[10px] text-gray-400 leading-relaxed font-jt-rejiro bg-brand-light/20 dark:bg-brand-dark/20 p-2.5 rounded">
              <span className="font-bold font-tomket-boys block mb-1">STELLAR AUDIT TIP</span>
              Verify hashes in the Stellar Expert public ledger to inspect gas logs and contract parameters for this billing escrow.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// ==========================================
// TRANSACTION HISTORY
// ==========================================
function TransactionsPage() {
  const [txs, setTxs] = useState<TransactionItem[]>([]);

  const loadTransactions = () => {
    setTxs(getTransactionHistory());
  };

  useEffect(() => {
    loadTransactions();

    const handleTxsChange = () => {
      loadTransactions();
    };

    window.addEventListener('invoicex_transactions_change', handleTxsChange);
    return () => window.removeEventListener('invoicex_transactions_change', handleTxsChange);
  }, []);

  return (
    <div className="space-y-6 font-jt-rejiro text-left">
      <div>
        <h2 className="text-2xl font-majesti font-bold text-gray-900 dark:text-white">Transaction Logs</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-tomket-boys mt-0.5">
          LOCAL INTERACTION LEDGER HISTORY
        </p>
      </div>

      <div className="bg-white dark:bg-brand-dark border border-brand-border/20 rounded-lg shadow-sm overflow-hidden">
        
        {/* Table Head */}
        <div className="hidden md:grid grid-cols-5 p-4 border-b border-brand-border/15 bg-brand-light/30 dark:bg-brand-dark/50 text-xs font-bold text-gray-400 font-tomket-boys">
          <div>DATE</div>
          <div>INVOICE REF</div>
          <div>OPERATION TYPE</div>
          <div>AMOUNT (XLM)</div>
          <div className="text-right">LEDGER STATE</div>
        </div>

        {/* Table Body */}
        {txs.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <History className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="font-medium text-sm">No Transactions Logged</p>
            <p className="text-xs text-gray-400 mt-1">Wallet interactions are stored here to trace ledger status.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border/10 dark:divide-white/5">
            {txs.map((tx) => (
              <div 
                key={tx.id}
                className="grid grid-cols-1 md:grid-cols-5 p-4 items-center gap-2 text-sm"
              >
                {/* Date */}
                <div className="text-left">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">DATE</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 font-tomket-boys">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Invoice Ref */}
                <div className="text-left font-mono font-tomket-boys text-xs">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">INVOICE REF</span>
                  {tx.invoiceId}
                </div>

                {/* Operation */}
                <div className="text-left capitalize font-semibold dark:text-white">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">OPERATION</span>
                  {tx.type === 'create' ? 'Publish Invoice' : tx.type === 'pay' ? 'Escrow Payment' : 'Void Escrow'}
                </div>

                {/* Amount */}
                <div className="text-left font-bold font-tomket-boys text-brand-purple-dark dark:text-white">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-0.5">AMOUNT</span>
                  {parseFloat(tx.amount).toFixed(2)} XLM
                </div>

                {/* Status / Hash */}
                <div className="text-left md:text-right">
                  <span className="md:hidden text-[10px] text-gray-400 block font-tomket-boys mb-1">LEDGER STATE</span>
                  <div className="flex flex-col md:items-end">
                    <span className={`text-[10px] font-bold font-tomket-boys px-2.5 py-0.5 rounded-full inline-block ${
                      tx.status === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/20'
                        : tx.status === 'failed'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/20'
                        : tx.status === 'processing'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/20 animate-pulse'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                    {tx.hash && (
                      <a 
                        href={tx.hash.startsWith('sim_hash_') ? '#' : `https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                        target={tx.hash.startsWith('sim_hash_') ? '_self' : '_blank'}
                        rel="noreferrer"
                        className="text-[9px] text-brand-purple hover:underline mt-1 font-tomket-boys font-mono max-w-[120px] truncate block"
                      >
                        {tx.hash}
                      </a>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ==========================================
// 404 PAGE
// ==========================================
function NotFoundPage() {
  const { navigateTo } = useInvoiceX();
  return (
    <div className="text-center py-20 font-jt-rejiro text-left">
      <AlertCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
      <h2 className="text-3xl font-majesti font-bold text-gray-900 dark:text-white">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
        The route/hash you navigated to is invalid or does not correspond to an active InvoiceX page module.
      </p>
      <button
        onClick={() => navigateTo('dashboard')}
        className="mt-6 px-6 py-2.5 bg-brand-purple-dark text-white dark:text-black rounded font-semibold text-sm hover:bg-opacity-95 shadow-md"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// Main App Coordinator Routing Shell
function AppContent() {
  const { currentPage } = useInvoiceX();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardPage onOpenWalletModal={() => setWalletModalOpen(true)} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'create-invoice':
        return <CreateInvoicePage />;
      case 'invoice-details':
        return <InvoiceDetailsPage />;
      case 'transactions':
        return <TransactionsPage />;
      case '404':
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <>
      <Layout onOpenWalletModal={() => setWalletModalOpen(true)}>
        {renderActivePage()}
      </Layout>
      
      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <TransactionStatusModal />
      <ToastsContainer />
    </>
  );
}

// Wrapper to provide contexts correctly
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
