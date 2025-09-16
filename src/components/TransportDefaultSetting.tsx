import React, { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';

interface TransportDefaultSettingProps {
  selectedYear: number;
  getTransportDefault: (year: number) => number;
  setTransportDefault: (year: number, defaultValue: number) => void;
}

export const TransportDefaultSetting: React.FC<TransportDefaultSettingProps> = ({
  selectedYear,
  getTransportDefault,
  setTransportDefault
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultValue, setDefaultValue] = useState(0);
  const [tempValue, setTempValue] = useState(0);

  useEffect(() => {
    const currentDefault = getTransportDefault(selectedYear);
    setDefaultValue(currentDefault);
    setTempValue(currentDefault);
  }, [selectedYear, getTransportDefault]);

  const handleSave = () => {
    setTransportDefault(selectedYear, tempValue);
    setDefaultValue(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempValue(defaultValue);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setTempValue(defaultValue);
    setIsOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Transport Settings</h3>
        </div>
        {!isOpen && (
          <button
            onClick={handleOpen}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Transport Amount for {selectedYear}
          </label>
          
          {isOpen ? (
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  step="0.01"
                  value={tempValue}
                  onChange={(e) => setTempValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter default transport amount"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
              <span className="text-gray-900">€{defaultValue.toFixed(2)}</span>
              <span className="text-sm text-gray-500 ml-2">
                This amount will be pre-filled when adding new transport entries
              </span>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Note:</strong> The default transport amount will be automatically filled when adding new entries. 
            You can still modify it for individual entries as needed. This setting applies to all entries in {selectedYear}.
          </p>
        </div>
      </div>
    </div>
  );
};