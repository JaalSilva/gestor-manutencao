import { Transaction } from '../types';
import { subMonths, isAfter, parse, startOfMonth } from 'date-fns';

export function calculateMovingAverage(transactions: Transaction[], months: number): number {
  if (!transactions || transactions.length === 0) return 0;

  const now = new Date();
  const startDate = subMonths(startOfMonth(now), months);
  
  const relevantTransactions = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const tDate = new Date(t.date);
    return isAfter(tDate, startDate);
  });

  if (relevantTransactions.length === 0) return 0;

  const total = relevantTransactions.reduce((acc, t) => acc + t.value, 0);
  return total / months;
}

export function getRevenueByOrigin(transactions: Transaction[]): Record<string, number> {
  const breakdown: Record<string, number> = {
    'Cajazeiras Oito': 0,
    'Cajazeiras Nove': 0,
    'Fazenda Grande Dois': 0,
    'Jaguaripe': 0,
    'Parque São José': 0,
    'Banco': 0
  };

  (transactions || []).forEach(t => {
    if (t.type === 'deposit' && t.origin && breakdown[t.origin] !== undefined) {
      breakdown[t.origin] += t.value;
    }
  });

  return breakdown;
}
