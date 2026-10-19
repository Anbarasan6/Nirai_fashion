/**
 * Formatting helpers for prices, dates, and localized strings (INR / Tamil Nadu standard)
 */

/**
 * Formats a numeric price into INR currency display: e.g. 1500 -> "₹1,500"
 */
export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const formatted = Math.round(amount).toLocaleString('en-IN');
  return `₹${formatted}`;
}

/**
 * Calculates net effective discount percentage from regular & special discounts
 */
export function calculateNetDiscount(regularDiscount = 0, specialDiscount = 0): number {
  const reg = Math.max(0, regularDiscount);
  const spec = Math.max(0, specialDiscount);
  return Math.min(100, Math.round(reg + spec));
}

/**
 * Formats an ISO date into human-readable Indian standard date
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a phone number for display: "9876543210" -> "+91 98765 43210"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}
