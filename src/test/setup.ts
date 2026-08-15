import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Freighter API
vi.mock('@stellar/freighter-api', () => {
  const mockApi = {
    isConnected: vi.fn().mockResolvedValue(true),
    getPublicKey: vi.fn().mockResolvedValue('GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4'),
    signTransaction: vi.fn().mockResolvedValue('xdr_signed_tx_placeholder'),
    getNetwork: vi.fn().mockResolvedValue('TESTNET'),
    getAddress: vi.fn().mockResolvedValue({ address: 'GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4' }),
    requestAccess: vi.fn().mockResolvedValue({ address: 'GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4' }),
    signAuthEntry: vi.fn().mockResolvedValue('signed_auth_entry'),
    signMessage: vi.fn().mockResolvedValue({ signedMessage: 'signed_message' }),
  };
  return {
    ...mockApi,
    default: mockApi,
  };
});
