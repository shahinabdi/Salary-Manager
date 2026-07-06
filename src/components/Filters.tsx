import React from 'react';
import { FilterOptions } from '../types';
import { Search, Filter, X } from 'lucide-react';

interface FiltersProps {
  filters: FilterOptions;
  searchTerm: string;
  onFiltersChange: (filters: FilterOptions) => void;
  onSearchChange: (search: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  searchTerm,
  onFiltersChange,
  onSearchChange
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '') || searchTerm;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter size={16} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="salary">Salary</option>
                <option value="bonus">Bonus</option>
                <option value="overtime">Overtime</option>
                <option value="benefits">Benefits</option>
              </select>
            </div>

            {/* Transport Paid Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Status
              </label>
              <select
                value={filters.transportPaid === undefined ? '' : filters.transportPaid.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('transportPaid', value === '' ? undefined : value === 'true');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => {
                  const start = e.target.value;
                  handleFilterChange('dateRange', start ? { 
                    start, 
                    end: filters.dateRange?.end || '' 
                  } : undefined);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => {
                  const end = e.target.value;
                  handleFilterChange('dateRange', end ? { 
                    start: filters.dateRange?.start || '', 
                    end 
                  } : undefined);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};