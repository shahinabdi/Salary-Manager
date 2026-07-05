import React, { useMemo, useState } from 'react';
import type { SalaryEntry, YearlyData } from '../types';
import { formatCurrency } from '../utils/helpers';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

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
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 text-slate-700">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Yearly Graphs</h3>
        </div>
        <p className="text-sm text-slate-500 mt-3">No data available yet to render graphs.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="mb-4 rounded-xl bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 border border-sky-100 px-4 py-3">
        <div className="flex items-center gap-2 text-slate-700">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Interactive Yearly Graphs</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">Hover monthly bars to inspect details. Open any year to focus its breakdown.</p>
      </div>

      <div className="space-y-4">
        {yearly.map((yearData) => {
          const isOpen = openYears[yearData.year] ?? yearData.year === selectedYear;
          const maxMonthlyValue = Math.max(
            1,
            ...yearData.months.map((month) => month.salary + month.swile + month.extras)
          );

          const salaryShare = yearData.totalAll > 0 ? (yearData.totalSalary / yearData.totalAll) * 100 : 0;
          const swileShare = yearData.totalAll > 0 ? (yearData.totalSwile / yearData.totalAll) * 100 : 0;
          const extrasShare = yearData.totalAll > 0 ? (yearData.totalExtras / yearData.totalAll) * 100 : 0;

          const hoveredMonth = hoveredMonthByYear[yearData.year];
          const hoveredData =
            hoveredMonth != null ? yearData.months.find((month) => month.month === hoveredMonth) : null;

          return (
            <div key={yearData.year} className="overflow-hidden rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => toggleYear(yearData.year)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-semibold text-slate-900">{yearData.year}</p>
                  <p className="text-xs text-slate-500">
                    Total: {formatCurrency(yearData.totalAll)} • Worked months: {yearData.workedMonths}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>

              {isOpen && (
                <div className="p-4 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-sky-50 border border-sky-100 p-3">
                      <p className="text-sky-700 text-xs">Salary</p>
                      <p className="font-semibold text-sky-900">{formatCurrency(yearData.totalSalary)}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                      <p className="text-indigo-700 text-xs">Swile</p>
                      <p className="font-semibold text-indigo-900">{formatCurrency(yearData.totalSwile)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                      <p className="text-emerald-700 text-xs">Bonus/Overtime/Benefits</p>
                      <p className="font-semibold text-emerald-900">{formatCurrency(yearData.totalExtras)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
                      <p className="text-slate-700 text-xs">Grand total</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(yearData.totalAll)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Income Mix</p>
                    <div className="h-3 w-full rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex">
                      <div className="bg-sky-500" style={{ width: `${salaryShare}%` }} />
                      <div className="bg-indigo-500" style={{ width: `${swileShare}%` }} />
                      <div className="bg-emerald-500" style={{ width: `${extrasShare}%` }} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-500" />Salary {Math.round(salaryShare)}%</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" />Swile {Math.round(swileShare)}%</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />Extras {Math.round(extrasShare)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Monthly Composition (hover bars)</p>
                    <div className="overflow-x-auto">
                      <div className="min-w-[780px] h-56 flex items-end gap-2 p-3 border border-slate-200 rounded-lg bg-gradient-to-b from-white via-slate-50 to-slate-100">
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
                              <div className="h-44 flex items-end justify-center gap-1.5">
                                <div
                                  className="w-3 bg-sky-500 rounded-t transition-all duration-200"
                                  style={{ height: `${salaryHeight}px` }}
                                  title={`${monthShortName(month.month)} Salary: ${formatCurrency(month.salary)}`}
                                />
                                <div
                                  className="w-3 bg-indigo-500 rounded-t transition-all duration-200"
                                  style={{ height: `${swileHeight}px` }}
                                  title={`${monthShortName(month.month)} Swile: ${formatCurrency(month.swile)}`}
                                />
                                <div
                                  className="w-3 bg-emerald-500 rounded-t transition-all duration-200"
                                  style={{ height: `${extrasHeight}px` }}
                                  title={`${monthShortName(month.month)} Extras: ${formatCurrency(month.extras)}`}
                                />
                              </div>
                              <p className="text-[11px] text-center text-slate-600 mt-1">{monthShortName(month.month)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-500" />Salary</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" />Swile</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />Extras</span>
                    </div>

                    {hoveredData && (
                      <div className="mt-3 text-xs rounded-md bg-slate-100 p-2 text-slate-700 border border-slate-200">
                        {monthShortName(hoveredData.month)}: {formatCurrency(hoveredData.salary + hoveredData.swile + hoveredData.extras)}
                        {' '}({formatCurrency(hoveredData.salary)} salary, {formatCurrency(hoveredData.swile)} swile, {formatCurrency(hoveredData.extras)} extras)
                      </div>
                    )}
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
