'use client';
import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const QRImportPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Parse CSV with flexible header mapping
  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    // Find column indices (support multiple column name variations)
    const qrCodeIdIndex = headers.findIndex(h => 
      h === 'qrcodeid' || h === 'serial' || h === 'qr_code_id' || h === 'id'
    );
    const urlIndex = headers.findIndex(h => 
      h === 'url' || h === 'link' || h === 'redirect_url'
    );

    if (qrCodeIdIndex === -1 || urlIndex === -1) {
      throw new Error("CSV must have columns for QR Code ID (qrCodeId/Serial) and URL (url/Link)");
    }

    return lines.slice(1).map(line => {
      const cells = line.split(",").map(c => c.trim());
      return {
        qrCodeId: cells[qrCodeIdIndex],
        url: cells[urlIndex]
      };
    }).filter(row => row.qrCodeId && row.url);
  };

  // Read CSV file
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".csv")) {
      alert("Only CSV files are allowed");
      return;
    }

    // Check file size (warn if > 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      if (!confirm(`File is ${sizeMB}MB. Large files may take longer to process. Continue?`)) {
        return;
      }
    }

    setSelectedFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const text = e.target.result as string;
        const rows = text
          .trim()
          .split("\n")
          .slice(0, 6)
          .map(line => line.split(",").map(cell => cell.trim()));

        setPreviewData(rows);
      } catch (err: any) {
        alert("Error reading file: " + err.message);
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  };

  // Import with chunking for large files
  const handleImport = async () => {
    if (!selectedFile) {
      alert("Select a file first");
      return;
    }
    
    setImporting(true);
    setImportResult(null);
    setProgress({ current: 0, total: 0 });

    try {
      const text = await selectedFile.text();
      const allRows = parseCSV(text);

      if (allRows.length === 0) {
        throw new Error("No valid rows found in CSV");
      }

      setProgress({ current: 0, total: allRows.length });

      // For large imports, chunk the data
      const CHUNK_SIZE = 500; // Process 500 rows at a time
      const chunks: any[][] = [];
      
      for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
        chunks.push(allRows.slice(i, i + CHUNK_SIZE));
      }

      let totalSuccessful = 0;
      let totalFailed = 0;
      let allErrors: string[] = [];
      let allInsertedIds: string[] = [];

      // Process chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const res = await fetch("/api/qr/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chunk),
          });

          const data = await res.json();
          
          if (data.success) {
            totalSuccessful += (data.details?.successful || chunk.length);
            allInsertedIds.push(...(data.details?.insertedIds || []));
          }
          
          if (data.details?.errors) {
            allErrors.push(...data.details.errors);
          }
          
          if (data.details?.failed) {
            totalFailed += data.details.failed;
          }

          setProgress({ 
            current: Math.min((i + 1) * CHUNK_SIZE, allRows.length), 
            total: allRows.length 
          });

        } catch (err: any) {
          totalFailed += chunk.length;
          allErrors.push(`Chunk ${i + 1} failed: ${err.message}`);
        }
      }

      // Set final result
      setImportResult({
        success: totalSuccessful > 0,
        message: totalFailed === 0 
          ? `Successfully imported all ${totalSuccessful} QR codes`
          : `Import completed: ${totalSuccessful} succeeded, ${totalFailed} failed`,
        details: {
          successful: totalSuccessful,
          failed: totalFailed,
          errors: allErrors,
          insertedIds: allInsertedIds,
        }
      });
      
      if (totalSuccessful > 0 && totalFailed === 0) {
        setTimeout(() => {
          setSelectedFile(null);
          setPreviewData([]);
        }, 3000);
      }

    } catch (err: any) {
      setImportResult({ 
        success: false, 
        message: err.message || "Import failed" 
      });
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setProgress({ current: 0, total: 0 });
  };

  const downloadTemplate = () => {
    const headers = ["qrCodeId", "url"];
    const examples = [
      ["QR001", "https://example.com/page1"],
      ["QR002", "https://example.com/page2"],
      ["QR003", "https://example.com/page3"]
    ];
    const csvContent = [
      headers.join(","),
      ...examples.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import QR Codes</h1>
          <p className="text-gray-600">Upload a CSV file to bulk import QR codes</p>
        </div>

        {/* Download template */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Step 1: Download Template</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Download the CSV template to see the correct format. Your CSV should have columns: 
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">qrCodeId</code> (or Serial) and 
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">url</code> (or Link)
          </p>
          <button 
            onClick={downloadTemplate} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Download Template
          </button>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Step 2: Upload CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <FileSpreadsheet className="mx-auto mb-3 text-gray-400" size={48} />
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileSelect}
              disabled={importing}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-gray-500">
              Supported format: CSV only {selectedFile && `(${(selectedFile.size / 1024).toFixed(0)} KB)`}
            </p>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                <h4 className="font-semibold text-sm">Preview (first 5 rows)</h4>
                <span className="text-xs text-gray-500">
                  Total rows: ~{Math.max(0, previewData.length - 1)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {previewData[0].map((h: any, i: any) => (
                        <th key={i} className="border-b px-4 py-2 text-left font-semibold text-gray-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell: any, j: any) => (
                          <td key={j} className="border-b px-4 py-2 text-gray-600">
                            {cell || <span className="text-gray-400 italic">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {importing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing...</span>
                <span>{progressPercent}% ({progress.current} / {progress.total})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing || !selectedFile}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Import QR Codes
                </>
              )}
            </button>
            <button 
              onClick={reset} 
              disabled={importing}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Result */}
        {importResult && (
          <div className={`rounded-lg shadow-sm p-6 ${
            importResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
              ) : (
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  importResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {importResult.success ? 'Import Completed' : 'Import Failed'}
                </h3>
                <p className={importResult.success ? 'text-green-700' : 'text-red-700'}>
                  {importResult.message}
                </p>
                {importResult.details && (
                  <div className="mt-3 text-sm space-y-1">
                    <div className="flex gap-4">
                      <span className="text-green-700">✓ Successful: {importResult.details.successful || 0}</span>
                      {importResult.details.failed > 0 && (
                        <span className="text-red-700">✗ Failed: {importResult.details.failed}</span>
                      )}
                    </div>
                    {importResult.details.errors && importResult.details.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer font-medium text-red-800 hover:text-red-900">
                          View {importResult.details.errors.length} error(s)
                        </summary>
                        <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded p-3 border">
                          <ul className="space-y-1 text-xs">
                            {importResult.details.errors.slice(0, 50).map((err: any, i: number) => (
                              <li key={i} className="text-red-600">• {err}</li>
                            ))}
                            {importResult.details.errors.length > 50 && (
                              <li className="text-gray-500 italic">... and {importResult.details.errors.length - 50} more</li>
                            )}
                          </ul>
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRImportPage;