import React, { useMemo } from 'react';
import { YearlyData } from '../types';
import { formatCurrency, formatMonthYear, getMonthlyFinancialSummary } from '../utils/helpers';
import { Calendar, TrendingDown, TrendingUp, Wallet, Receipt, Repeat, ArrowRightCircle } from 'lucide-react';

interface MonthlyOverviewProps {
  data: YearlyData[];
  selectedYear: number;
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ data, selectedYear }) => {
  const monthlySummaries = useMemo(
    () => Array.from({ length: 12 }, (_, index) => getMonthlyFinancialSummary(data, selectedYear, index + 1)),
    [data, selectedYear]
  );

  const yearlyTotals = useMemo(
    () => monthlySummaries.reduce(
      (accumulator, summary) => ({
        income: accumulator.income + summary.income,
        expenses: accumulator.expenses + summary.expenses,
        net: accumulator.net + summary.net,
        bills: accumulator.bills + summary.billCount,
      }),
      { income: 0, expenses: 0, net: 0, bills: 0 }
    ),
    [monthlySummaries]
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 text-green-600 mr-2" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Monthly Money Overview</h2>
            <p className="text-sm text-gray-500">Shows every month and carries monthly bills forward until you change them.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">Year Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-900">{formatCurrency(yearlyTotals.income)}</div>
        </div>

        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Year Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-900">{formatCurrency(yearlyTotals.expenses)}</div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Year Net</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-900">{formatCurrency(yearlyTotals.net)}</div>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Months</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900">12</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {monthlySummaries.map((summary) => (
          <div key={`${summary.year}-${summary.month}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{formatMonthYear(summary.year, summary.month)}</h3>
              {summary.net >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="rounded-md bg-emerald-50 p-2">
                <div className="text-emerald-700">Income</div>
                <div className="font-semibold text-emerald-900">{formatCurrency(summary.income)}</div>
              </div>
              <div className="rounded-md bg-red-50 p-2">
                <div className="text-red-700">Expenses</div>
                <div className="font-semibold text-red-900">{formatCurrency(summary.expenses)}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Salary + Swile</span>
                <span className="font-medium text-gray-900">{formatCurrency(summary.salaryTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recurring bills</span>
                <span className="font-medium text-gray-900">{formatCurrency(summary.monthlyBillsTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">One-time bills</span>
                <span className="font-medium text-gray-900">{formatCurrency(summary.oneTimePaymentsTotal)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-600">Net</span>
                <span className={`font-semibold ${summary.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(summary.net)}
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
              <span>{summary.monthlyCount} recurring</span>
              <span>{summary.oneTimeCount} one-time</span>
            </div>

            <div className="mt-3 space-y-1">
              {summary.activeMonthlyBills.slice(0, 2).map((bill) => (
                <div key={bill.id} className="text-xs text-gray-600 flex items-center justify-between">
                  <span className="truncate pr-2">{bill.title}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(bill.amount)}</span>
                </div>
              ))}
              {summary.activeMonthlyBills.length > 2 && (
                <div className="text-xs text-gray-500">+{summary.activeMonthlyBills.length - 2} more recurring bills</div>
              )}
              {summary.oneTimeBills.slice(0, 2).map((bill) => (
                <div key={bill.id} className="text-xs text-gray-600 flex items-center justify-between">
                  <span className="truncate pr-2">{bill.title}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(bill.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Repeat className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Recurring monthly bills</p>
            <p>Monthly expenses repeat across later months until you create a new monthly bill with the same name and amount.</p>
          </div>
        </div>
      </div>
    </div>
  );
};