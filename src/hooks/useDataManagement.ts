import { useState, useEffect, useCallback, useMemo } from 'react';
import { YearlyData, FilterOptions, SortOptions, SalaryEntry, OtherEntry, BillEntry } from '../types';
import { validateYearlyData, generateId } from '../utils/helpers';
import {
  fetchEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  clearEntries,
  bulkImportEntries,
} from '../lib/dataApi';

interface UseDataManagementOptions {
  enabled?: boolean;
}

export const useDataManagement = (options: UseDataManagementOptions = {}) => {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'month', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const entries = await fetchEntries();
      setData(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Load data on mount
  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    void loadData();
  }, [enabled, loadData]);

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
        (item.category === 'bill' && (item as BillEntry).title.toLowerCase().includes(term)) ||
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
  const createItem = useCallback(async (itemData: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>) => {
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
    } else if (itemData.category === 'bill') {
      newItem = {
        ...(itemData as Omit<BillEntry, 'id' | 'createdAt' | 'updatedAt'>),
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BillEntry;
    } else {
      newItem = {
        ...(itemData as Omit<OtherEntry, 'id' | 'createdAt' | 'updatedAt'>),
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OtherEntry;
    }

    const created = await createEntry(newItem);
    setData((prev) => [...prev, created]);
    return created;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<YearlyData>) => {
    const itemIndex = data.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const existingItem = data[itemIndex];
    let updatedItem: YearlyData;
    
    if (existingItem.category === 'salary' || updates.category === 'salary') {
      updatedItem = { ...existingItem, ...updates, updatedAt: new Date() } as SalaryEntry;
    } else if (existingItem.category === 'bill' || updates.category === 'bill') {
      updatedItem = { ...existingItem, ...updates, updatedAt: new Date() } as BillEntry;
    } else {
      updatedItem = { ...existingItem, ...updates, updatedAt: new Date() } as OtherEntry;
    }

    const errors = validateYearlyData(updatedItem);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    const saved = await updateEntry(id, updatedItem);
    setData((prev) => prev.map((item) => (item.id === id ? saved : item)));
    return saved;
  }, [data]);

  const deleteItem = useCallback(async (id: string) => {
    const item = data.find(d => d.id === id);
    await deleteEntry(id, item?.category);
    setData((prev) => prev.filter(item => item.id !== id));
  }, [data]);

  const deleteMultiple = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map((id) => {
      const item = data.find(d => d.id === id);
      return deleteEntry(id, item?.category);
    }));
    setData((prev) => prev.filter(item => !ids.includes(item.id)));
  }, [data]);

  const clearAllData = useCallback(async () => {
    await clearEntries();
    setData([]);
  }, []);

  // Bulk import function to avoid race conditions
  const bulkCreateItems = useCallback(async (itemsData: YearlyData[]) => {
    const newItems: YearlyData[] = [];
    const errors: string[] = [];
    
    itemsData.forEach((itemData, index) => {
      try {
        const validationErrors = validateYearlyData(itemData);
        if (validationErrors.length > 0) {
          errors.push(`Item ${index + 1}: ${validationErrors.map(e => e.message).join(', ')}`);
          return;
        }

        let newItem: YearlyData;
        
        if (itemData.category === 'salary') {
          newItem = {
            ...(itemData as Omit<SalaryEntry, 'id' | 'createdAt' | 'updatedAt'>),
            id: (itemData as { id?: string }).id || generateId(),
            createdAt: (itemData as any).createdAt ? new Date((itemData as any).createdAt) : new Date(),
            updatedAt: (itemData as any).updatedAt ? new Date((itemData as any).updatedAt) : new Date(),
          } as SalaryEntry;
        } else if (itemData.category === 'bill') {
          newItem = {
            ...(itemData as Omit<BillEntry, 'id' | 'createdAt' | 'updatedAt'>),
            id: (itemData as { id?: string }).id || generateId(),
            createdAt: (itemData as any).createdAt ? new Date((itemData as any).createdAt) : new Date(),
            updatedAt: (itemData as any).updatedAt ? new Date((itemData as any).updatedAt) : new Date(),
          } as BillEntry;
        } else {
          newItem = {
            ...(itemData as Omit<OtherEntry, 'id' | 'createdAt' | 'updatedAt'>),
            id: (itemData as { id?: string }).id || generateId(),
            createdAt: (itemData as any).createdAt ? new Date((itemData as any).createdAt) : new Date(),
            updatedAt: (itemData as any).updatedAt ? new Date((itemData as any).updatedAt) : new Date(),
          } as OtherEntry;
        }
        
        newItems.push(newItem);
      } catch (error) {
        errors.push(`Item ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    if (errors.length > 0 && newItems.length === 0) {
      throw new Error(`Bulk import failed: ${errors.join('; ')}`);
    }
    
    const result = await bulkImportEntries(newItems);
    const imported = newItems.filter((entry) => result.importedIds.includes(entry.id));

    if (imported.length > 0) {
      setData((prev) => [...prev, ...imported]);
    }

    return {
      imported,
      errors,
      skippedCount: result.skippedCount,
    };
  }, []);

  // Enhanced createItem that uses current form data
  const addItemWithDefaults = useCallback((itemData: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createItem(itemData);
  }, [createItem]);

  // Statistics
  const statistics = useMemo(() => {
    const yearData = data.filter(item => item.year === selectedYear);
    const salaryEntries = yearData.filter(item => item.category === 'salary') as SalaryEntry[];
    const billEntries = yearData.filter(item => item.category === 'bill') as BillEntry[];
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
      totalBills: billEntries.reduce((sum, item) => sum + item.amount, 0),
      billCount: billEntries.length,
    };
  }, [data, selectedYear]);

  return {
    // Data
    data: filteredAndSortedData,
    allData: data,
    selectedYear,
    statistics,
    
    // State
    loading,
    error,
    
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
    bulkCreateItems,
    clearAllData,
    reloadData: loadData,
    
    // Current values
    filters,
    sort,
    searchTerm,
  };
};