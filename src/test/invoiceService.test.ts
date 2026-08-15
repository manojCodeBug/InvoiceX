import { describe, it, expect } from 'vitest';
import { validateInvoiceInput, getInvoiceById } from '../services/invoice';

describe('Invoice Service Unit Tests', () => {
  it('should fail validation if fields are empty', () => {
    const error = validateInvoiceInput({
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      title: '',
      description: '',
      amount: '',
      dueDate: '',
      notes: '',
    });

    expect(error).toBe('Client name is required');
  });

  it('should fail validation for invalid emails', () => {
    const error = validateInvoiceInput({
      clientName: 'Stellar Foundation',
      clientEmail: 'invalid-email',
      clientAddress: 'GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4',
      title: 'Dev Consulting',
      description: 'Stellar dApp Integration',
      amount: '500',
      dueDate: '2026-12-31',
      notes: '',
    });

    expect(error).toBe('Invalid client email address');
  });

  it('should fail validation for invalid Stellar addresses', () => {
    const error = validateInvoiceInput({
      clientName: 'Stellar Foundation',
      clientEmail: 'contact@stellar.org',
      clientAddress: 'INVALID_STELLAR_KEY',
      title: 'Dev Consulting',
      description: 'Stellar dApp Integration',
      amount: '500',
      dueDate: '2026-12-31',
      notes: '',
    });

    expect(error).toBe('Invalid client Stellar address (must start with G or C, 56 characters)');
  });

  it('should pass validation with correct input values', () => {
    const error = validateInvoiceInput({
      clientName: 'Stellar Foundation',
      clientEmail: 'contact@stellar.org',
      clientAddress: 'GB5WJUX2HVSQQL4W767U74TNDVDRMX44H376QLBZZF7NGRG73XF7CEX4',
      title: 'Dev Consulting',
      description: 'Stellar dApp Integration',
      amount: '500',
      dueDate: '2026-12-31',
      notes: '',
    });

    expect(error).toBeNull();
  });

  it('should return undefined when searching for a non-existent invoice ID', () => {
    const invoice = getInvoiceById('non-existent-id');
    expect(invoice).toBeUndefined();
  });
});
