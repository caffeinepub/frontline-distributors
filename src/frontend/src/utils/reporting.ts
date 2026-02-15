import type { Bill, Expense, Product, Customer } from '../backend';

/**
 * Utility functions for calculating sales, profit, and expense reports.
 */

export interface DailySales {
  date: string;
  billCount: number;
  totalSales: number;
  totalCredits: number;
}

export interface DateRangeSummary {
  billCount: number;
  totalSales: number;
  totalDiscounts: number;
  totalGST: number;
  totalCredits: number;
  totalExpenses: number;
}

export interface ProfitData {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  hasMissingCosts: boolean;
}

/**
 * Group bills by day and calculate daily sales totals
 */
export function getDailySales(bills: Bill[], customers: Customer[]): DailySales[] {
  const dailyMap = new Map<string, DailySales>();

  bills.forEach((bill) => {
    const date = new Date(Number(bill.timestamp));
    const dateKey = date.toISOString().split('T')[0];

    const subtotal = bill.products.reduce((sum, p) => sum + Number(p.price), 0);
    const discount = Number(bill.discount);
    const gstAmount = Number(bill.gstAmount || 0n);
    const total = subtotal - discount + gstAmount;
    const credit = Number(bill.creditAmount);

    if (dailyMap.has(dateKey)) {
      const existing = dailyMap.get(dateKey)!;
      existing.billCount += 1;
      existing.totalSales += total;
      existing.totalCredits += credit;
    } else {
      dailyMap.set(dateKey, {
        date: dateKey,
        billCount: 1,
        totalSales: total,
        totalCredits: credit,
      });
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Calculate summary for a date range
 */
export function getDateRangeSummary(
  bills: Bill[],
  expenses: Expense[],
  startTime: number,
  endTime: number
): DateRangeSummary {
  const filteredBills = bills.filter((bill) => {
    const timestamp = Number(bill.timestamp);
    return timestamp >= startTime && timestamp < endTime;
  });

  const filteredExpenses = expenses.filter((expense) => {
    const timestamp = Number(expense.timestamp);
    return timestamp >= startTime && timestamp < endTime;
  });

  let totalSales = 0;
  let totalDiscounts = 0;
  let totalGST = 0;
  let totalCredits = 0;

  filteredBills.forEach((bill) => {
    const subtotal = bill.products.reduce((sum, p) => sum + Number(p.price), 0);
    const discount = Number(bill.discount);
    const gstAmount = Number(bill.gstAmount || 0n);
    const credit = Number(bill.creditAmount);

    totalSales += subtotal - discount + gstAmount;
    totalDiscounts += discount;
    totalGST += gstAmount;
    totalCredits += credit;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return {
    billCount: filteredBills.length,
    totalSales,
    totalDiscounts,
    totalGST,
    totalCredits,
    totalExpenses,
  };
}

/**
 * Calculate profit including COGS and expenses
 */
export function calculateProfit(
  bills: Bill[],
  products: Product[],
  expenses: Expense[],
  startTime: number,
  endTime: number
): ProfitData {
  const filteredBills = bills.filter((bill) => {
    const timestamp = Number(bill.timestamp);
    return timestamp >= startTime && timestamp < endTime;
  });

  const filteredExpenses = expenses.filter((expense) => {
    const timestamp = Number(expense.timestamp);
    return timestamp >= startTime && timestamp < endTime;
  });

  let totalRevenue = 0;
  let totalCOGS = 0;
  let hasMissingCosts = false;

  // Create a product lookup map
  const productMap = new Map<string, Product>();
  products.forEach((p) => productMap.set(p.id.toString(), p));

  filteredBills.forEach((bill) => {
    const subtotal = bill.products.reduce((sum, p) => sum + Number(p.price), 0);
    const discount = Number(bill.discount);
    const gstAmount = Number(bill.gstAmount || 0n);
    totalRevenue += subtotal - discount + gstAmount;

    // Calculate COGS for this bill
    bill.products.forEach((billProduct) => {
      const productData = productMap.get(billProduct.id.toString());
      if (productData && productData.cost !== undefined) {
        totalCOGS += Number(productData.cost);
      } else {
        // Use cost from bill product if available (for historical bills)
        if (billProduct.cost !== undefined && billProduct.cost !== 0n) {
          totalCOGS += Number(billProduct.cost);
        } else {
          hasMissingCosts = true;
        }
      }
    });
  });

  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalExpenses,
    netProfit,
    hasMissingCosts,
  };
}
