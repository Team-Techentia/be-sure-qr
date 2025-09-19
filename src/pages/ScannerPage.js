import React, { useState } from "react";
import Scanner from "../components/Scanner";

const ScannerPage = () => {
  const [scanHistory, setScanHistory] = useState([]);

  const handleCodeDetected = (data) => {
    console.log("ScannerPage received code data:", data);
    
    // Add to scan history
    const newScan = {
      id: Date.now(),
      code: data.code,
      type: data.type,
      timestamp: new Date().toLocaleString()
    };
    setScanHistory(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  return (
    <div className="card">
      <h1>Universal Code Scanner</h1>
      <p>Scan QR codes, barcodes, or enter codes manually to verify authenticity.</p>
      
      <Scanner onDetected={handleCodeDetected} />
      
      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Recent Scans ({scanHistory.length})</h3>
            <button 
              onClick={clearHistory}
              style={{
                padding: '5px 10px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear History
            </button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            {scanHistory.map((scan) => (
              <div key={scan.id} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{scan.type}:</strong> <code>{scan.code}</code>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {scan.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
