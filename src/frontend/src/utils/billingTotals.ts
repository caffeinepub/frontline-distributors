/**
 * Utility functions for calculating billing totals with GST support.
 * Provides consistent rounding and calculation logic across the billing system.
 */

export interface BillingTotalsInput {
  subtotal: number;
  discount: number;
  gstApplied: boolean;
  gstRate: number;
}

export interface BillingTotals {
  subtotal: number;
  discount: number;
  gstAmount: number;
  finalTotal: number;
}

/**
 * Calculate all billing totals including GST.
 * @param input - The billing input values
 * @returns Calculated totals with predictable rounding
 */
export function calculateBillingTotals(input: BillingTotalsInput): BillingTotals {
  const { subtotal, discount, gstApplied, gstRate } = input;

  // Calculate subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);

  // Calculate GST amount if applicable
  const gstAmount = gstApplied ? Math.round((subtotalAfterDiscount * gstRate) / 100) : 0;

  // Calculate final total
  const finalTotal = subtotalAfterDiscount + gstAmount;

  return {
    subtotal,
    discount,
    gstAmount,
    finalTotal,
  };
}

/**
 * Calculate total from a stored bill with GST fields.
 * Handles legacy bills without GST fields gracefully.
 */
export function calculateBillTotal(bill: {
  products: Array<{ price: bigint }>;
  discount: bigint;
  gstApplied?: boolean;
  gstAmount?: bigint;
}): number {
  const subtotal = bill.products.reduce((sum, p) => sum + Number(p.price), 0);
  const discount = Number(bill.discount);
  
  // If GST fields exist and GST was applied, use the stored GST amount
  if (bill.gstApplied && bill.gstAmount !== undefined) {
    return subtotal - discount + Number(bill.gstAmount);
  }
  
  // Legacy bills without GST
  return subtotal - discount;
}
