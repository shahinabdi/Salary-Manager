import React, { useMemo, useState } from 'react';
import type { SalaryEntry, YearlyData } from '../types';
import { formatCurrency } from '../utils/helpers';
import { BarChart3, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

interface YearlyChartsProps {
  data: YearlyData[];
  selectedYear: number;
}

interface MonthAggregate {
  month: number;
  salary: number;
  swile: number;
  extras: number;
  worked: boolean;
}

interface YearAggregate {
  year: number;
  months: MonthAggregate[];
  totalSalary: number;
  totalSwile: number;
  totalExtras: number;
  totalAll: number;
  workedMonths: number;
}

function monthShortName(month: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2020, month - 1, 1));
}

function buildYearAggregates(entries: YearlyData[]): YearAggregate[] {
  const byYear = new Map<number, MonthAggregate[]>();

  for (const entry of entries) {
    if (!byYear.has(entry.year)) {
      byYear.set(
        entry.year,
        Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          salary: 0,
          swile: 0,
          extras: 0,
          worked: false,
        }))
      );
    }

    const months = byYear.get(entry.year)!;
    const slot = months[entry.month - 1];

    if (entry.category === 'salary') {
      const salaryEntry = entry as SalaryEntry;
      slot.salary += salaryEntry.salaryNet;
      slot.swile += salaryEntry.swilePayment;
      slot.worked = slot.worked || salaryEntry.worked;
    } else {
      slot.extras += entry.amount;
    }
  }

  return Array.from(byYear.entries())
    .map(([year, months]) => {
      const totalSalary = months.reduce((sum, month) => sum + month.salary, 0);
      const totalSwile = months.reduce((sum, month) => sum + month.swile, 0);
      const totalExtras = months.reduce((sum, month) => sum + month.extras, 0);
      const workedMonths = months.filter((month) => month.worked).length;

      return {
        year,
        months,
        totalSalary,
        totalSwile,
        totalExtras,
        totalAll: totalSalary + totalSwile + totalExtras,
        workedMonths,
      };
    })
    .sort((a, b) => b.year - a.year);
}

