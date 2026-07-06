import React from 'react';
import { BillEntry } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Edit, Trash2, RefreshCw, Zap } from 'lucide-react';

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
