import React, { useState } from 'react';
import { YearlyData } from '../types';
import { validateAndDebugJsonImport } from '../utils/jsonValidator';

interface ImportDebuggerProps {
  currentData: YearlyData[];
  selectedYear: number;
}

export const ImportDebugger: React.FC<ImportDebuggerProps> = ({ currentData, selectedYear }) => {
  const [debugInfo, setDebugInfo] = useState<string>('');

  const debugImport = () => {
    const testJsonString = `{
      "exportDate": "2025-09-29T23:14:15.112Z",
      "yearlyData": [
        {
          "category": "salary",
          "year": 2025,
          "month": 3,
          "amount": 2298.83,
          "salaryNet": 2298.83,
          "swilePayment": 162,
          "transportPaid": true,
          "worked": true,
          "notes": "",
          "id": "1759187487336-ddj2f71c1",
          "createdAt": "2025-09-29T23:11:27.336Z",
          "updatedAt": "2025-09-29T23:11:35.580Z"
        },
        {
          "category": "salary",
          "year": 2025,
          "month": 4,
          "amount": 2458.39,
          "salaryNet": 2458.39,
          "swilePayment": 210,
          "transportPaid": true,
          "worked": true,
          "notes": "",
          "id": "1759187510875-ary6088zf",
          "createdAt": "2025-09-29T23:11:50.875Z",
          "updatedAt": "2025-09-29T23:12:06.098Z"
        },
        {
          "category": "salary",
          "year": 2025,
          "month": 5,
          "amount": 2565.58,
          "salaryNet": 2565.58,
          "swilePayment": 170,
          "transportPaid": true,
          "worked": true,
          "notes": "",
          "id": "1759187542280-0lga76kje",
          "createdAt": "2025-09-29T23:12:22.280Z",
          "updatedAt": "2025-09-29T23:12:22.280Z"
        },
        {
          "category": "salary",
          "year": 2025,
          "month": 6,
          "amount": 2360.4,
          "salaryNet": 2360.4,
          "swilePayment": 200,
          "transportPaid": true,
          "worked": true,
          "notes": "",
          "id": "1759187559222-1uvdf8de5",
          "createdAt": "2025-09-29T23:12:39.222Z",
          "updatedAt": "2025-09-29T23:12:39.222Z"
        },
        {
          "category": "salary",
          "year": 2025,
          "month": 7,
          "amount": 2703.26,
          "salaryNet": 2703.26,
          "swilePayment": 220,
          "transportPaid": false,
          "worked": true,
          "notes": "",
          "id": "1759187590952-y4b490nzl",
          "createdAt": "2025-09-29T23:13:10.952Z",
          "updatedAt": "2025-09-29T23:13:10.952Z"
        },
        {
          "category": "salary",
          "year": 2025,
          "month": 8,
          "amount": 2520.18,
          "salaryNet": 2520.18,
          "swilePayment": 160,
          "transportPaid": false,
          "worked": true,
          "notes": "",
          "id": "1759187603887-bvjt3h6kc",
          "createdAt": "2025-09-29T23:13:23.887Z",
          "updatedAt": "2025-09-29T23:13:32.393Z"
        },
        {
          "category": "salary",
          "year": 2025,
          "month": 9,
          "amount": 2648.11,
          "salaryNet": 2648.11,
          "swilePayment": 0,
          "transportPaid": false,
          "worked": true,
          "notes": "",
          "id": "1759187627869-io4aa5mw6",
          "createdAt": "2025-09-29T23:13:47.869Z",
          "updatedAt": "2025-09-29T23:13:47.869Z"
        }
      ],
      "summary": {
        "totalEntries": 7,
        "totalSalary": 17554.75,
        "totalSwilePayments": 1122,
        "totalTransportPayments": 0
      }
    }`;

    const validationResult = validateAndDebugJsonImport(testJsonString);
    
    let debugOutput = `🔍 IMPORT DEBUGGING RESULTS\\n\\n`;
    debugOutput += `📊 Current Data State:\\n`;
    debugOutput += `- Total entries in app: ${currentData.length}\\n`;
    debugOutput += `- Selected year: ${selectedYear}\\n`;
    debugOutput += `- Entries for selected year: ${currentData.filter(item => item.year === selectedYear).length}\\n\\n`;
    
    debugOutput += `📥 Import Analysis:\\n`;
    debugOutput += `- Import valid: ${validationResult.isValid}\\n`;
    debugOutput += `- Errors: ${validationResult.errors.length}\\n`;
    debugOutput += `- Warnings: ${validationResult.warnings.length}\\n`;
    debugOutput += `- Processed entries: ${validationResult.processedData?.length || 0}\\n\\n`;
    
    if (validationResult.processedData) {
      debugOutput += `📅 Import Data Analysis:\\n`;
      validationResult.processedData.forEach((entry, index) => {
        debugOutput += `Entry ${index + 1}: ${entry.year}-${entry.month.toString().padStart(2, '0')} (${entry.category}) ID: ${entry.id}\\n`;
      });
      
      debugOutput += `\\n🔍 Duplicate Check:\\n`;
      const existingIds = new Set(currentData.map(item => item.id));
      const duplicateEntries = validationResult.processedData.filter(item => existingIds.has(item.id));
      const newEntries = validationResult.processedData.filter(item => !existingIds.has(item.id));
      
      debugOutput += `- Total current entries in app: ${currentData.length}\\n`;
      debugOutput += `- Entries in JSON to import: ${validationResult.processedData.length}\\n`;
      debugOutput += `- Duplicate entries (same ID): ${duplicateEntries.length}\\n`;
      debugOutput += `- New entries to import: ${newEntries.length}\\n`;
      
      if (duplicateEntries.length > 0) {
        debugOutput += `\\n🔄 Duplicate Entries (will be skipped):\\n`;
        duplicateEntries.forEach(entry => {
          debugOutput += `   - ${entry.year}-${entry.month.toString().padStart(2, '0')} (ID: ${entry.id})\\n`;
        });
      }
      
      if (newEntries.length === 0) {
        debugOutput += `\\n⚠️  ALL ENTRIES ALREADY EXIST - This is why only existing data shows!\\n`;
        debugOutput += `\\nSOLUTION: Your JSON contains the same data you exported earlier.\\n`;
        debugOutput += `The app prevents duplicate imports by checking entry IDs.\\n`;
        debugOutput += `If you want to re-import, either:\\n`;
        debugOutput += `1. Clear your current data first, or\\n`;
        debugOutput += `2. Create new entries with different data\\n`;
      } else {
        debugOutput += `\\n✅ These NEW entries will be imported:\\n`;
        newEntries.forEach(entry => {
          debugOutput += `   - ${entry.year}-${entry.month.toString().padStart(2, '0')} (ID: ${entry.id})\\n`;
        });
      }
    }
    
    if (validationResult.errors.length > 0) {
      debugOutput += `\\n❌ Errors:\\n${validationResult.errors.join('\\n')}\\n`;
    }
    
    if (validationResult.warnings.length > 0) {
      debugOutput += `\\n⚠️  Warnings:\\n${validationResult.warnings.join('\\n')}\\n`;
    }

    setDebugInfo(debugOutput);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">🔧 Import Debugger</h3>
        <button
          onClick={debugImport}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
        >
          Debug Import
        </button>
      </div>
      
      {debugInfo && (
        <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-line max-h-64 overflow-y-auto">
          {debugInfo}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-600">
        This tool analyzes why your import might not be working as expected.
      </div>
    </div>
  );
};