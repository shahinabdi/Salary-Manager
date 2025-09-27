import React, { useState } from 'react';
import { validateAndDebugJsonImport, generateSampleJsonStructure } from '../utils/jsonValidator';
import { parseImportedData } from '../utils/helpers';

export const JsonImportTester: React.FC = () => {
  const [testJson, setTestJson] = useState('');
  const [result, setResult] = useState<string>('');

  const testImport = () => {
    try {
      console.log('🧪 Testing JSON Import...');
      
      // Test with validator
      const validationResult = validateAndDebugJsonImport(testJson);
      console.log('Validation result:', validationResult);
      
      // Test with original parser
      const parsedData = parseImportedData(testJson);
      console.log('Parsed data:', parsedData);
      
      setResult(`✅ Success! Processed ${parsedData.length} entries.
Validation warnings: ${validationResult.warnings.length}
Check console for detailed logs.`);
      
    } catch (error) {
      console.error('Import test failed:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadSampleJson = () => {
    setTestJson(generateSampleJsonStructure());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🧪 JSON Import Tester</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              JSON Data to Test
            </label>
            <button
              onClick={loadSampleJson}
              className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Load Sample
            </button>
          </div>
          <textarea
            value={testJson}
            onChange={(e) => setTestJson(e.target.value)}
            placeholder="Paste your JSON data here..."
            className="w-full h-64 p-3 border border-gray-300 rounded-md text-sm font-mono"
          />
          
          <button
            onClick={testImport}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Test Import
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Result
          </label>
          <div className="h-64 p-3 bg-gray-50 border border-gray-300 rounded-md overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">{result || 'No test run yet'}</pre>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Check the browser console (F12) for detailed validation logs and debugging information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};