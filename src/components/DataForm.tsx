import React, { useState, useEffect } from 'react';
import { YearlyData, SalaryEntry, OtherEntry, BillEntry } from '../types';
import { X } from 'lucide-react';

interface DataFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'> | Array<Omit<BillEntry, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  initialData?: YearlyData | null;
  selectedYear: number;
  allData: YearlyData[]; // All data to check if salary entry exists for validation
  defaultBillMode?: boolean; // Open form directly in bill mode
}

export const DataForm: React.FC<DataFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  selectedYear,
  allData,
  defaultBillMode = false,
}) => {
  const [formData, setFormData] = useState({
    year: selectedYear,
    month: new Date().getMonth() + 1,
    category: (defaultBillMode ? 'bill' : 'salary') as 'salary' | 'bonus' | 'overtime' | 'benefits' | 'bill',
    amount: 0,

    // Salary-specific fields
    salaryNet: 0,
    swilePayment: 0,
    transportPaid: false,
    worked: true,

    // Bill-specific fields
    title: '',
    billingFrequency: 'monthly' as 'monthly' | 'one-time',
    repeatMode: 'none' as 'none' | 'full_year' | 'until_end' | 'until_specific',
    repeatUntilMonth: 12,
    repeatUntilYear: selectedYear,

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
          title: '',
          billingFrequency: 'monthly',
          repeatMode: 'none' as const,
          repeatUntilMonth: 12,
          repeatUntilYear: selectedYear,
          notes: initialData.notes || '',
        });
      } else if (initialData.category === 'bill') {
        setFormData({
          year: initialData.year,
          month: initialData.month,
          salaryNet: 0,
          swilePayment: 0,
          transportPaid: false,
          worked: false,
          category: 'bill',
          amount: initialData.amount,
          title: initialData.title,
          billingFrequency: initialData.billingFrequency,
          repeatMode: 'none' as const,
          repeatUntilMonth: 12,
          repeatUntilYear: initialData.year,
          notes: initialData.notes || '',
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
          title: '',
          billingFrequency: 'monthly',
          repeatMode: 'none' as const,
          repeatUntilMonth: 12,
          repeatUntilYear: selectedYear,
          notes: initialData.notes || '',
        });
      }
    } else {
      setFormData({
        year: selectedYear,
        month: new Date().getMonth() + 1,
        salaryNet: 0,
        swilePayment: 0,
        transportPaid: false,
        worked: true,
        category: defaultBillMode ? 'bill' : 'salary',
        amount: 0,
        title: '',
        billingFrequency: 'monthly',
        repeatMode: 'none' as const,
        repeatUntilMonth: 12,
        repeatUntilYear: selectedYear,
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, selectedYear, isOpen, defaultBillMode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Please select a valid month';
    }

    if (formData.category === 'bill') {
      if (!formData.title.trim()) {
        newErrors.title = 'Bill title is required';
      }
      if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
      // Duplicate check for monthly bills (only new entries, not edit)
      if (!initialData && formData.billingFrequency === 'monthly') {
        const billsData = allData.filter(
          (d) =>
            d.category === 'bill' &&
            (d as BillEntry).title.toLowerCase() === formData.title.toLowerCase() &&
            d.year === formData.year &&
            d.month === formData.month
        );
        if (billsData.length > 0) {
          newErrors.title = `A bill named "${formData.title}" already exists for this month/year.`;
        }
      }
    } else if (formData.category === 'salary') {
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
      if (!initialData) {
        const existingSalaryEntry = allData.find(
          (entry) =>
            entry.category === 'salary' &&
            entry.year === formData.year &&
            entry.month === formData.month
        );
        if (!existingSalaryEntry) {
          newErrors.category =
            'A salary entry must exist for this month before adding bonus/overtime/benefits entries';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (formData.category === 'bill') {
        const base: Omit<BillEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          category: 'bill',
          year: formData.year,
          month: formData.month,
          amount: formData.amount,
          title: formData.title.trim(),
          billingFrequency: formData.repeatMode !== 'none' ? 'monthly' : 'one-time',
          repeatAllYear: formData.repeatMode !== 'none',
          notes: formData.notes,
        };

        if (!initialData && formData.repeatMode !== 'none') {
          // Build list of { month, year } slots to create
          const slots: Array<{ month: number; year: number }> = [];

          if (formData.repeatMode === 'full_year') {
            for (let m = 1; m <= 12; m++) {
              slots.push({ month: m, year: formData.year });
            }
          } else if (formData.repeatMode === 'until_end') {
            for (let m = formData.month; m <= 12; m++) {
              slots.push({ month: m, year: formData.year });
            }
          } else if (formData.repeatMode === 'until_specific') {
            let m = formData.month;
            let y = formData.year;
            const endM = formData.repeatUntilMonth;
            const endY = formData.repeatUntilYear;
            while (y < endY || (y === endY && m <= endM)) {
              slots.push({ month: m, year: y });
              m++;
              if (m > 12) { m = 1; y++; }
            }
          }

          const expanded: Array<Omit<BillEntry, 'id' | 'createdAt' | 'updatedAt'>> =
            slots.map((s) => ({ ...base, month: s.month, year: s.year }));
          onSubmit(expanded.length > 0 ? expanded : base);
        } else {
          onSubmit(base);
        }
      } else if (formData.category === 'salary') {
        const submitData: Omit<SalaryEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          category: 'salary',
          year: formData.year,
          month: formData.month,
          amount: formData.salaryNet,
          salaryNet: formData.salaryNet,
          swilePayment: formData.swilePayment,
          transportPaid: formData.transportPaid,
          worked: formData.worked,
          notes: formData.notes,
        };
        onSubmit(submitData);
      } else {
        const submitData: Omit<OtherEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          category: formData.category,
          year: formData.year,
          month: formData.month,
          amount: formData.amount,
          notes: formData.notes,
        };
        onSubmit(submitData);
      }
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  const isBill = formData.category === 'bill';
  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {isEditing
                ? isBill
                  ? 'Edit Bill/Expense'
                  : 'Edit Entry'
                : isBill
                ? 'Add Bill/Expense'
                : 'Add New Entry'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Month */}
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
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month}</p>}
              </div>

              {/* Year */}
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

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={isEditing}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="salary">Salary</option>
                  <option value="bonus">Bonus</option>
                  <option value="overtime">Overtime</option>
                  <option value="benefits">Benefits</option>
                  <option value="bill">Bill / Expense</option>
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              {/* Bill-specific: Title */}
              {isBill && (
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. Netflix, Rent, Electricity"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>
              )}

              {/* Amount (bills and other non-salary) */}
              {(isBill || (formData.category !== 'salary')) && (
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

              {/* Salary-specific fields */}
              {formData.category === 'salary' && (
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
              )}

              {/* Salary checkboxes */}
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

            {/* Bill options row */}
            {isBill && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* For editing: keep the frequency dropdown visible */}
                {isEditing && (
                  <div>
                    <label htmlFor="billingFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Frequency
                    </label>
                    <select
                      id="billingFrequency"
                      value={formData.billingFrequency}
                      onChange={(e) => handleInputChange('billingFrequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                )}

                {!isEditing && (
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat</label>
                    <div className="flex flex-col gap-2">
                      {([
                        { value: 'none',           label: 'Just this month' },
                        { value: 'full_year',      label: `All 12 months of ${formData.year}` },
                        { value: 'until_end',      label: `Until end of ${formData.year} (${12 - formData.month + 1} months)` },
                        { value: 'until_specific', label: 'Until a specific month…' },
                      ] as const).map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="repeatMode"
                            value={value}
                            checked={formData.repeatMode === value}
                            onChange={() => handleInputChange('repeatMode', value)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    {formData.repeatMode === 'until_specific' && (
                      <div className="mt-3 flex items-center gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Until month</label>
                          <select
                            value={formData.repeatUntilMonth}
                            onChange={(e) => handleInputChange('repeatUntilMonth', parseInt(e.target.value))}
                            className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          >
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                              <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Until year</label>
                          <input
                            type="number"
                            value={formData.repeatUntilYear}
                            onChange={(e) => handleInputChange('repeatUntilYear', parseInt(e.target.value) || formData.year)}
                            min={formData.year}
                            max="2100"
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
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
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                  isBill
                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {isEditing
                  ? isBill
                    ? 'Update Bill'
                    : 'Update Entry'
                  : isBill && formData.repeatMode === 'full_year'
                  ? `Add Bill — all 12 months of ${formData.year}`
                  : isBill && formData.repeatMode === 'until_end'
                  ? `Add Bill — until Dec ${formData.year} (${12 - formData.month + 1} months)`
                  : isBill && formData.repeatMode === 'until_specific'
                  ? `Add Bill — until ${
                      ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][formData.repeatUntilMonth - 1]
                    } ${formData.repeatUntilYear}`
                  : isBill
                  ? 'Add Bill'
                  : 'Create Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
