import { useState, useCallback, useEffect } from 'react';
import { AuthUser, YearlyData, BillEntry } from './types';
import { useDataManagement } from './hooks/useDataManagement';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './components/LoginPage';
import { DataForm } from './components/DataForm';
import { DataTable } from './components/DataTable';
import { BillsTable } from './components/BillsTable';
import { Filters } from './components/Filters';
import { Statistics } from './components/Statistics';
import { YearlyCharts } from './components/YearlyCharts';
import { MonthStatus } from './components/MonthStatus';
import { MonthlyOverview } from './components/MonthlyOverview';
import { ImportExport } from './components/ImportExport';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PrintModal } from './components/PrintModal';
import { Plus, Calendar, Database, AlertCircle, Printer, LogOut, Receipt } from 'lucide-react';
import { fetchCurrentUser, logoutRequest } from './lib/authApi';

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    bulkCreateItems,
    clearAllData,
    filters,
    searchTerm
  } = useDataManagement({ enabled: !!authUser && !authLoading });

  const [showForm, setShowForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingItem, setEditingItem] = useState<YearlyData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({ isOpen: false, itemId: null });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await fetchCurrentUser();
        setAuthUser(user);
      } catch (err) {
        console.error('Failed to fetch current session:', err);
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    void checkSession();
  }, []);

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleSubmit = useCallback(async (
    formData:
      | Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>
      | Array<Omit<BillEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    try {
      if (Array.isArray(formData)) {
        // "repeat all year" bill – bulk create, skipping duplicates silently
        await bulkCreateItems(formData as YearlyData[]);
      } else if (editingItem) {
        await updateItem(editingItem.id, formData as Partial<YearlyData>);
      } else {
        await createItem(formData as Omit<YearlyData, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setShowForm(false);
      setShowBillForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  }, [editingItem, createItem, updateItem, bulkCreateItems]);

  const handleEdit = useCallback((item: YearlyData) => {
    setEditingItem(item);
    if (item.category === 'bill') {
      setShowBillForm(true);
    } else {
      setShowForm(true);
    }
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, itemId: id });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.itemId) {
      void deleteItem(deleteConfirm.itemId);
    }
    setDeleteConfirm({ isOpen: false, itemId: null });
  }, [deleteConfirm.itemId, deleteItem]);

  const handleImport = useCallback(async (importedData: YearlyData[]) => {
    console.log(`🔄 Starting import process...`);
    console.log(`📊 Current data in app: ${allData.length} entries`);
    console.log(`📥 Data to import: ${importedData.length} entries`);
    
    // Merge imported data with existing data, avoiding duplicates
    const existingIds = new Set(allData.map((item: YearlyData) => item.id));
    const duplicateEntries = importedData.filter(item => existingIds.has(item.id));
    const newData = importedData.filter(item => !existingIds.has(item.id));
    
    console.log(`🔍 Duplicate analysis:`);
    console.log(`   - Entries with existing IDs (skipped): ${duplicateEntries.length}`);
    console.log(`   - New entries to import: ${newData.length}`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    // Use bulk import to avoid race conditions
    try {
      console.log(`Starting bulk import of ${newData.length} items...`);
      
      const bulkResult = await bulkCreateItems(newData);
      importedCount = bulkResult.imported.length;
      
      console.log(`✅ Bulk import completed:`);
      console.log(`   - Successfully imported: ${bulkResult.imported.length}`);
      console.log(`   - Skipped duplicates: ${bulkResult.skippedCount}`);
      console.log(`   - Errors: ${bulkResult.errors.length}`);
      
      bulkResult.imported.forEach(item => {
        console.log(`✅ Imported: ${item.year}-${item.month.toString().padStart(2, '0')} (${item.category})`);
      });
      
      if (bulkResult.errors.length > 0) {
        console.warn(`⚠️  Import errors:`, bulkResult.errors);
        errorCount = bulkResult.errors.length;
      }
      
    } catch (error) {
      console.error(`❌ Bulk import failed completely:`, error);
      errorCount = newData.length;
      importedCount = 0;
    }
    
    // Final summary
    console.log(`🎉 Import completed: ${importedCount} entries imported, ${errorCount} errors`);
    
    if (importedCount > 0) {
      alert(`Import successful!\\n\\n✅ Imported: ${importedCount} new entries${duplicateEntries.length > 0 ? `\\n⚠️ Skipped: ${duplicateEntries.length} duplicates` : ''}${errorCount > 0 ? `\\n❌ Errors: ${errorCount}` : ''}`);
    } else if (duplicateEntries.length > 0) {
      alert(`No new data imported!\\n\\nAll ${importedData.length} entries already exist in your app.`);
    } else {
      alert(`Import failed!\\n\\n${errorCount} errors occurred.\\n\\nCheck the console for details.`);
    }
  }, [allData, bulkCreateItems]);

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleAddExpense = () => {
    setEditingItem(null);
    setShowBillForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowBillForm(false);
    setEditingItem(null);
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setAuthUser(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage onLoginSuccess={setAuthUser} />;
  }

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
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-700">{authUser.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{authUser.email}</p>
                </div>

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

                {/* Add Entry Button */}
                <button
                  onClick={handleAddNew}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Entry</span>
                </button>

                {/* Add Expense Button */}
                <button
                  onClick={handleAddExpense}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>

                {/* Print Button */}
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
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

              {/* Interactive Yearly Graphs */}
              <YearlyCharts data={allData} selectedYear={selectedYear} />

              {/* Month Completion Status */}
              <MonthStatus data={allData} selectedYear={selectedYear} />

              {/* Monthly Money Overview (12-month, collapsible) */}
              <MonthlyOverview allData={allData} selectedYear={selectedYear} />

              {/* Filters and Search */}
              <Filters
                filters={filters}
                searchTerm={searchTerm}
                onFiltersChange={setFilters}
                onSearchChange={setSearchTerm}
              />

              {/* Salary / Income Table */}
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  Salary &amp; Income
                </h2>
                <DataTable
                  data={data.filter((d) => d.category !== 'bill')}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  loading={loading}
                />
              </div>

              {/* Bills / Expenses Table */}
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                  Bills &amp; Expenses
                </h2>
                <BillsTable
                  data={data.filter((d): d is BillEntry => d.category === 'bill')}
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
                onClearData={clearAllData}
              />
            </>
          )}
        </main>

        {/* Modals */}
        {/* Entry form (salary/bonus/overtime/benefits) */}
        <DataForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          initialData={editingItem?.category !== 'bill' ? editingItem : null}
          selectedYear={selectedYear}
          allData={allData}
          defaultBillMode={false}
        />

        {/* Bill / Expense form */}
        <DataForm
          isOpen={showBillForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          initialData={editingItem?.category === 'bill' ? editingItem : null}
          selectedYear={selectedYear}
          allData={allData}
          defaultBillMode={true}
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

        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          data={data}
          selectedYear={selectedYear}
          statistics={statistics}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;