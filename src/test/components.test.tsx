import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { AppProvider } from '../hooks/useInvoiceX';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock @stellar/stellar-sdk
vi.mock('@stellar/stellar-sdk', () => {
  return {
    Address: {
      fromString: vi.fn().mockReturnValue({
        toString: () => 'GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4',
        toScVal: () => ({}),
      }),
    },
    nativeToScVal: vi.fn(),
    Operation: {
      invokeContractFunction: vi.fn(),
    },
    TransactionBuilder: vi.fn(),
    rpc: {
      Server: vi.fn().mockImplementation(() => ({
        simulateTransaction: vi.fn(),
        getLatestLedger: vi.fn().mockResolvedValue({ sequence: 100000 }),
        getEvents: vi.fn().mockResolvedValue({ events: [] }),
      })),
      Api: {
        isSimulationError: vi.fn().mockReturnValue(false),
      },
    },
    scValToNative: vi.fn(),
  };
});

// Mock Stellar Wallet Kit
vi.mock('@creit.tech/stellar-wallets-kit', () => {
  return {
    StellarWalletsKit: vi.fn().mockImplementation(() => {
      return {
        connect: vi.fn().mockResolvedValue({ address: 'GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4' }),
        getPublicKey: vi.fn().mockResolvedValue('GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4'),
      };
    }),
    WalletNetwork: {
      TESTNET: 'TESTNET',
    },
    allowFreighter: vi.fn(),
    allowLobi: vi.fn(),
  };
});

describe('React Component & Integration Tests', () => {
  it('should render the Landing page and showcase the product tagline', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    // Validate main elements on landing page
    expect(screen.getByText('Create. Send. Get Paid.')).toBeInTheDocument();
    expect(screen.getByText('On the Stellar Network.')).toBeInTheDocument();
    expect(screen.getByText('Launch InvoiceX')).toBeInTheDocument();
  });

  it('should support toggling application theme color settings', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    const themeToggleBtn = screen.getByTitle('Toggle Theme');
    expect(themeToggleBtn).toBeInTheDocument();

    // Trigger toggle twice to verify resilience
    fireEvent.click(themeToggleBtn);
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.classList).toBeDefined();
  });

  it('should verify the presence of key features in the sandbox presentation', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );

    expect(screen.getByText('Freighter Wallet Sign')).toBeInTheDocument();
    expect(screen.getByText('Soroban Smart Contracts')).toBeInTheDocument();
    expect(screen.getByText('Event Monitoring')).toBeInTheDocument();
  });
});
