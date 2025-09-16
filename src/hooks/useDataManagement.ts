import { useState, useEffect, useCallback, useMemo } from 'react';
import { YearlyData, FilterOptions, SortOptions, SalaryEntry, OtherEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { validateYearlyData, generateId } from '../utils/helpers';

export const useDataManagement = () => {
  const { data, loading: storageLoading, error: storageError, saveData, loadData } = useLocalStorage();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'month', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => item.year === selectedYear);

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.transportPaid !== undefined) {
      filtered = filtered.filter(item => 
        item.category === 'salary' && (item as SalaryEntry).transportPaid === filters.transportPaid
      );
    }

    if (filters.monthRange) {
      filtered = filtered.filter(item => {
        const itemYear = item.year;
        const itemMonth = item.month;
        
        const isAfterStart = itemYear > filters.monthRange!.startYear || 
          (itemYear === filters.monthRange!.startYear && itemMonth >= filters.monthRange!.startMonth);
        const isBeforeEnd = itemYear < filters.monthRange!.endYear || 
          (itemYear === filters.monthRange!.endYear && itemMonth <= filters.monthRange!.endMonth);
        
        return isAfterStart && isBeforeEnd;
      });
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.notes?.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.year.toString().includes(term) ||
        item.month.toString().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field as keyof YearlyData];
      const bValue = b[sort.field as keyof YearlyData];
      
      let comparison = 0;
      if (aValue != null && bValue != null) {
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
      }
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [data, selectedYear, filters, searchTerm, sort]);

  // CRUD operations
  const createItem = useCallback((itemData: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const errors = validateYearlyData(itemData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    let newItem: YearlyData;
    
    if (itemData.category === 'salary') {
      newItem = {
        ...(itemData as Omit<SalaryEntry, 'id' | 'createdAt' | 'updatedAt'>),
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SalaryEntry;
    } else {
      newItem = {
        ...(itemData as Omit<OtherEntry, 'id' | 'createdAt' | 'updatedAt'>),
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtherEntry;
    }

    const updatedData = [...data, newItem];
    saveData(updatedData);
    return newItem;
  }, [data, saveData]);

  const updateItem = useCallback((id: string, updates: Partial<YearlyData>) => {
    const itemIndex = data.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const existingItem = data[itemIndex];
    let updatedItem: YearlyData;
    
    if (existingItem.category === 'salary' || updates.category === 'salary') {
      updatedItem = {
        ...existingItem,
        ...updates,
        updatedAt: new Date(),
      } as SalaryEntry;
    } else {
      updatedItem = {
        ...existingItem,
        ...updates,
        updatedAt: new Date(),
      } as OtherEntry;
    }

    const errors = validateYearlyData(updatedItem);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    const updatedData = [...data];
    updatedData[itemIndex] = updatedItem;
    saveData(updatedData);
    return updatedItem;
  }, [data, saveData]);

  const deleteItem = useCallback((id: string) => {
    const updatedData = data.filter(item => item.id !== id);
    saveData(updatedData);
  }, [data, saveData]);

  const deleteMultiple = useCallback((ids: string[]) => {
    const updatedData = data.filter(item => !ids.includes(item.id));
    saveData(updatedData);
  }, [data, saveData]);

  // Enhanced createItem that uses current form data
  const addItemWithDefaults = useCallback((itemData: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createItem(itemData);
  }, [createItem]);

  // Statistics
  const statistics = useMemo(() => {
    const yearData = data.filter(item => item.year === selectedYear);
    const salaryEntries = yearData.filter(item => item.category === 'salary') as SalaryEntry[];
    const workedMonths = salaryEntries.filter(item => item.worked);
    const notWorkedMonths = salaryEntries.filter(item => !item.worked);
    
    return {
      totalEntries: yearData.length,
      workedMonths: workedMonths.length,
      notWorkedMonths: notWorkedMonths.length,
      totalSalary: salaryEntries.reduce((sum, item) => sum + item.salaryNet, 0),
      totalSwilePayments: salaryEntries.reduce((sum, item) => sum + item.swilePayment, 0),
      averageSalary: workedMonths.length > 0 ? workedMonths.reduce((sum, item) => sum + item.salaryNet, 0) / workedMonths.length : 0,
      paidTransportCount: workedMonths.filter(item => item.transportPaid).length,
      unpaidTransportCount: workedMonths.filter(item => !item.transportPaid).length,
    };
  }, [data, selectedYear]);

  return {
    // Data
    data: filteredAndSortedData,
    allData: data,
    selectedYear,
    statistics,
    
    // State
    loading: storageLoading,
    error: storageError,
    
    // Actions
    setSelectedYear,
    setFilters,
    setSort,
    setSearchTerm,
    createItem,
    createItemWithDefaults: addItemWithDefaults,
    updateItem,
    deleteItem,
    deleteMultiple,
    
    // Current values
    filters,
    sort,
    searchTerm,
  };
};