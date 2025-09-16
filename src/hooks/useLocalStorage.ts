import { useState, useCallback } from 'react';
import { YearlyData } from '../types';

interface UseLocalStorageReturn {
  data: YearlyData[];
  loading: boolean;
  error: string | null;
  saveData: (data: YearlyData[]) => void;
  loadData: () => void;
  clearData: () => void;
}

export const useLocalStorage = (key: string = 'yearlyDataManagement'): UseLocalStorageReturn => {
  const [data, setData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveData = useCallback((newData: YearlyData[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const serializedData = JSON.stringify(newData);
      localStorage.setItem(key, serializedData);
      setData(newData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
      console.error('LocalStorage save error:', err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        const parsedData: YearlyData[] = JSON.parse(storedData);
        // Convert date strings back to Date objects
        const processedData = parsedData.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
        setData(processedData);
      } else {
        setData([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('LocalStorage load error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const clearData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      localStorage.removeItem(key);
      setData([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      console.error('LocalStorage clear error:', err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  return { data, loading, error, saveData, loadData, clearData };
};