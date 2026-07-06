// JSON Import Validator and Debugger
import { YearlyData } from '../types';

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedData?: YearlyData[];
  originalStructure?: any;
}

export const validateAndDebugJsonImport = (jsonString: string): ImportValidationResult => {
  const result: ImportValidationResult = {
    isValid: false,
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Parse JSON
    const parsed = JSON.parse(jsonString);
    result.originalStructure = parsed;

    // Step 2: Determine data structure
    let dataArray: any[] = [];
    
    if (Array.isArray(parsed)) {
      dataArray = parsed;
      console.log('✅ JSON Import: Direct array format detected');
    } else if (parsed.yearlyData && Array.isArray(parsed.yearlyData)) {
      dataArray = parsed.yearlyData;
      console.log('✅ JSON Import: Export format detected');
    } else if (parsed.data && Array.isArray(parsed.data)) {
      dataArray = parsed.data;
      console.log('✅ JSON Import: Legacy data format detected');
    } else {
      result.errors.push('Invalid JSON structure: Expected array or object with yearlyData/data property');
      return result;
    }

    // Step 3: Validate each entry
    const processedData: YearlyData[] = [];
    
    dataArray.forEach((item, index) => {
      try {
        // Basic validation
        if (!item || typeof item !== 'object') {
          result.warnings.push(`Entry ${index + 1}: Invalid item structure`);
          return;
        }

        // Required fields validation
        if (!item.year || !item.month || !item.category) {
          result.warnings.push(`Entry ${index + 1}: Missing required fields (year, month, category)`);
          return;
        }

        // Year validation
        const year = Number(item.year);
        if (isNaN(year) || year < 1900 || year > 2100) {
          result.warnings.push(`Entry ${index + 1}: Invalid year (${item.year})`);
          return;
        }

        // Month validation
        const month = Number(item.month);
        if (isNaN(month) || month < 1 || month > 12) {
          result.warnings.push(`Entry ${index + 1}: Invalid month (${item.month})`);
          return;
        }

        // Category validation
        if (!['salary', 'bonus', 'overtime', 'benefits'].includes(item.category)) {
          result.warnings.push(`Entry ${index + 1}: Invalid category (${item.category})`);
          return;
        }

        // Process based on category
        if (item.category === 'salary') {
          const salaryEntry = {
            id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

          // Salary-specific validation
          if (salaryEntry.salaryNet < 0) {
            result.warnings.push(`Entry ${index + 1}: Negative salary amount`);
          }
          if (salaryEntry.swilePayment < 0) {
            result.warnings.push(`Entry ${index + 1}: Negative Swile payment`);
          }

          processedData.push(salaryEntry);
        } else {
          const otherEntry = {
            id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            year,
            month,
            amount: Number(item.amount || 0),
            category: item.category,
            notes: item.notes || '',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          };

          // Other entry validation
          if (otherEntry.amount <= 0) {
            result.warnings.push(`Entry ${index + 1}: Amount must be greater than 0`);
          }

          processedData.push(otherEntry);
        }
      } catch (itemError) {
        result.warnings.push(`Entry ${index + 1}: Processing error - ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    });

    result.processedData = processedData;
    result.isValid = result.errors.length === 0;

    // Log summary
    console.log(`📊 JSON Import Summary:
    - Total entries found: ${dataArray.length}
    - Successfully processed: ${processedData.length}
    - Errors: ${result.errors.length}
    - Warnings: ${result.warnings.length}
    `);

    if (result.warnings.length > 0) {
      console.warn('⚠️ Import warnings:', result.warnings);
    }

    if (result.errors.length > 0) {
      console.error('❌ Import errors:', result.errors);
    }

    return result;

  } catch (parseError) {
    result.errors.push(`JSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    console.error('❌ JSON Parse Failed:', parseError);
    return result;
  }
};

// Helper function to create sample JSON structure
export const generateSampleJsonStructure = () => {
  const sampleData = {
    exportDate: new Date().toISOString(),
    yearlyData: [
      {
        id: "sample1",
        year: 2024,
        month: 1,
        category: "salary",
        salaryNet: 2500.00,
        swilePayment: 150.00,
        transportPaid: true,
        worked: true,
        amount: 2500.00,
        notes: "January salary",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "sample2",
        year: 2024,
        month: 1,
        category: "bonus",
        amount: 500.00,
        notes: "Performance bonus",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    summary: {
      totalEntries: 2,
      totalSalary: 2500.00,
      totalSwilePayments: 150.00,
      totalTransportPayments: 0
    }
  };

  return JSON.stringify(sampleData, null, 2);
};

// Function to fix common JSON issues
export const suggestJsonFixes = (jsonString: string): string[] => {
  const suggestions: string[] = [];

  // Check for common issues
  if (jsonString.includes('undefined')) {
    suggestions.push('Replace "undefined" values with null or proper values');
  }

  if (jsonString.includes('NaN')) {
    suggestions.push('Replace "NaN" values with valid numbers');
  }

  if (!jsonString.trim().startsWith('{') && !jsonString.trim().startsWith('[')) {
    suggestions.push('JSON should start with { or [');
  }

  if (!jsonString.trim().endsWith('}') && !jsonString.trim().endsWith(']')) {
    suggestions.push('JSON should end with } or ]');
  }

  // Check for trailing commas (common issue)
  if (jsonString.includes(',}') || jsonString.includes(',]')) {
    suggestions.push('Remove trailing commas before } or ]');
  }

  return suggestions;
};