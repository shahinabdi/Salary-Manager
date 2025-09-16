import { YearlyData, ValidationError, ExportData, MonthStatus, SalaryEntry } from '../types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const validateYearlyData = (data: Partial<YearlyData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.year || data.year < 1900 || data.year > 2100) {
    errors.push({ field: 'year', message: 'Year must be between 1900 and 2100' });
  }

  if (!data.month || data.month < 1 || data.month > 12) {
    errors.push({ field: 'month', message: 'Month must be between 1 and 12' });
  }

  // Type guard to check if this is a salary entry
  if (data.category === 'salary') {
    const salaryData = data as Partial<SalaryEntry>;
    
    if (salaryData.salaryNet !== undefined && salaryData.salaryNet < 0) {
      errors.push({ field: 'salaryNet', message: 'Salary cannot be negative' });
    }

    if (salaryData.swilePayment !== undefined && salaryData.swilePayment < 0) {
      errors.push({ field: 'swilePayment', message: 'Swile payment cannot be negative' });
    }
  } else if (data.category && ['bonus', 'overtime', 'benefits'].includes(data.category)) {
    // For other entries, just validate amount
    if (data.amount !== undefined && data.amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }
  }

  if (data.category && !['salary', 'bonus', 'overtime', 'benefits'].includes(data.category)) {
    errors.push({ field: 'category', message: 'Invalid category' });
  }

  return errors;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatMonthYear = (year: number, month: number): string => {
  const date = new Date(year, month - 1);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date);
};

export const formatDate = (year: number, month: number): string => {
  return formatMonthYear(year, month);
};

export const getMonthName = (month: number): string => {
  const date = new Date(2000, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
};

export const exportToJson = (data: YearlyData[], year?: number): string => {
  const filteredData = year ? data.filter(item => item.year === year) : data;
  
  const salaryEntries = filteredData.filter(item => item.category === 'salary') as SalaryEntry[];
  
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    yearlyData: filteredData,
    summary: {
      totalEntries: filteredData.length,
      totalSalary: salaryEntries.reduce((sum, item) => sum + item.salaryNet, 0),
      totalSwilePayments: salaryEntries.reduce((sum, item) => sum + item.swilePayment, 0),
      totalTransportPayments: 0, // Keep for backward compatibility
    },
  };

  return JSON.stringify(exportData, null, 2);
};

export const downloadJson = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseImportedData = (jsonString: string): YearlyData[] => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Handle both direct array and export format
    const dataArray = Array.isArray(parsed) ? parsed : parsed.yearlyData || [];
    
    return dataArray.map((item: any) => {
      // Handle legacy data that might have transportPayment
      if (item.category === 'salary') {
        return {
          id: item.id || generateId(),
          year: Number(item.year),
          month: Number(item.month || 1),
          amount: Number(item.salaryNet || item.amount || 0),
          salaryNet: Number(item.salaryNet || 0),
          swilePayment: Number(item.swilePayment || 0),
          transportPaid: Boolean(item.transportPaid),
          worked: Boolean(item.worked ?? true),
          category: 'salary',
          notes: item.notes || '',
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        } as SalaryEntry;
      } else {
        return {
          id: item.id || generateId(),
          year: Number(item.year),
          month: Number(item.month || 1),
          amount: Number(item.amount || 0),
          category: item.category,
          notes: item.notes || '',
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        };
      }
    });
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Get month status with completion information
export const getMonthStatus = (data: YearlyData[], targetYear: number, targetMonth: number): MonthStatus => {
  const monthEntries = data.filter(item => 
    item.year === targetYear && item.month === targetMonth
  );

  // Find the salary entry for this month
  const salaryEntry = monthEntries.find(entry => entry.category === 'salary') as SalaryEntry | undefined;

  // If no salary entry exists, assume not worked
  if (!salaryEntry) {
    return {
      year: targetYear,
      month: targetMonth,
      hasSalary: false,
      hasSwile: false,
      hasTransport: false,
      notWorked: true,
      isComplete: false
    };
  }

  // If explicitly marked as not worked
  if (!salaryEntry.worked) {
    return {
      year: targetYear,
      month: targetMonth,
      hasSalary: false,
      hasSwile: false,
      hasTransport: false,
      notWorked: true,
      isComplete: true // Not worked months are considered "complete"
    };
  }

  const hasSalary = salaryEntry.salaryNet > 0;
  
  // Swile is paid one month later, so we check if previous month's payment is in current month
  const hasSwile = salaryEntry.swilePayment > 0;
  // Transport is just a checkbox now, indicating if transport was provided
  const hasTransport = salaryEntry.transportPaid;

  return {
    year: targetYear,
    month: targetMonth,
    hasSalary,
    hasSwile,
    hasTransport,
    notWorked: false,
    isComplete: hasSalary && hasSwile // Only salary and swile needed for completion
  };
};

// Get all months with their completion status for a given year
export const getYearMonthsStatus = (data: YearlyData[], year: number): MonthStatus[] => {
  const months: MonthStatus[] = [];
  
  for (let month = 1; month <= 12; month++) {
    months.push(getMonthStatus(data, year, month));
  }
  
  return months;
};

// Check if a month should be considered complete based on available data
export const isMonthComplete = (data: YearlyData[], targetMonth: number, targetYear: number): boolean => {
  const monthEntries = data.filter(item => 
    item.month === targetMonth && item.year === targetYear
  );

  // Find the salary entry for this month
  const salaryEntry = monthEntries.find(entry => entry.category === 'salary') as SalaryEntry | undefined;
  
  if (!salaryEntry) return false; // No salary entry means incomplete

  // If marked as not worked, consider it complete
  if (!salaryEntry.worked) return true;
  
  const hasSalary = salaryEntry.salaryNet > 0;
  const hasSwile = salaryEntry.swilePayment > 0;
  // Transport is just a checkbox, so we don't check it for completion

  return hasSalary && hasSwile; // Only salary and swile needed
};