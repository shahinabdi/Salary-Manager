import React, { useState, useMemo } from 'react';
import { YearlyData, SalaryEntry, BillEntry } from '../types';
import { getMonthName, formatCurrency, getEffectiveBillsForMonth } from '../utils/helpers';
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

interface MonthlyOverviewProps {
  allData: YearlyData[];
  selectedYear: number;
}

interface MonthRow {
  month: number;
  salaryNet: number;
  otherIncome: number;
  totalIncome: number;
  billsTotal: number;
  net: number;
  hasSalary: boolean;
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ allData, selectedYear }) => {
  const [collapsed, setCollapsed] = useState(false);

  const allBills = useMemo(
    () => allData.filter((d): d is BillEntry => d.category === 'bill'),
    [allData]
  );

  const rows: MonthRow[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthEntries = allData.filter((d) => d.year === selectedYear && d.month === month);

      const salary = monthEntries.find((d) => d.category === 'salary') as SalaryEntry | undefined;
      const salaryNet = salary?.worked ? (salary.salaryNet ?? 0) : 0;

      const otherIncome = monthEntries
        .filter((d) => ['bonus', 'overtime', 'benefits'].includes(d.category))
        .reduce((s, d) => s + d.amount, 0);

      const totalIncome = salaryNet + otherIncome;

      // Use recurrence: effective bills for this month
      const effectiveBills = getEffectiveBillsForMonth(allBills, selectedYear, month);
      const billsTotal = effectiveBills.reduce((s, b) => s + b.amount, 0);

      return {
        month,
        salaryNet,
        otherIncome,
        totalIncome,
        billsTotal,
        net: totalIncome - billsTotal,
        hasSalary: !!salary,
      };
    });
  }, [allData, selectedYear, allBills]);

  const yearTotals = useMemo(() => ({
    totalIncome: rows.reduce((s, r) => s + r.totalIncome, 0),
    totalBills: rows.reduce((s, r) => s + r.billsTotal, 0),
    totalNet: rows.reduce((s, r) => s + r.net, 0),
  }), [rows]);

  return (
    <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-orange-50 border-b border-gray-200 cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">
            {selectedYear} Monthly Money Overview
          </h2>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label={collapsed ? 'Expand overview' : 'Collapse overview'}
          type="button"
        >
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Salary (Net)</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Other Income</th>
                <th className="px-4 py-3 text-right font-medium text-blue-600 uppercase tracking-wider">Total Income</th>
                <th className="px-4 py-3 text-right font-medium text-orange-600 uppercase tracking-wider">Bills</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">Net</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={row.month}
                  className={`hover:bg-gray-50 transition-colors ${
                    row.month === new Date().getMonth() + 1 &&
                    selectedYear === new Date().getFullYear()
                      ? 'bg-blue-50/40'
                      : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-gray-900">{getMonthName(row.month)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {row.salaryNet > 0 ? formatCurrency(row.salaryNet) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {row.otherIncome > 0 ? formatCurrency(row.otherIncome) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-blue-700">
                    {row.totalIncome > 0 ? formatCurrency(row.totalIncome) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-orange-600">
                    {row.billsTotal > 0 ? formatCurrency(row.billsTotal) : <span className="text-gray-400">—</span>}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${
                      row.net > 0
                        ? 'text-green-700'
                        : row.net < 0
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {row.totalIncome > 0 || row.billsTotal > 0
                      ? formatCurrency(row.net)
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Year totals */}
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td className="px-4 py-3 font-bold text-gray-900">Year Total</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">
                  {formatCurrency(yearTotals.totalIncome)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-orange-600">
                  {formatCurrency(yearTotals.totalBills)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-bold ${
                    yearTotals.totalNet >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(yearTotals.totalNet)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
