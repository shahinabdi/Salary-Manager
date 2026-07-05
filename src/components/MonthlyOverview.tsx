import React, { useMemo, useState } from 'react';
import { YearlyData, BillEntry } from '../types';
import { formatCurrency, formatMonthYear, getMonthlyFinancialSummary, getMonthName } from '../utils/helpers';
import { Calendar, TrendingDown, TrendingUp, Wallet, Receipt, Repeat } from 'lucide-react';

interface MonthlyOverviewProps {
  data: YearlyData[];
  selectedYear: number;
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ data, selectedYear }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const monthSummary = useMemo(() => getMonthlyFinancialSummary(data, selectedYear, selectedMonth), [data, selectedYear, selectedMonth]);

  const monthEntries = useMemo(
    () => data.filter(item => item.year === selectedYear && item.month === selectedMonth),
    [data, selectedYear, selectedMonth]
  );

  const billEntries = monthEntries.filter((item): item is BillEntry => item.category === 'bill');
  const oneTimeBills = billEntries.filter(item => item.billingFrequency === 'one-time');
  const monthlyBills = billEntries.filter(item => item.billingFrequency === 'monthly');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 text-green-600 mr-2" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Monthly Money Overview</h2>
            <p className="text-sm text-gray-500">Track bills, one-time payments, and monthly outcome</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-900">{formatCurrency(monthSummary.income)}</div>
        </div>

        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-900">{formatCurrency(monthSummary.expenses)}</div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Net</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-900">{formatCurrency(monthSummary.net)}</div>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Bills</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900">{monthSummary.billCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{formatMonthYear(selectedYear, selectedMonth)} breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Salary + Swile</span>
              <span className="font-medium text-gray-900">{formatCurrency(monthSummary.salaryTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bonus / Overtime / Benefits</span>
              <span className="font-medium text-gray-900">{formatCurrency(monthSummary.variableIncomeTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Monthly bills</span>
              <span className="font-medium text-gray-900">{formatCurrency(monthSummary.monthlyBillsTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">One-time payments</span>
              <span className="font-medium text-gray-900">{formatCurrency(monthSummary.oneTimePaymentsTotal)}</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment types</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2"><Repeat className="w-4 h-4 text-gray-500" /> Monthly bills</span>
              <span className="font-medium text-gray-900">{monthlyBills.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-500" /> One-time payments</span>
              <span className="font-medium text-gray-900">{oneTimeBills.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Net outcome</span>
              <span className={`font-medium ${monthSummary.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(monthSummary.net)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Monthly bills</h3>
          {monthlyBills.length === 0 ? (
            <p className="text-sm text-gray-500">No monthly bills for this month.</p>
          ) : (
            <ul className="space-y-2">
              {monthlyBills.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{entry.title || 'Monthly bill'}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(entry.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">One-time payments</h3>
          {oneTimeBills.length === 0 ? (
            <p className="text-sm text-gray-500">No one-time payments for this month.</p>
          ) : (
            <ul className="space-y-2">
              {oneTimeBills.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{entry.title || 'One-time payment'}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(entry.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};