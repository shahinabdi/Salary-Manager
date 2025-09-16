import React from 'react';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { YearlyData, SalaryEntry, OtherEntry } from '../types';

interface PrintViewProps {
  data: YearlyData[];
  selectedYear: number;
  statistics: {
    totalEntries: number;
    workedMonths: number;
    notWorkedMonths: number;
    totalSalary: number;
    totalSwilePayments: number;
    averageSalary: number;
    paidTransportCount: number;
    unpaidTransportCount: number;
  };
}

export const PrintView: React.FC<PrintViewProps> = ({ data, selectedYear, statistics }) => {
  // Group data by month for better presentation
  const monthlyData = React.useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(month => ({
      month,
      entries: data.filter(item => item.month === month)
    }));
  }, [data]);

  const salaryEntries = data.filter(item => item.category === 'salary') as SalaryEntry[];
  const otherEntries = data.filter(item => item.category !== 'salary') as OtherEntry[];

  // Calculate additional statistics for print
  const totalCompensation = statistics.totalSalary + statistics.totalSwilePayments;
  const otherPayments = otherEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const grandTotal = totalCompensation + otherPayments;

  // Monthly breakdown for worked months
  const workedMonthsDetail = salaryEntries
    .filter(entry => entry.worked)
    .sort((a, b) => a.month - b.month);

  // Category breakdown for other entries
  const otherCategoriesBreakdown = otherEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="print-view min-h-screen bg-white p-8 text-black" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
      <style>{`
        @media print {
          .print-view {
            padding: 0;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          .avoid-break {
            page-break-inside: avoid;
          }
        }
        @page {
          margin: 1in;
        }
        /* Image generation styles */
        .print-view * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      `}</style>

      {/* Header Section */}
      <div className="text-center border-b-4 border-gray-800 pb-6 mb-8 avoid-break">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          📊 SALARY MANAGEMENT REPORT
        </h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-1">
          Year {selectedYear}
        </h2>
        <p className="text-gray-500">
          Generated on {new Date().toLocaleDateString()} • Total Entries: {statistics.totalEntries}
        </p>
        <div className="mt-4 flex justify-center items-center space-x-4 text-sm">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
            ✅ {statistics.workedMonths} Worked Months
          </span>
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
            ❌ {statistics.notWorkedMonths} Not Worked
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-8 avoid-break">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
          💰 EXECUTIVE SUMMARY
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <div className="text-2xl font-bold text-green-700">{formatCurrency(statistics.totalSalary)}</div>
            <div className="text-sm text-green-600">Net Salary</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{formatCurrency(statistics.totalSwilePayments)}</div>
            <div className="text-sm text-purple-600">Swile Payments</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{formatCurrency(grandTotal)}</div>
            <div className="text-sm text-blue-600">Grand Total</div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="mb-8 avoid-break">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-green-500 pl-3">
          📈 KEY PERFORMANCE INDICATORS
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(statistics.averageSalary)}</div>
            <div className="text-sm text-gray-600">Average Salary<br/>(Worked Months Only)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {statistics.workedMonths > 0 
                ? `${Math.round((statistics.paidTransportCount / statistics.workedMonths) * 100)}%`
                : '0%'
              }
            </div>
            <div className="text-sm text-gray-600">Transport<br/>Coverage Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {statistics.workedMonths > 0 
                ? formatCurrency((statistics.totalSalary + statistics.totalSwilePayments) / statistics.workedMonths)
                : formatCurrency(0)
              }
            </div>
            <div className="text-sm text-gray-600">Average Total<br/>per Worked Month</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown - Only Worked Months */}
      {workedMonthsDetail.length > 0 && (
        <div className="mb-8 page-break">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-indigo-500 pl-3">
            📅 MONTHLY BREAKDOWN - WORKED MONTHS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Month</th>
                  <th className="border border-gray-300 p-2 text-right">Net Salary</th>
                  <th className="border border-gray-300 p-2 text-right">Swile</th>
                  <th className="border border-gray-300 p-2 text-center">Transport Provided</th>
                  <th className="border border-gray-300 p-2 text-right">Monthly Total</th>
                </tr>
              </thead>
              <tbody>
                {workedMonthsDetail.map((entry) => {
                  const monthlyTotal = entry.salaryNet + entry.swilePayment;
                  return (
                    <tr key={entry.id}>
                      <td className="border border-gray-300 p-2 font-medium">
                        {getMonthName(entry.month)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right font-medium">
                        {formatCurrency(entry.salaryNet)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formatCurrency(entry.swilePayment)}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {entry.transportPaid ? '✅' : '❌'}
                      </td>
                      <td className="border border-gray-300 p-2 text-right font-bold bg-blue-50">
                        {formatCurrency(monthlyTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td className="border border-gray-300 p-2">TOTAL</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(statistics.totalSalary)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(statistics.totalSwilePayments)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {statistics.paidTransportCount}/{statistics.workedMonths}
                  </td>
                  <td className="border border-gray-300 p-2 text-right bg-blue-100">
                    {formatCurrency(totalCompensation)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Other Categories Breakdown */}
      {Object.keys(otherCategoriesBreakdown).length > 0 && (
        <div className="mb-8 avoid-break">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">
            🎯 OTHER CATEGORIES BREAKDOWN
          </h3>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(otherCategoriesBreakdown).map(([category, amount]) => (
                <div key={category} className="text-center bg-white p-3 rounded border">
                  <div className="text-lg font-bold text-orange-700">{formatCurrency(amount)}</div>
                  <div className="text-sm text-orange-600 capitalize">{category}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-orange-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-800">
                  {formatCurrency(otherPayments)}
                </div>
                <div className="text-sm text-orange-600">Total Other Payments</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Year Overview Calendar */}
      <div className="mb-8 page-break">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-red-500 pl-3">
          📆 YEAR OVERVIEW CALENDAR
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {monthlyData.map(({ month, entries }) => {
            const salaryEntry = entries.find(e => e.category === 'salary') as SalaryEntry | undefined;
            const hasOtherEntries = entries.some(e => e.category !== 'salary');
            
            let status = 'no-data';
            let bgColor = 'bg-gray-100 text-gray-500';
            
            if (salaryEntry) {
              if (salaryEntry.worked) {
                status = 'worked';
                bgColor = 'bg-green-100 text-green-800 border-green-300';
              } else {
                status = 'not-worked';
                bgColor = 'bg-red-100 text-red-800 border-red-300';
              }
            }
            
            return (
              <div key={month} className={`p-3 rounded-lg border-2 text-center ${bgColor}`}>
                <div className="font-bold text-lg">{getMonthName(month)}</div>
                <div className="text-xs mt-1">
                  {status === 'worked' && '✅ Worked'}
                  {status === 'not-worked' && '❌ Not Worked'}
                  {status === 'no-data' && '📝 No Data'}
                </div>
                {hasOtherEntries && (
                  <div className="text-xs mt-1 text-blue-600">🎯 +Other</div>
                )}
                {salaryEntry && (
                  <div className="text-xs mt-1 font-medium">
                    {formatCurrency(salaryEntry.salaryNet)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with Summary */}
      <div className="mt-8 pt-6 border-t-4 border-gray-800 text-center avoid-break">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            🎉 YEAR {selectedYear} FINANCIAL SUMMARY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(grandTotal)}</div>
              <div className="text-blue-600">Total Income</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-700">{statistics.workedMonths}/12</div>
              <div className="text-green-600">Months Worked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-700">
                {statistics.workedMonths > 0 
                  ? formatCurrency(grandTotal / statistics.workedMonths)
                  : formatCurrency(0)
                }
              </div>
              <div className="text-purple-600">Average per Worked Month</div>
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p>This report includes all salary payments, Swile benefits, transport reimbursements, and additional category payments for the year {selectedYear}.</p>
            <p className="mt-2">Generated by Salary Management System • {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};