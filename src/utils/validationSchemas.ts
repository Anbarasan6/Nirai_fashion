/**
 * Centralized Validation Schemas (Zod)
 * Validates Indian phone numbers, postal PIN codes, UPI VPAs, Bank IFSC codes,
 * and payment UTRs according to RBI / NPCI specifications.
 */

import { z } from 'zod';

export const phoneRegex = /^[6-9]\d{9}$/;
export const pincodeRegex = /^[1-9]\d{5}$/;
export const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const upiUtrRegex = /^\d{12}$/;
export const bankUtrRegex = /^[A-Z0-9]{6,22}$/;

/**
 * Validates a 10-digit Indian mobile number (begins with 6, 7, 8, or 9)
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(phoneRegex, 'Enter a valid 10-digit Indian phone number starting with 6-9');

/**
 * Validates a 6-digit Indian Postal Index Number (PIN)
 */
export const pincodeSchema = z
  .string()
  .trim()
  .regex(pincodeRegex, 'Enter a valid 6-digit Indian PIN code');

/**
 * Validates a standard UPI Virtual Payment Address (VPA / UPI ID)
 */
export const upiIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(upiIdRegex, 'Enter a valid UPI ID (e.g., storename@icici, mobile@upi)');

/**
 * Validates an 11-character Indian Financial System Code (IFSC)
 */
export const ifscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(ifscRegex, 'Invalid IFSC format. Expected 11 uppercase alphanumeric characters (e.g. HDFC0001244)');

/**
 * Validates payment proof submissions with conditional UTR rules
 * UPI/QR: strictly 12 numeric digits
 * Bank Transfer (NEFT/RTGS/IMPS): 6 to 22 alphanumeric characters
 */
export const paymentProofSchema = z
  .object({
    method: z.enum(['upi', 'qr', 'bank_transfer']),
    utr: z.string().trim().toUpperCase(),
    amountPaid: z.number().positive('Amount must be greater than zero'),
    payerName: z.string().trim().min(2, 'Payer name is required'),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'upi' || data.method === 'qr') {
      if (!upiUtrRegex.test(data.utr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['utr'],
          message: 'UPI UTR reference must be exactly 12 numeric digits.',
        });
      }
    } else if (data.method === 'bank_transfer') {
      if (!bankUtrRegex.test(data.utr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['utr'],
          message: 'Bank transfer reference (NEFT/IMPS/RTGS) must be 6 to 22 alphanumeric characters.',
        });
      }
    }
  });

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
