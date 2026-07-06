import React, { useState, useEffect } from 'react';
import { YearlyData, SalaryEntry, OtherEntry } from '../types';
import { X } from 'lucide-react';

interface DataFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: YearlyData | null;
  selectedYear: number;
  allData: YearlyData[]; // All data to check if salary entry exists for validation
}

export const DataForm: React.FC<DataFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  selectedYear,
  allData
}) => {
  const [formData, setFormData] = useState({
    year: selectedYear,
    month: new Date().getMonth() + 1, // Current month (1-12)
    category: 'salary' as 'salary' | 'bonus' | 'overtime' | 'benefits',
    amount: 0,
    
    // Salary-specific fields
    salaryNet: 0,
    swilePayment: 0,
    transportPaid: false,
    worked: true,
    
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      if (initialData.category === 'salary') {
        setFormData({
          year: initialData.year,
          month: initialData.month,
          salaryNet: initialData.salaryNet,
          swilePayment: initialData.swilePayment,
          transportPaid: initialData.transportPaid,
          worked: initialData.worked,
          category: initialData.category,
          amount: 0,
          notes: initialData.notes || ''
        });
      } else {
        setFormData({
          year: initialData.year,
          month: initialData.month,
          salaryNet: 0,
          swilePayment: 0,
          transportPaid: false,
          worked: false,
          category: initialData.category,
          amount: initialData.amount,
          notes: initialData.notes || ''
        });
      }
    } else {
      setFormData({
        year: selectedYear,
        month: new Date().getMonth() + 1, // Current month (1-12)
        salaryNet: 0,
        swilePayment: 0,
        transportPaid: false,
        worked: true, // Default to worked
        category: 'salary',
        amount: 0,
        notes: ''
      });
    }
    setErrors({});
  }, [initialData, selectedYear, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Please select a valid month';
    }

    if (formData.category === 'salary') {
      if (formData.salaryNet < 0) {
        newErrors.salaryNet = 'Salary cannot be negative';
      }

      if (formData.swilePayment < 0) {
        newErrors.swilePayment = 'Swile payment cannot be negative';
      }
    } else {
      if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }

      // Check if a salary entry exists for this month/year (only for new entries)
      if (!initialData) {
        const existingSalaryEntry = allData.find(entry => 
          entry.category === 'salary' && 
          entry.year === formData.year && 
          entry.month === formData.month
        );
        
        if (!existingSalaryEntry) {
          newErrors.category = 'A salary entry must exist for this month before adding bonus/overtime/benefits entries';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (formData.category === 'salary') {
        const submitData: Omit<SalaryEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          category: 'salary',
          year: formData.year,
          month: formData.month,
          amount: formData.salaryNet, // Amount is same as salaryNet for salary entries
          salaryNet: formData.salaryNet,
          swilePayment: formData.swilePayment,
          transportPaid: formData.transportPaid,
          worked: formData.worked,
          notes: formData.notes
        };
        onSubmit(submitData);
      } else {
        const submitData: Omit<OtherEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          category: formData.category,
          year: formData.year,
          month: formData.month,
          amount: formData.amount,
          notes: formData.notes
        };
        onSubmit(submitData);
      }
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {initialData ? 'Edit Entry' : 'Add New Entry'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                  Month *
                </label>
                <select
                  id="month"
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.month ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month}</p>}
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || selectedYear)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="2000"
                  max="2100"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="salary">Salary</option>
                  <option value="bonus">Bonus</option>
                  <option value="overtime">Overtime</option>
                  <option value="benefits">Benefits</option>
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              {formData.category === 'salary' ? (
                <>
                  <div>
                    <label htmlFor="salaryNet" className={`block text-sm font-medium text-gray-700 mb-1 ${!formData.worked ? 'opacity-50' : ''}`}>
                      Salary (Net) €
                    </label>
                    <input
                      type="number"
                      id="salaryNet"
                      step="0.01"
                      value={formData.salaryNet}
                      onChange={(e) => handleInputChange('salaryNet', parseFloat(e.target.value) || 0)}
                      disabled={!formData.worked}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 ${
                        errors.salaryNet ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.salaryNet && <p className="mt-1 text-sm text-red-600">{errors.salaryNet}</p>}
                  </div>

                  <div>
                    <label htmlFor="swilePayment" className={`block text-sm font-medium text-gray-700 mb-1 ${!formData.worked ? 'opacity-50' : ''}`}>
                      Swile Payment €
                    </label>
                    <input
                      type="number"
                      id="swilePayment"
                      step="0.01"
                      value={formData.swilePayment}
                      onChange={(e) => handleInputChange('swilePayment', parseFloat(e.target.value) || 0)}
                      disabled={!formData.worked}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 ${
                        errors.swilePayment ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.swilePayment && <p className="mt-1 text-sm text-red-600">{errors.swilePayment}</p>}
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount €
                  </label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>
              )}

            {formData.category === 'salary' && (
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="worked"
                    checked={formData.worked}
                    onChange={(e) => handleInputChange('worked', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="worked" className="ml-2 block text-sm font-medium text-gray-700">
                    I worked this month
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="transportPaid"
                    checked={formData.transportPaid}
                    onChange={(e) => handleInputChange('transportPaid', e.target.checked)}
                    disabled={!formData.worked}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label htmlFor="transportPaid" className={`ml-2 block text-sm text-gray-700 ${!formData.worked ? 'opacity-50' : ''}`}>
                    Transport Paid
                  </label>
                </div>
              </div>
            )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {initialData ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};