export const YearlyCharts: React.FC<YearlyChartsProps> = ({ data, selectedYear }) => {
  const yearly = useMemo(() => buildYearAggregates(data), [data]);
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({ [selectedYear]: true });
  const [hoveredMonthByYear, setHoveredMonthByYear] = useState<Record<number, number | null>>({});

  const toggleYear = (year: number) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  if (yearly.length === 0) {
    return (
      <div className="mb-6 bg-white rounded-lg shadow p-5">
        <div className="flex items-center gap-2 text-gray-700">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Yearly Graphs</h3>
        </div>
        <p className="text-sm text-gray-500 mt-3">No data available yet to render graphs.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-5">
      <div className="flex items-center gap-2 text-gray-700 mb-4">
        <BarChart3 className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Interactive Yearly Graphs</h3>
      </div>

      <div className="space-y-4">
        {yearly.map((yearData) => {
          const isOpen = openYears[yearData.year] ?? yearData.year === selectedYear;
          const maxMonthlyValue = Math.max(
            1,
            ...yearData.months.map((month) => month.salary + month.swile + month.extras)
          );

          const hoveredMonth = hoveredMonthByYear[yearData.year];
          const hoveredData =
            hoveredMonth != null ? yearData.months.find((month) => month.month === hoveredMonth) : null;

          const cumulativeSeries = yearData.months.reduce<number[]>((acc, month, index) => {
            const prev = index === 0 ? 0 : acc[index - 1];
            acc.push(prev + month.salary + month.swile + month.extras);
            return acc;
          }, []);

          const maxCumulative = Math.max(1, ...cumulativeSeries);

          return (
            <div key={yearData.year} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleYear(yearData.year)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{yearData.year}</p>
                  <p className="text-xs text-gray-500">
                    Total: {formatCurrency(yearData.totalAll)} • Worked months: {yearData.workedMonths}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>

              {isOpen && (
                <div className="p-4 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-md bg-blue-50 p-3">
                      <p className="text-blue-700 text-xs">Salary</p>
                      <p className="font-semibold text-blue-900">{formatCurrency(yearData.totalSalary)}</p>
                    </div>
                    <div className="rounded-md bg-indigo-50 p-3">
                      <p className="text-indigo-700 text-xs">Swile</p>
                      <p className="font-semibold text-indigo-900">{formatCurrency(yearData.totalSwile)}</p>
                    </div>
                    <div className="rounded-md bg-emerald-50 p-3">
                      <p className="text-emerald-700 text-xs">Bonus/Overtime/Benefits</p>
                      <p className="font-semibold text-emerald-900">{formatCurrency(yearData.totalExtras)}</p>
                    </div>
                    <div className="rounded-md bg-gray-100 p-3">
                      <p className="text-gray-700 text-xs">Grand total</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(yearData.totalAll)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Monthly Composition (hover bars)</p>
                    <div className="overflow-x-auto">
                      <div className="min-w-[780px] h-52 flex items-end gap-2 p-2 border rounded-md bg-gradient-to-b from-white to-gray-50">
                        {yearData.months.map((month) => {
                          const salaryHeight = (month.salary / maxMonthlyValue) * 170;
                          const swileHeight = (month.swile / maxMonthlyValue) * 170;
                          const extrasHeight = (month.extras / maxMonthlyValue) * 170;

                          return (
                            <div
                              key={month.month}
                              className="flex-1 min-w-[52px]"
                              onMouseEnter={() =>
                                setHoveredMonthByYear((prev) => ({ ...prev, [yearData.year]: month.month }))
                              }
                              onMouseLeave={() =>
                                setHoveredMonthByYear((prev) => ({ ...prev, [yearData.year]: null }))
                              }
                            >
                              <div className="h-44 flex items-end justify-center gap-1">
                                <div
                                  className="w-3 bg-blue-500 rounded-t transition-all"
                                  style={{ height: `${salaryHeight}px` }}
                                  title={`${monthShortName(month.month)} Salary: ${formatCurrency(month.salary)}`}
                                />
                                <div
                                  className="w-3 bg-indigo-500 rounded-t transition-all"
                                  style={{ height: `${swileHeight}px` }}
                                  title={`${monthShortName(month.month)} Swile: ${formatCurrency(month.swile)}`}
                                />
                                <div
                                  className="w-3 bg-emerald-500 rounded-t transition-all"
                                  style={{ height: `${extrasHeight}px` }}
                                  title={`${monthShortName(month.month)} Extras: ${formatCurrency(month.extras)}`}
                                />
                              </div>
                              <p className="text-[11px] text-center text-gray-600 mt-1">{monthShortName(month.month)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" />Salary</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" />Swile</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />Extras</span>
                    </div>

                    {hoveredData && (
                      <div className="mt-3 text-xs rounded-md bg-gray-100 p-2 text-gray-700">
                        {monthShortName(hoveredData.month)}: {formatCurrency(hoveredData.salary + hoveredData.swile + hoveredData.extras)}
                        {' '}({formatCurrency(hoveredData.salary)} salary, {formatCurrency(hoveredData.swile)} swile, {formatCurrency(hoveredData.extras)} extras)
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Cumulative Income Trend</p>
                    <div className="overflow-x-auto border rounded-md bg-white p-2">
                      <svg viewBox="0 0 840 200" className="w-full min-w-[780px] h-52">
                        <line x1="30" y1="10" x2="30" y2="170" stroke="#d1d5db" />
                        <line x1="30" y1="170" x2="810" y2="170" stroke="#d1d5db" />

                        {cumulativeSeries.map((value, index) => {
                          const x = 30 + index * 70;
                          const y = 170 - (value / maxCumulative) * 150;
                          return (
                            <g key={index}>
                              <circle cx={x} cy={y} r="4" fill="#2563eb" />
                              <text x={x} y="188" textAnchor="middle" fontSize="11" fill="#6b7280">
                                {monthShortName(index + 1)}
                              </text>
                            </g>
                          );
                        })}

                        <polyline
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2"
                          points={cumulativeSeries
                            .map((value, index) => {
                              const x = 30 + index * 70;
                              const y = 170 - (value / maxCumulative) * 150;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      </svg>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Running total across months for {yearData.year}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
