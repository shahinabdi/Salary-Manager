import React, { useRef, useState } from 'react';
import { YearlyData } from '../types';
import { exportToJson, downloadJson, parseImportedData } from '../utils/helpers';
import { Download, Upload, AlertCircle } from 'lucide-react';

interface ImportExportProps {
  data: YearlyData[];
  selectedYear: number;
  onImport: (data: YearlyData[]) => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({
  data,
  selectedYear,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = (yearOnly: boolean = false) => {
    const exportData = yearOnly 
      ? data.filter(item => item.year === selectedYear)
      : data;
    
    const jsonData = exportToJson(exportData, yearOnly ? selectedYear : undefined);
    const filename = `salary-data${yearOnly ? `-${selectedYear}` : ''}-${new Date().toISOString().split('T')[0]}.json`;
    downloadJson(jsonData, filename);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      const importedData = parseImportedData(text);
      onImport(importedData);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import & Export</h3>
      
      <div className="space-y-4">
        {/* Export Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Data</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleExport(true)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export {selectedYear}
            </button>
            <button
              onClick={() => handleExport(false)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Years
            </button>
          </div>
        </div>

        {/* Import Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Import Data</h4>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Import JSON'}
            </button>
          </div>
          
          {importError && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{importError}</span>
            </div>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            Import will merge data with existing entries. Duplicates will be skipped based on ID.
          </p>
        </div>
      </div>
    </div>
  );
};