export type NetworkMode = 'testnet' | 'simulator';

export interface NetworkConfig {
  mode: NetworkMode;
  horizonUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string; // Registry Contract ID
  paymentManagerContractId: string; // Payment Manager Contract ID
}

const DEFAULT_TESTNET_REGISTRY_ID = 'CAZEGY23AMYTGWXHVPW4ZRY7PDNX7YNX7665PS72YQBZRDGHYDPDQEZC';
const DEFAULT_TESTNET_PAYMENT_MANAGER_ID = 'CDHPTAIV2WHKN3LADJCV3IV7OFVBUKDOSTUQN27RXC6MXW3RBJT3EQDU';

function getValidTestnetContractId(key: string, defaultValue: string): string {
  const value = localStorage.getItem(key);
  if (value && /^C[A-Z2-7]{55}$/.test(value.trim())) {
    return value.trim();
  }
  return defaultValue;
}

export const TESTNET_CONFIG: NetworkConfig = {
  mode: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: getValidTestnetContractId('invoicex_contract_id', DEFAULT_TESTNET_REGISTRY_ID),
  paymentManagerContractId: getValidTestnetContractId('invoicex_pm_contract_id', DEFAULT_TESTNET_PAYMENT_MANAGER_ID),
};

export const SIMULATOR_CONFIG: NetworkConfig = {
  mode: 'simulator',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: 'SIMULATOR_REGISTRY_ID',
  paymentManagerContractId: 'SIMULATOR_PM_ID',
};

export function getNetworkConfig(): NetworkConfig {
  const mode = (localStorage.getItem('invoicex_network_mode') as NetworkMode) || 'simulator';
  return mode === 'testnet' ? TESTNET_CONFIG : SIMULATOR_CONFIG;
}

export function setNetworkMode(mode: NetworkMode): void {
  localStorage.setItem('invoicex_network_mode', mode);
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('invoicex_network_change'));
}

export function setContractId(contractId: string): void {
  localStorage.setItem('invoicex_contract_id', contractId);
  TESTNET_CONFIG.contractId = contractId;
  window.dispatchEvent(new Event('invoicex_contract_change'));
}

export function setContractIds(registryId: string, pmId: string): void {
  localStorage.setItem('invoicex_contract_id', registryId);
  localStorage.setItem('invoicex_pm_contract_id', pmId);
  TESTNET_CONFIG.contractId = registryId;
  TESTNET_CONFIG.paymentManagerContractId = pmId;
  window.dispatchEvent(new Event('invoicex_contract_change'));
}
