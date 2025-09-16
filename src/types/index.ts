// Core data types and interfaces
export interface BaseEntry {
  id: string;
  year: number;
  month: number;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryEntry extends BaseEntry {
  category: 'salary';
  salaryNet: number; // Same as amount for salary entries
  swilePayment: number; // Payment for previous month's swile
  transportPaid: boolean; // Whether transport was provided/paid (checkbox only)
  worked: boolean; // Whether the person worked this month
}

export interface OtherEntry extends BaseEntry {
  category: 'bonus' | 'overtime' | 'benefits';
}

export type YearlyData = SalaryEntry | OtherEntry;

export interface MonthStatus {
  year: number;
  month: number;
  hasSalary: boolean;
  hasSwile: boolean;
  hasTransport: boolean;
  notWorked: boolean;
  isComplete: boolean;
}

export interface FilterOptions {
  category?: string;
  transportPaid?: boolean;
  monthRange?: {
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
  };
  searchTerm?: string;
}

export interface SortOptions {
  field: keyof YearlyData;
  direction: 'asc' | 'desc';
}

export interface AppState {
  selectedYear: number;
  data: YearlyData[];
  filteredData: YearlyData[];
  isLoading: boolean;
  error: string | null;
  showForm: boolean;
  editingItem: YearlyData | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ExportData {
  exportDate: string;
  yearlyData: YearlyData[];
  summary: {
    totalEntries: number;
    totalSalary: number;
    totalSwilePayments: number;
    totalTransportPayments: number;
  };
}