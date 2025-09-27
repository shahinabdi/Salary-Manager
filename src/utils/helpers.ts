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
    // First, try to parse the JSON
    const parsed = JSON.parse(jsonString);
    
    // Handle both direct array and export format
    let dataArray: any[] = [];
    
    if (Array.isArray(parsed)) {
      dataArray = parsed;
    } else if (parsed.yearlyData && Array.isArray(parsed.yearlyData)) {
      dataArray = parsed.yearlyData;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      dataArray = parsed.data; // Legacy format
    } else {
      throw new Error('Invalid JSON structure: Expected an array or object with yearlyData/data property containing array of entries');
    }

    if (dataArray.length === 0) {
      throw new Error('No data entries found in the JSON file');
    }

    const processedData: YearlyData[] = [];
    const processingErrors: string[] = [];

    dataArray.forEach((item: any, index: number) => {
      try {
        // Validate required fields
        if (!item || typeof item !== 'object') {
          processingErrors.push(`Entry ${index + 1}: Invalid entry format`);
          return;
        }

        if (!item.year || !item.month || !item.category) {
          processingErrors.push(`Entry ${index + 1}: Missing required fields (year, month, category)`);
          return;
        }

        // Validate year and month
        const year = Number(item.year);
        const month = Number(item.month);
        
        if (isNaN(year) || year < 1900 || year > 2100) {
          processingErrors.push(`Entry ${index + 1}: Invalid year (${item.year})`);
          return;
        }
        
        if (isNaN(month) || month < 1 || month > 12) {
          processingErrors.push(`Entry ${index + 1}: Invalid month (${item.month})`);
          return;
        }

        // Handle legacy data that might have transportPayment
        if (item.category === 'salary') {
          const salaryEntry = {
            id: item.id || generateId(),
            year,
            month,
            amount: Number(item.salaryNet || item.amount || 0),
            salaryNet: Number(item.salaryNet || 0),
            swilePayment: Number(item.swilePayment || 0),
            transportPaid: Boolean(item.transportPaid),
            worked: Boolean(item.worked ?? true),
            category: 'salary' as const,
            notes: item.notes || '',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          };
          
          processedData.push(salaryEntry as SalaryEntry);
        } else if (['bonus', 'overtime', 'benefits'].includes(item.category)) {
          const amount = Number(item.amount || 0);
          if (amount <= 0) {
            processingErrors.push(`Entry ${index + 1}: Amount must be greater than 0 for ${item.category} entries`);
            return;
          }
          
          const otherEntry = {
            id: item.id || generateId(),
            year,
            month,
            amount,
            category: item.category,
            notes: item.notes || '',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          };
          
          processedData.push(otherEntry);
        } else {
          processingErrors.push(`Entry ${index + 1}: Invalid category '${item.category}'. Must be: salary, bonus, overtime, or benefits`);
        }
      } catch (itemError) {
        processingErrors.push(`Entry ${index + 1}: Processing error - ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    });

    // If we have processing errors, include them in the error message
    if (processingErrors.length > 0) {
      const errorSummary = `Some entries could not be processed:\n${processingErrors.slice(0, 5).join('\n')}${
        processingErrors.length > 5 ? `\n... and ${processingErrors.length - 5} more errors` : ''
      }`;
      
      if (processedData.length === 0) {
        throw new Error(`No valid entries found. ${errorSummary}`);
      } else {
        console.warn(`Import completed with ${processingErrors.length} errors:`, processingErrors);
      }
    }

    return processedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format: ${error.message}. Please check your JSON syntax.`);
    } else if (error instanceof Error) {
      throw error; // Re-throw our custom errors
    } else {
      throw new Error('Unknown error occurred while parsing JSON data');
    }
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