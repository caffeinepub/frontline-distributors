import type { Bill, Product, Customer } from '../types/local';
import type { Expense } from '../backend';

export interface DailySales {
  date: string;
  totalSales: number;
  totalCost: number;
  totalExpenses: number;
  totalCredits: number;
  profit: number;
  billCount: number;
}

export interface DateRangeSummary {
  totalRevenue: number;
  totalCost: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  billCount: number;
  averageBillValue: number;
}

export interface ProfitData {
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
}

export function getDailySales(bills: Bill[], customers: Customer[]): DailySales[] {
  const dailyMap = new Map<string, DailySales>();

  // Process bills
  bills.forEach(bill => {
    const date = new Date(Number(bill.timestamp)).toLocaleDateString();
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        totalSales: 0,
        totalCost: 0,
        totalExpenses: 0,
        totalCredits: 0,
        profit: 0,
        billCount: 0,
      });
    }

    const day = dailyMap.get(date)!;
    const billRevenue = bill.products.reduce((sum, p) => sum + Number(p.price), 0) - Number(bill.discount);
    const billCost = bill.products.reduce((sum, p) => sum + Number(p.cost || 0), 0);
    const billCredit = Number(bill.creditAmount);
    
    day.totalSales += billRevenue;
    day.totalCost += billCost;
    day.totalCredits += billCredit;
    day.billCount += 1;
  });

  // Calculate profit
  dailyMap.forEach(day => {
    day.profit = day.totalSales - day.totalCost - day.totalExpenses;
  });

  return Array.from(dailyMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getDateRangeSummary(
  bills: Bill[],
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): DateRangeSummary {
  const filteredBills = bills.filter(bill => {
    const billDate = new Date(Number(bill.timestamp));
    return billDate >= startDate && billDate <= endDate;
  });

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(Number(expense.timestamp));
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  const totalRevenue = filteredBills.reduce((sum, bill) => {
    return sum + bill.products.reduce((s, p) => s + Number(p.price), 0) - Number(bill.discount);
  }, 0);

  const totalCost = filteredBills.reduce((sum, bill) => {
    return sum + bill.products.reduce((s, p) => s + Number(p.cost || 0), 0);
  }, 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    return sum + Number(expense.amount);
  }, 0);

  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;
  const billCount = filteredBills.length;
  const averageBillValue = billCount > 0 ? totalRevenue / billCount : 0;

  return {
    totalRevenue,
    totalCost,
    totalExpenses,
    grossProfit,
    netProfit,
    billCount,
    averageBillValue,
  };
}

export function calculateProfit(
  bills: Bill[],
  products: Product[],
  expenses: Expense[],
  startTime: number,
  endTime: number
): ProfitData {
  const filteredBills = bills.filter(bill => {
    const billTime = Number(bill.timestamp);
    return billTime >= startTime && billTime <= endTime;
  });

  const filteredExpenses = expenses.filter(expense => {
    const expenseTime = Number(expense.timestamp);
    return expenseTime >= startTime && expenseTime <= endTime;
  });

  const totalRevenue = filteredBills.reduce((sum, bill) => {
    return sum + bill.products.reduce((s, p) => s + Number(p.price), 0) - Number(bill.discount);
  }, 0);

  const totalCOGS = filteredBills.reduce((sum, bill) => {
    return sum + bill.products.reduce((s, p) => s + Number(p.cost || 0), 0);
  }, 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    return sum + Number(expense.amount);
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue,
    totalCOGS,
    totalExpenses,
    grossProfit,
    netProfit,
  };
}
