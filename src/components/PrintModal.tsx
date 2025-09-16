import React, { useState } from 'react';
import { Printer, X, FileText, Download, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import { PrintView } from './PrintView';
import { YearlyData } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: YearlyData[];
  selectedYear: number;
  statistics: {
    totalEntries: number;
    workedMonths: number;
    notWorkedMonths: number;
    totalSalary: number;
    totalSwilePayments: number;
    averageSalary: number;
    paidTransportCount: number;
    unpaidTransportCount: number;
  };
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedYear,
  statistics
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Salary Report ${selectedYear}</title>
            <meta charset="utf-8">
            <style>
              * { box-sizing: border-box; }
              body { 
                font-family: system-ui, -apple-system, sans-serif;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.4;
              }
              .print-view { 
                padding: 20px; 
                max-width: none;
                background: white;
                color: black;
              }
              @media print {
                body { margin: 0; }
                .print-view { padding: 0; }
                .no-print { display: none !important; }
                .page-break { page-break-before: always; }
                .avoid-break { page-break-inside: avoid; }
              }
              @page {
                margin: 1in;
                size: A4;
              }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #666; padding: 6px; font-size: 11px; }
              th { background: #f0f0f0; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .font-medium { font-weight: 500; }
              .mb-4 { margin-bottom: 16px; }
              .mb-2 { margin-bottom: 8px; }
              .p-4 { padding: 16px; }
              .p-2 { padding: 8px; }
              .grid { display: grid; gap: 16px; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              .rounded-lg { border-radius: 8px; }
              .border { border: 1px solid #ccc; }
              .bg-green-50 { background-color: #f0f9ff; }
              .bg-purple-50 { background-color: #fdf4ff; }
              .bg-orange-50 { background-color: #fff7ed; }
              .bg-blue-50 { background-color: #eff6ff; }
              .bg-gray-50 { background-color: #f9fafb; }
              .bg-gray-100 { background-color: #f3f4f6; }
              .bg-gray-200 { background-color: #e5e7eb; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDownloadPDF = async () => {
    // For a full PDF solution, you'd typically use a library like jsPDF or puppeteer
    // For now, we'll trigger the browser's print dialog with save as PDF option
    alert('Please use your browser\'s Print function and select "Save as PDF" as the destination.');
    handlePrint();
  };

  const handleSaveAsImage = async () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) {
      alert('Print content not found');
      return;
    }

    try {
      setIsGeneratingImage(true);
      
      const canvas = await html2canvas(printContent, {
        useCORS: true,
        allowTaint: true
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `salary-report-${selectedYear}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        setIsGeneratingImage(false);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Salary Report - {selectedYear}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {isPreviewMode ? 'Exit Preview' : 'Preview'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            <button
              onClick={handleSaveAsImage}
              disabled={isGeneratingImage}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image className="w-4 h-4 mr-1" />
              {isGeneratingImage ? 'Generating...' : 'Image'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div id="print-content">
            <PrintView 
              data={data} 
              selectedYear={selectedYear} 
              statistics={statistics} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              Report generated for {statistics.totalEntries} entries • {statistics.workedMonths} worked months
            </div>
            <div>
              Use Ctrl+P or Cmd+P for quick printing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};