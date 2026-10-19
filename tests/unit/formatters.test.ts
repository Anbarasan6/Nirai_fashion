import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  calculateNetDiscount,
  formatDate,
  formatPhoneDisplay,
} from '../../src/utils/formatters';

describe('Formatters & Price Helpers', () => {
  describe('formatPrice', () => {
    it('formats numbers into Indian currency format with rupee symbol', () => {
      expect(formatPrice(1500)).toBe('₹1,500');
      expect(formatPrice(125000)).toBe('₹1,25,000');
      expect(formatPrice(0)).toBe('₹0');
    });

    it('handles null, undefined, or NaN gracefully', () => {
      expect(formatPrice(null)).toBe('₹0');
      expect(formatPrice(undefined)).toBe('₹0');
      expect(formatPrice(NaN)).toBe('₹0');
    });
  });

  describe('calculateNetDiscount', () => {
    it('sums regular and special discounts accurately capped at 100%', () => {
      expect(calculateNetDiscount(10, 5)).toBe(15);
      expect(calculateNetDiscount(20)).toBe(20);
      expect(calculateNetDiscount(80, 50)).toBe(100);
      expect(calculateNetDiscount(-5, -10)).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('formats ISO dates into Indian standard date string', () => {
      const formatted = formatDate('2026-10-19T10:00:00Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Oct');
    });

    it('handles null or invalid date strings safely', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatPhoneDisplay', () => {
    it('formats 10-digit phone number with +91 prefix and space grouping', () => {
      expect(formatPhoneDisplay('9876543210')).toBe('+91 98765 43210');
    });

    it('returns raw value for non-10 digit input or empty string', () => {
      expect(formatPhoneDisplay('')).toBe('');
      expect(formatPhoneDisplay('12345')).toBe('12345');
    });
  });
});
