import React, { useState, useMemo } from 'react';
import { BillEntry } from '../types';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { Edit, Trash2, RefreshCw, Zap, ChevronDown, ChevronRight } from 'lucide-react';

interface BillsTableProps {
  data: BillEntry[];
  onEdit: (item: BillEntry) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const BillsTable: React.FC<BillsTableProps> = ({
  data,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const currentMonth = new Date().getMonth() + 1;

  // Group bills by month, only months that have bills
  const monthGroups = useMemo(() => {
    const groups = new Map<number, BillEntry[]>();
    for (const bill of data) {
      const list = groups.get(bill.month) ?? [];
      list.push(bill);
      groups.set(bill.month, list);
    }
    // Sort bills within each month by title
    groups.forEach((bills) => bills.sort((a, b) => a.title.localeCompare(b.title)));
    // Return sorted months descending
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [data]);

  // Default open: current month if it has bills, otherwise first month with bills
  const defaultOpen = useMemo(() => {
    if (monthGroups.some(([m]) => m === currentMonth)) return currentMonth;
    return monthGroups[0]?.[0] ?? null;
  }, [monthGroups, currentMonth]);

  const [openMonths, setOpenMonths] = useState<Set<number>>(() =>
    defaultOpen !== null ? new Set([defaultOpen]) : new Set()
  );

  const toggle = (month: number) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  const getFrequencyBadge = (freq: 'monthly' | 'one-time') => {
    if (freq === 'monthly') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          <RefreshCw size={10} />
          Monthly
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
        <Zap size={10} />
        One-time
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bills or expenses</h3>
          <p className="text-gray-500">Add a bill/expense using the "Add Expense" button above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow overflow-hidden divide-y divide-gray-200">
      {monthGroups.map(([month, bills]) => {
        const isOpen = openMonths.has(month);
        const total = bills.reduce((s, b) => s + b.amount, 0);
        const isCurrentMonth = month === currentMonth;

        return (
          <div key={month} className="bg-white">
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => toggle(month)}
              className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors duration-150 ${
                isOpen
                  ? 'bg-orange-50 border-l-4 border-orange-400'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown size={16} className="text-orange-500 flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                )}
                <span className={`font-semibold text-sm ${isOpen ? 'text-orange-800' : 'text-gray-800'}`}>
                  {getMonthName(month)}
                  {isCurrentMonth && (
                    <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">{bills.length} bill{bills.length !== 1 ? 's' : ''}</span>
              </div>
              <span className={`text-sm font-bold ${isOpen ? 'text-orange-700' : 'text-gray-600'}`}>
                {formatCurrency(total)}
              </span>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="border-t border-orange-100">
                {/* Desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-orange-50/50">
                      <tr>
                        <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Title</th>
                        <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                        <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">{bill.title}</td>
                          <td className="px-5 py-3">{getFrequencyBadge(bill.billingFrequency)}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-orange-700 text-right">{formatCurrency(bill.amount)}</td>
                          <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">{bill.notes || '—'}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => onEdit(bill)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => onDelete(bill.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {bills.map((bill) => (
                    <div key={bill.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{bill.title}</p>
                        <div className="mt-0.5">{getFrequencyBadge(bill.billingFrequency)}</div>
                        {bill.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{bill.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-orange-700">{formatCurrency(bill.amount)}</span>
                        <button onClick={() => onEdit(bill)} className="text-blue-600 p-1 rounded hover:bg-blue-50">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => onDelete(bill.id)} className="text-red-600 p-1 rounded hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
    if (freq === 'monthly') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          <RefreshCw size={10} />
          Monthly
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
        <Zap size={10} />
        One-time
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bills or expenses</h3>
          <p className="text-gray-500">Add a bill/expense using the "Add Expense" button above.</p>
        </div>
      </div>
    );
  }

  // Sort: by year desc, month desc, then title asc
  const sorted = [...data].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((item) => (
              <tr key={item.id} className="hover:bg-orange-50/30 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(item.year, item.month)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getFrequencyBadge(item.billingFrequency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-700 text-right">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.notes || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {sorted.map((item) => (
          <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{formatDate(item.year, item.month)}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(item)} className="text-blue-600 p-1 rounded hover:bg-blue-50">
                  <Edit size={16} />
                </button>
                <button onClick={() => onDelete(item.id)} className="text-red-600 p-1 rounded hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              {getFrequencyBadge(item.billingFrequency)}
              <span className="text-sm font-semibold text-orange-700">{formatCurrency(item.amount)}</span>
            </div>
            {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
