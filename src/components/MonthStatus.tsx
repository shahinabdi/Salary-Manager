import React, { useState } from 'react';
import { YearlyData, SalaryEntry } from '../types';
import { getYearMonthsStatus, formatMonthYear } from '../utils/helpers';
import { CheckCircle, AlertCircle, Clock, Calendar, X, Euro, CreditCard, Car, UserX } from 'lucide-react';

interface MonthStatusProps {
  data: YearlyData[];
  selectedYear: number;
}

interface MonthModalData {
  year: number;
  month: number;
  allEntries: YearlyData[];
  salaryEntry?: SalaryEntry;
}

export const MonthStatus: React.FC<MonthStatusProps> = ({ data, selectedYear }) => {
  const [selectedMonthData, setSelectedMonthData] = useState<MonthModalData | null>(null);
  const monthsStatus = getYearMonthsStatus(data, selectedYear);

  const handleCardClick = (status: any) => {
    // Find all entries for this month
    const monthEntries = data.filter(item => 
      item.month === status.month && item.year === status.year
    );
    
    const salaryEntry = monthEntries.find(entry => entry.category === 'salary') as SalaryEntry | undefined;
    
    setSelectedMonthData({
      year: status.year,
      month: status.month,
      allEntries: monthEntries,
      salaryEntry: salaryEntry
    });
  };

  const closeModal = () => {
    setSelectedMonthData(null);
  };

  const getStatusIcon = (hasSalary: boolean, hasSwile: boolean, hasTransport: boolean, notWorked: boolean, isComplete: boolean) => {
    if (notWorked) {
      return <UserX className="w-5 h-5 text-gray-500" />;
    }
    
    if (isComplete) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    const missingCount = [hasSalary, hasSwile, hasTransport].filter(x => !x).length;
    if (missingCount === 3) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = (hasSalary: boolean, hasSwile: boolean, notWorked: boolean, isComplete: boolean) => {
    if (notWorked) {
      return 'Not Worked';
    }
    
    if (isComplete) {
      return 'Complete';
    }
    
    const missing = [];
    if (!hasSalary) missing.push('Salary');
    if (!hasSwile) missing.push('Swile');
    // Transport is not included in missing since it's part of salary
    
    return `Missing: ${missing.join(', ')}`;
  };

  const getStatusColor = (hasSalary: boolean, hasSwile: boolean, notWorked: boolean, isComplete: boolean) => {
    if (notWorked) {
      return 'bg-gray-50 border-gray-200';
    }
    
    if (isComplete) {
      return 'bg-green-50 border-green-200';
    }
    
    // Only consider salary and swile for completion status colors
    const missingCount = [hasSalary, hasSwile].filter(x => !x).length;
    if (missingCount === 2) {
      return 'bg-red-50 border-red-200';
    }
    
    return 'bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Calendar className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedYear} Month Completion Status
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthsStatus.map((status) => (
          <div
            key={`${status.year}-${status.month}`}
            onClick={() => handleCardClick(status)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md transform hover:scale-105 ${getStatusColor(
              status.hasSalary,
              status.hasSwile,
              status.notWorked,
              status.isComplete
            )}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                {formatMonthYear(status.year, status.month)}
              </h3>
              {getStatusIcon(status.hasSalary, status.hasSwile, status.hasTransport, status.notWorked, status.isComplete)}
            </div>
            
            <div className="space-y-1">
              {status.notWorked ? (
                <div className="flex items-center justify-center py-4">
                  <UserX className="w-8 h-8 text-gray-400 mr-2" />
                  <span className="text-gray-500 font-medium">Did not work</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${status.hasSalary ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={status.hasSalary ? 'text-green-700' : 'text-gray-500'}>
                      Salary
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${status.hasSwile ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={status.hasSwile ? 'text-green-700' : 'text-gray-500'}>
                      Swile
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${status.hasTransport ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={status.hasTransport ? 'text-green-700' : 'text-gray-500'}>
                      Transport
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className={`text-xs font-medium ${
                status.notWorked
                  ? 'text-gray-500'
                  : status.isComplete 
                    ? 'text-green-700' 
                    : status.hasSalary || status.hasSwile || status.hasTransport 
                      ? 'text-yellow-700' 
                      : 'text-red-700'
              }`}>
                {getStatusText(status.hasSalary, status.hasSwile, status.notWorked, status.isComplete)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Payment Schedule:</p>
            <p>• Salary is paid in the same month (includes transport)</p>
            <p>• Swile payments are received one month later</p>
            <p>• A month is considered complete when it has salary and swile</p>
            <p>• <strong>Transport is included in salary, not calculated separately</strong></p>
            <p>• <strong>Mark months as "Not Worked" if you didn't work that month</strong></p>
          </div>
        </div>
      </div>

      {/* Month Details Modal */}
      {selectedMonthData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatMonthYear(selectedMonthData.year, selectedMonthData.month)} Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedMonthData.salaryEntry && !selectedMonthData.salaryEntry.worked ? (
                <div className="text-center py-8">
                  <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Did Not Work This Month</h4>
                  <p className="text-gray-500 text-sm">
                    This month is marked as not worked. No payment data is expected.
                  </p>
                </div>
              ) : selectedMonthData.salaryEntry ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Euro className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-700">Salary Net</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      €{selectedMonthData.salaryEntry.salaryNet.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-gray-700">Swile Payment</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      €{selectedMonthData.salaryEntry.swilePayment.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Car className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-gray-700">Transport Payment</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        €{selectedMonthData.salaryEntry.transportPayment.toFixed(2)}
                      </div>
                      <div className={`text-xs font-medium ${
                        selectedMonthData.salaryEntry.transportPaid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedMonthData.salaryEntry.transportPaid ? '✓ PAID' : '✗ NOT PAID'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Total Salary</span>
                      <span className="text-lg font-bold text-gray-900">
                        €{(selectedMonthData.salaryEntry.salaryNet + selectedMonthData.salaryEntry.swilePayment).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Salary Entry</h4>
                  <p className="text-gray-500 text-sm">
                    No salary entry found for this month.
                  </p>
                </div>
              )}

              {/* Show other entries if they exist */}
              {selectedMonthData.allEntries.filter(entry => entry.category !== 'salary').length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-3">Additional Entries</h4>
                  <div className="space-y-2">
                    {selectedMonthData.allEntries
                      .filter(entry => entry.category !== 'salary')
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center">
                            <Euro className="w-4 h-4 text-purple-600 mr-2" />
                            <span className="font-medium text-gray-700 capitalize">{entry.category}</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            €{entry.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
