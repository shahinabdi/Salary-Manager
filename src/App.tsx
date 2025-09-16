import { useState, useCallback } from 'react';
import { YearlyData } from './types';
import { useDataManagement } from './hooks/useDataManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DataForm } from './components/DataForm';
import { DataTable } from './components/DataTable';
import { Filters } from './components/Filters';
import { Statistics } from './components/Statistics';
import { MonthStatus } from './components/MonthStatus';
import { TransportDefaultSetting } from './components/TransportDefaultSetting';
import { ImportExport } from './components/ImportExport';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Plus, Calendar, Database, AlertCircle } from 'lucide-react';

function App() {
  const {
    data,
    allData,
    selectedYear,
    statistics,
    loading,
    error,
    setSelectedYear,
    setFilters,
    setSearchTerm,
    createItem,
    updateItem,
    deleteItem,
    getTransportDefault,
    setTransportDefault,
    filters,
    searchTerm
  } = useDataManagement();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<YearlyData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleSubmit = useCallback(async (formData: Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        await createItem(formData);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  }, [editingItem, createItem, updateItem]);

  const handleEdit = useCallback((item: YearlyData) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, itemId: id });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.itemId) {
      deleteItem(deleteConfirm.itemId);
    }
    setDeleteConfirm({ isOpen: false, itemId: null });
  }, [deleteConfirm.itemId, deleteItem]);

  const handleImport = useCallback((importedData: YearlyData[]) => {
    // Merge imported data with existing data, avoiding duplicates
    const existingIds = new Set(allData.map((item: YearlyData) => item.id));
    const newData = importedData.filter(item => !existingIds.has(item.id));
    
    newData.forEach(item => {
      if (item.category === 'salary') {
        const salaryItem = item as any; // Cast for legacy compatibility
        const salaryData = {
          category: 'salary' as const,
          year: salaryItem.year,
          month: salaryItem.month,
          amount: salaryItem.salaryNet || salaryItem.amount || 0,
          salaryNet: salaryItem.salaryNet || 0,
          swilePayment: salaryItem.swilePayment || 0,
          transportPayment: salaryItem.transportPayment || 0,
          transportPaid: salaryItem.transportPaid ?? false,
          worked: salaryItem.worked ?? true,
          notes: salaryItem.notes || ''
        };
        createItem(salaryData as any); // Cast to bypass type checking for legacy data
      } else {
        createItem(item);
      }
    });
  }, [allData, createItem]);

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Salary Manager</h1>
                  <p className="text-sm text-gray-500">Yearly financial data management</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Year Selector */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddNew}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Entry</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Statistics */}
              <Statistics statistics={statistics} />

              {/* Transport Default Setting */}
              <div className="mb-6">
                <TransportDefaultSetting
                  selectedYear={selectedYear}
                  getTransportDefault={getTransportDefault}
                  setTransportDefault={setTransportDefault}
                />
              </div>

              {/* Month Completion Status */}
              <MonthStatus data={allData} selectedYear={selectedYear} />

              {/* Filters and Search */}
              <Filters
                filters={filters}
                searchTerm={searchTerm}
                onFiltersChange={setFilters}
                onSearchChange={setSearchTerm}
              />

              {/* Data Table */}
              <div className="mb-6">
                <DataTable
                  data={data}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  loading={loading}
                />
              </div>

              {/* Import/Export */}
              <ImportExport
                data={allData}
                selectedYear={selectedYear}
                onImport={handleImport}
              />
            </>
          )}
        </main>

        {/* Modals */}
        <DataForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          initialData={editingItem}
          selectedYear={selectedYear}
          getTransportDefault={getTransportDefault}
          allData={data}
        />

        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Entry"
          message="Are you sure you want to delete this entry? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm({ isOpen: false, itemId: null })}
          type="danger"
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;