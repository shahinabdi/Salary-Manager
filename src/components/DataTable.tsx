import React, { useState } from 'react';
import { YearlyData, SalaryEntry } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface DataTableProps {
  data: YearlyData[];
  onEdit: (item: YearlyData) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  onEdit,
  onDelete,
  loading = false
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(data.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      salary: 'bg-blue-100 text-blue-800',
      bonus: 'bg-green-100 text-green-800',
      overtime: 'bg-yellow-100 text-yellow-800',
      benefits: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {category}
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
              {[...Array(5)].map((_, i) => (
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
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data entries</h3>
          <p className="text-gray-500">Get started by adding your first salary entry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.size === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Salary (Net)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Swile Payment</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transport Payment</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Transport Paid</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(item.year, item.month)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getCategoryBadge(item.category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {item.category === 'salary' ? formatCurrency((item as SalaryEntry).salaryNet) : formatCurrency(item.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.category === 'salary' ? formatCurrency((item as SalaryEntry).swilePayment) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {item.category === 'salary' ? formatCurrency((item as SalaryEntry).transportPayment) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {item.category === 'salary' ? (
                    (item as SalaryEntry).transportPaid ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                    )
                  ) : '-'}
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
        {data.map((item) => (
          <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{formatDate(item.year, item.month)}</span>
                  {getCategoryBadge(item.category)}
                </div>
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
                <span className="text-gray-500">
                  {item.category === 'salary' ? 'Salary (Net):' : 'Amount:'}
                </span>
                <span className="ml-1 font-medium">
                  {item.category === 'salary' ? formatCurrency((item as SalaryEntry).salaryNet) : formatCurrency(item.amount)}
                </span>
              </div>
              {item.category === 'salary' && (
                <>
                  <div>
                    <span className="text-gray-500">Swile:</span>
                    <span className="ml-1">{formatCurrency((item as SalaryEntry).swilePayment)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Transport:</span>
                    <span className="ml-1">{formatCurrency((item as SalaryEntry).transportPayment)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">Paid:</span>
                    <span className="ml-2">
                      {(item as SalaryEntry).transportPaid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </span>
                  </div>
                </>
              )}
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