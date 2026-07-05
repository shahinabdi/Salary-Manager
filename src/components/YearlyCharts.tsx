import React, { useMemo, useState } from 'react';
import type { SalaryEntry, YearlyData } from '../types';
import { formatCurrency } from '../utils/helpers';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

interface YearlyChartsProps {
  data: YearlyData[];
  selectedYear: number;
}

type SeriesKey = 'salary' | 'swile' | 'extras' | 'total';

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
  const [visibleSeriesByYear, setVisibleSeriesByYear] = useState<
    Record<number, Record<SeriesKey, boolean>>
  >({});

  const isSeriesVisible = (year: number, key: SeriesKey) => visibleSeriesByYear[year]?.[key] ?? true;

  const toggleSeries = (year: number, key: SeriesKey) => {
    setVisibleSeriesByYear((prev) => ({
      ...prev,
      [year]: {
        salary: prev[year]?.salary ?? true,
        swile: prev[year]?.swile ?? true,
        extras: prev[year]?.extras ?? true,
        total: prev[year]?.total ?? true,
        [key]: !(prev[year]?.[key] ?? true),
      },
    }));
  };

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
          const salarySeries = yearData.months.map((month) => month.salary);
          const swileSeries = yearData.months.map((month) => month.swile);
          const extrasSeries = yearData.months.map((month) => month.extras);
          const totalSeries = yearData.months.map((month) => month.salary + month.swile + month.extras);

          const seriesConfig: Array<{ key: SeriesKey; label: string; color: string; values: number[] }> = [
            { key: 'salary', label: 'Salary', color: '#0ea5e9', values: salarySeries },
            { key: 'swile', label: 'Swile', color: '#6366f1', values: swileSeries },
            { key: 'extras', label: 'Extras', color: '#10b981', values: extrasSeries },
            { key: 'total', label: 'Total', color: '#0f172a', values: totalSeries },
          ];

          const activeSeries = seriesConfig.filter((series) => isSeriesVisible(yearData.year, series.key));
          const maxChartValue = Math.max(1, ...activeSeries.flatMap((series) => series.values));

          const chartWidth = 860;
          const chartHeight = 250;
          const margin = { top: 16, right: 20, bottom: 34, left: 42 };
          const plotWidth = chartWidth - margin.left - margin.right;
          const plotHeight = chartHeight - margin.top - margin.bottom;
          const stepX = plotWidth / 11;

          const getX = (index: number) => margin.left + stepX * index;
          const getY = (value: number) => margin.top + plotHeight - (value / maxChartValue) * plotHeight;

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
                    <p className="text-sm font-medium text-slate-700 mb-2">Monthly Trend (click legend to hide/show lines)</p>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {seriesConfig.map((series) => {
                        const visible = isSeriesVisible(yearData.year, series.key);
                        return (
                          <button
                            key={series.key}
                            type="button"
                            onClick={() => toggleSeries(yearData.year, series.key)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              visible
                                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: visible ? series.color : '#cbd5e1' }}
                            />
                            {series.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[780px] border border-slate-200 rounded-lg bg-gradient-to-b from-white via-slate-50 to-slate-100 p-2">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56">
                          {Array.from({ length: 5 }, (_, i) => {
                            const y = margin.top + (plotHeight / 4) * i;
                            return (
                              <line
                                key={i}
                                x1={margin.left}
                                y1={y}
                                x2={chartWidth - margin.right}
                                y2={y}
                                stroke="#e2e8f0"
                                strokeDasharray="4 4"
                              />
                            );
                          })}

                          {activeSeries.map((series) => {
                            const points = series.values
                              .map((value, index) => `${getX(index)},${getY(value)}`)
                              .join(' ');

                            return (
                              <g key={series.key}>
                                <polyline
                                  fill="none"
                                  stroke={series.color}
                                  strokeWidth="2.5"
                                  points={points}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {series.values.map((value, index) => (
                                  <circle
                                    key={`${series.key}-${index}`}
                                    cx={getX(index)}
                                    cy={getY(value)}
                                    r="4"
                                    fill={series.color}
                                    stroke="#ffffff"
                                    strokeWidth="1.5"
                                  />
                                ))}
                              </g>
                            );
                          })}

                          {yearData.months.map((month, index) => {
                            const x = getX(index);
                            return (
                              <g key={`x-${month.month}`}>
                                <text x={x} y={chartHeight - 8} textAnchor="middle" fontSize="11" fill="#64748b">
                                  {monthShortName(month.month)}
                                </text>
                                <rect
                                  x={x - stepX / 2}
                                  y={margin.top}
                                  width={stepX}
                                  height={plotHeight}
                                  fill="transparent"
                                  onMouseEnter={() =>
                                    setHoveredMonthByYear((prev) => ({ ...prev, [yearData.year]: month.month }))
                                  }
                                  onMouseLeave={() =>
                                    setHoveredMonthByYear((prev) => ({ ...prev, [yearData.year]: null }))
                                  }
                                />
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-500" />Salary line</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" />Swile line</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />Extras line</span>
                      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-900" />Total line</span>
                    </div>

                    {hoveredData && (
                      <div className="mt-3 text-xs rounded-md bg-slate-100 p-2 text-slate-700 border border-slate-200">
                        {monthShortName(hoveredData.month)}:{' '}
                        {formatCurrency(hoveredData.salary + hoveredData.swile + hoveredData.extras)} total
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
