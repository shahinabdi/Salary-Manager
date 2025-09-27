import React, { useRef, useState } from 'react';
import { YearlyData } from '../types';
import { exportToJson, downloadJson, parseImportedData } from '../utils/helpers';
import { validateAndDebugJsonImport, generateSampleJsonStructure, suggestJsonFixes } from '../utils/jsonValidator';
import { Download, Upload, AlertCircle, Info, FileText, CheckCircle } from 'lucide-react';

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
      
      // Enhanced validation and debugging
      const validationResult = validateAndDebugJsonImport(text);
      
      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.join('; ');
        const suggestions = suggestJsonFixes(text);
        const suggestionText = suggestions.length > 0 ? `\n\nSuggestions:\n${suggestions.join('\n')}` : '';
        
        setImportError(`Import validation failed: ${errorMessages}${suggestionText}`);
        return;
      }

      if (validationResult.warnings.length > 0) {
        console.warn('Import completed with warnings:', validationResult.warnings);
      }

      if (validationResult.processedData) {
        onImport(validationResult.processedData);
        
        // Show success message with details
        const successMsg = `Successfully imported ${validationResult.processedData.length} entries${
          validationResult.warnings.length > 0 ? ` (${validationResult.warnings.length} warnings - check console)` : ''
        }`;
        
        // You might want to show this as a toast notification instead
        console.log('✅ Import successful:', successMsg);
      } else {
        setImportError('No valid data found in the imported file');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      console.error('Import error:', error);
      
      // Try to provide more helpful error messages
      if (errorMessage.includes('JSON')) {
        setImportError(`JSON parsing failed: ${errorMessage}. Please ensure your file contains valid JSON data.`);
      } else {
        setImportError(`Import failed: ${errorMessage}`);
      }
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
          <div className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:space-x-2">
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
            
            <button
              onClick={() => {
                const sampleData = generateSampleJsonStructure();
                const blob = new Blob([sampleData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'sample-salary-data.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <FileText className="w-4 h-4 mr-1" />
              Sample JSON
            </button>
          </div>
          
          {importError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Import Error</p>
                  <div className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{importError}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Import Guidelines:</p>
                <ul className="space-y-1">
                  <li>• JSON file should contain an array of entries or export format</li>
                  <li>• Each entry needs: year, month, category (salary/bonus/overtime/benefits)</li>
                  <li>• Salary entries need: salaryNet, swilePayment, transportPaid, worked</li>
                  <li>• Other entries need: amount</li>
                  <li>• Import will merge with existing data (duplicates by ID are skipped)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};