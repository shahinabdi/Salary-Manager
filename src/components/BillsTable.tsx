import React from 'react';
import { BillEntry } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Edit, Trash2, ArrowRightCircle } from 'lucide-react';

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
  const getFrequencyBadge = (frequency: BillEntry['billingFrequency']) => {
    const styles = {
      monthly: 'bg-emerald-100 text-emerald-800',
      'one-time': 'bg-amber-100 text-amber-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[frequency]}`}>
        {frequency === 'monthly' ? 'Monthly' : 'One-time'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowRightCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bill entries</h3>
          <p className="text-gray-500">Add monthly bills and one-time payments here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.year, item.month)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getFrequencyBadge(item.billingFrequency)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.notes || '—'}</td>
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

      <div className="lg:hidden">
        {data.map((item) => (
          <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{formatDate(item.year, item.month)}</span>
                  {getFrequencyBadge(item.billingFrequency)}
                </div>
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Amount:</span>
                <span className="ml-1 font-medium">{formatCurrency(item.amount)}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-1">{item.billingFrequency}</span>
              </div>
            </div>

            {item.notes && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};