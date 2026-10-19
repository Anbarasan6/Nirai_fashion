import { describe, it, expect } from 'vitest';
import {
  phoneSchema,
  pincodeSchema,
  upiIdSchema,
  ifscSchema,
  paymentProofSchema,
} from '../../src/utils/validationSchemas';

describe('Validation Schemas', () => {
  describe('Indian Phone Schema', () => {
    it('accepts valid 10-digit Indian numbers starting with 6, 7, 8, 9', () => {
      expect(phoneSchema.safeParse('9876543210').success).toBe(true);
      expect(phoneSchema.safeParse('8123456789').success).toBe(true);
      expect(phoneSchema.safeParse('7000000000').success).toBe(true);
      expect(phoneSchema.safeParse('6999999999').success).toBe(true);
      expect(phoneSchema.safeParse('  9876543210  ').success).toBe(true); // Trimming
    });

    it('rejects numbers starting with 0-5, invalid lengths, or characters', () => {
      expect(phoneSchema.safeParse('5876543210').success).toBe(false);
      expect(phoneSchema.safeParse('0876543210').success).toBe(false);
      expect(phoneSchema.safeParse('987654321').success).toBe(false); // 9 digits
      expect(phoneSchema.safeParse('98765432100').success).toBe(false); // 11 digits
      expect(phoneSchema.safeParse('98765ABCDE').success).toBe(false);
      expect(phoneSchema.safeParse('').success).toBe(false);
    });
  });

  describe('Indian Pincode Schema', () => {
    it('accepts valid 6-digit Indian PIN codes starting with 1-9', () => {
      expect(pincodeSchema.safeParse('600001').success).toBe(true); // Chennai
      expect(pincodeSchema.safeParse('636006').success).toBe(true); // Salem
      expect(pincodeSchema.safeParse('110001').success).toBe(true); // Delhi
      expect(pincodeSchema.safeParse('560001').success).toBe(true); // Bangalore
      expect(pincodeSchema.safeParse(' 600090 ').success).toBe(true); // Trimming
    });

    it('rejects pincodes starting with 0, containing non-digits, or wrong length', () => {
      expect(pincodeSchema.safeParse('012345').success).toBe(false);
      expect(pincodeSchema.safeParse('60000').success).toBe(false); // 5 digits
      expect(pincodeSchema.safeParse('6000001').success).toBe(false); // 7 digits
      expect(pincodeSchema.safeParse('60000A').success).toBe(false);
      expect(pincodeSchema.safeParse('').success).toBe(false);
    });
  });

  describe('UPI VPA / ID Schema', () => {
    it('accepts valid UPI VPAs', () => {
      expect(upiIdSchema.safeParse('niraihandlooms@icici').success).toBe(true);
      expect(upiIdSchema.safeParse('user.name@okhdfcbank').success).toBe(true);
      expect(upiIdSchema.safeParse('9876543210@upi').success).toBe(true);
      expect(upiIdSchema.safeParse('merchant_biz@axl').success).toBe(true);
    });

    it('rejects invalid UPI VPAs without handle or invalid symbols', () => {
      expect(upiIdSchema.safeParse('invalid_vpa').success).toBe(false);
      expect(upiIdSchema.safeParse('@icici').success).toBe(false);
      expect(upiIdSchema.safeParse('user@').success).toBe(false);
      expect(upiIdSchema.safeParse('user@bank@extra').success).toBe(false);
      expect(upiIdSchema.safeParse('').success).toBe(false);
    });
  });

  describe('Bank IFSC Schema', () => {
    it('accepts valid 11-character IFSC codes with 5th character 0', () => {
      expect(ifscSchema.safeParse('HDFC0001244').success).toBe(true);
      expect(ifscSchema.safeParse('SBIN0000456').success).toBe(true);
      expect(ifscSchema.safeParse('ICIC0000001').success).toBe(true);
      expect(ifscSchema.safeParse('  sbin0000456  ').success).toBe(true); // Uppercased & trimmed
    });

    it('rejects invalid IFSC codes', () => {
      expect(ifscSchema.safeParse('HDFC1001244').success).toBe(false); // 5th char not '0'
      expect(ifscSchema.safeParse('HDF0001244').success).toBe(false); // Too short
      expect(ifscSchema.safeParse('12340001244').success).toBe(false); // First 4 not letters
      expect(ifscSchema.safeParse('HDFC00012445').success).toBe(false); // Too long
    });
  });

  describe('Payment Proof Schema (UTR Rules for UPI vs Bank Transfer)', () => {
    it('accepts UPI/QR payments with exactly 12 numeric digits', () => {
      const validUpi = {
        method: 'upi' as const,
        utr: '428901234567',
        amountPaid: 3499,
        payerName: 'Sundararajan',
      };
      expect(paymentProofSchema.safeParse(validUpi).success).toBe(true);

      const validQr = {
        method: 'qr' as const,
        utr: '987654321098',
        amountPaid: 1500,
        payerName: 'Kavitha M',
      };
      expect(paymentProofSchema.safeParse(validQr).success).toBe(true);
    });

    it('rejects UPI payments with non-12 digits or alphabetic UTRs', () => {
      const shortUpi = {
        method: 'upi' as const,
        utr: '42890123456', // 11 digits
        amountPaid: 3499,
        payerName: 'Sundararajan',
      };
      const res1 = paymentProofSchema.safeParse(shortUpi);
      expect(res1.success).toBe(false);

      const alphaUpi = {
        method: 'upi' as const,
        utr: '42890123456A', // Contains letter
        amountPaid: 3499,
        payerName: 'Sundararajan',
      };
      const res2 = paymentProofSchema.safeParse(alphaUpi);
      expect(res2.success).toBe(false);
    });

    it('accepts bank transfer payments with 6 to 22 alphanumeric characters', () => {
      const validNeft = {
        method: 'bank_transfer' as const,
        utr: 'N12345678901',
        amountPaid: 5000,
        payerName: 'Murugan Silk Traders',
      };
      expect(paymentProofSchema.safeParse(validNeft).success).toBe(true);

      const validRtgs = {
        method: 'bank_transfer' as const,
        utr: 'HDFCR5202610190012',
        amountPaid: 25000,
        payerName: 'Vasanthi',
      };
      expect(paymentProofSchema.safeParse(validRtgs).success).toBe(true);
    });

    it('rejects bank transfer payments with too short or invalid symbols', () => {
      const tooShortBank = {
        method: 'bank_transfer' as const,
        utr: 'AB123', // 5 chars (min 6)
        amountPaid: 5000,
        payerName: 'Murugan Silk Traders',
      };
      expect(paymentProofSchema.safeParse(tooShortBank).success).toBe(false);

      const invalidCharBank = {
        method: 'bank_transfer' as const,
        utr: 'REF#123456', // Invalid symbol #
        amountPaid: 5000,
        payerName: 'Murugan Silk Traders',
      };
      expect(paymentProofSchema.safeParse(invalidCharBank).success).toBe(false);
    });

    it('rejects negative or zero amount paid', () => {
      const zeroAmount = {
        method: 'upi' as const,
        utr: '428901234567',
        amountPaid: 0,
        payerName: 'Sundararajan',
      };
      expect(paymentProofSchema.safeParse(zeroAmount).success).toBe(false);
    });
  });
});
