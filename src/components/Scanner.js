import Quagga from "quagga";
import QrScanner from "qr-scanner";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Scanner = ({ onDetected }) => {
  const navigate = useNavigate();
  
  // Refs
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const qrScannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  // State
  const [scannedCode, setScannedCode] = useState(null);
  const [flash, setFlash] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanMode, setScanMode] = useState("auto");
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const stopAllScanners = useCallback(() => {
    try {
      // Stop QR Scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
      
      // Stop Quagga Scanner
      if (Quagga.running) {
        Quagga.stop();
      }
      
      // Clear all event listeners
      try {
        Quagga.offDetected();
        Quagga.offProcessed();
      } catch (e) {
        // Ignore errors if listeners weren't set
      }
      
      // Clear timeouts and intervals
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      
      console.log("All scanners stopped and cleaned up");
    } catch (e) {
      console.warn("Error stopping scanners:", e);
    }
  }, []);

  const handleTimeout = useCallback(() => {
    console.log("Scan timeout reached");
    setIsScanning(false);
    setScanComplete(true);
    setError("Scan timeout - No code detected in 15 seconds. Try adjusting lighting or code position.");
    stopAllScanners();
  }, [stopAllScanners]);

  // Countdown timer effect
  useEffect(() => {
    if (isScanning && timeLeft > 0) {
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isScanning, timeLeft, handleTimeout]);

  const handleCodeDetected = useCallback((code, type) => {
    console.log(`=== ${type.toUpperCase()} DETECTED ===`);
    console.log("Code:", code);
    console.log("Type:", type);

    // Mark as scanned to prevent timeout
    hasScannedRef.current = true;

    // Stop all scanners immediately
    stopAllScanners();
    setIsScanning(false);
    setScanComplete(true);
    setTimeLeft(0);

    setScannedCode({ code, type });
    setFlash(true);

    if (onDetected) {
      onDetected({ code, type });
    }

    // Navigate to verify page after a brief delay to show the success message
    setTimeout(() => {
      navigate(`/verify?code=${encodeURIComponent(code)}`);
    }, 2000);

    // Remove flash after 2 seconds
    setTimeout(() => setFlash(false), 2000);
  }, [onDetected, stopAllScanners, navigate]);

  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraList(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error getting camera list:", error);
    }
  }, []);

  const initializeQRScanner = useCallback(async () => {
    try {
      if (!videoRef.current) return;

      console.log("Initializing QR Scanner...");
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("QR Code detected:", result);
          handleCodeDetected(result.data, "QR Code");
        },
        {
          onDecodeError: (error) => {
            // Don't log every decode error as it's too verbose
            if (error.includes("No QR code found")) return;
            console.log("QR decode error:", error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScannerRef.current.start();
      console.log("QR Scanner started successfully");
      return true;
    } catch (error) {
      console.error("QR Scanner initialization failed:", error);
      return false;
    }
  }, [handleCodeDetected]);

  const initializeBarcodeScanner = useCallback(async () => {
    try {
      if (!scannerRef.current) return false;

      console.log("Initializing Barcode Scanner...");
      
      return new Promise((resolve) => {
        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              target: scannerRef.current,
              constraints: {
                facingMode: selectedCamera ? undefined : { ideal: "environment" },
                deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                width: { min: 320, ideal: 640, max: 1280 },
                height: { min: 240, ideal: 480, max: 720 }
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true
            },
            numOfWorkers: navigator.hardwareConcurrency || 2,
            frequency: 10,
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader",
                "2of5_reader",
                "code_93_reader"
              ]
            },
            locate: true
          },
          (err) => {
            if (err) {
              console.error("Barcode Scanner initialization failed:", err);
              resolve(false);
              return;
            }
            
            Quagga.start();
            Quagga.onDetected((result) => {
              if (result.codeResult && result.codeResult.code) {
                console.log("Barcode detected:", result.codeResult.code);
                handleCodeDetected(result.codeResult.code, "Barcode");
              }
            });
            
            console.log("Barcode Scanner started successfully");
            resolve(true);
          }
        );
      });
    } catch (error) {
      console.error("Barcode Scanner setup error:", error);
      return false;
    }
  }, [selectedCamera, handleCodeDetected]);

  const startScanning = useCallback(async () => {
    try {
      setIsRetrying(true);
      setError(null);
      setScannedCode(null);
      setScanComplete(false);
      setTimeLeft(15);
      setIsScanning(true);
      hasScannedRef.current = false;

      // Check camera access first and get the stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: selectedCamera ? undefined : { ideal: "environment" },
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 }
        }
      });

      console.log("Camera access granted, stream obtained:", stream);
      
      // Set the video element source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        console.log("Video element configured with camera stream");
      }

      let success = false;

      if (scanMode === "qr") {
        success = await initializeQRScanner();
      } else if (scanMode === "barcode") {
        success = await initializeBarcodeScanner();
      } else if (scanMode === "auto") {
        // Try QR first, then barcode if QR fails
        success = await initializeQRScanner();
        if (!success) {
          success = await initializeBarcodeScanner();
        }
      }

      if (!success) {
        throw new Error("Failed to initialize any scanner");
      }

      setIsInitialized(true);
      setIsRetrying(false);

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        if (!hasScannedRef.current) {
          handleTimeout();
        }
      }, 15000);

    } catch (error) {
      console.error("Scanner initialization error:", error);
      setIsRetrying(false);
      setIsScanning(false);
      
      if (error.name === 'NotAllowedError') {
        setError("Camera access denied. Please allow camera permission and refresh the page.");
      } else if (error.name === 'NotFoundError') {
        setError("No camera found. Please connect a camera and refresh the page.");
      } else if (error.name === 'NotReadableError') {
        setError("Camera is already in use by another application. Please close other camera apps and refresh the page.");
      } else if (error.name === 'OverconstrainedError') {
        setError("Camera doesn't support the required resolution. Trying with basic settings...");
        // Retry with basic constraints
        setTimeout(async () => {
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream;
              videoRef.current.play();
            }
            setIsRetrying(false);
            setIsScanning(true);
            setIsInitialized(true);
          } catch (basicError) {
            setError(`Camera error: ${basicError.message}`);
          }
        }, 1000);
        return; // Don't set error message for this case
      } else {
        setError(`Scanner error: ${error.message}`);
      }
    }
  }, [scanMode, selectedCamera, initializeQRScanner, initializeBarcodeScanner, handleTimeout]);

  const resetScanner = useCallback(() => {
    stopAllScanners();
    setScannedCode(null);
    setError(null);
    setTimeLeft(15);
    setIsScanning(false);
    setScanComplete(false);
    setFlash(false);
    setIsInitialized(false);
    setIsRetrying(false);
    hasScannedRef.current = false;
    
    // Restart scanning after a brief delay
    setTimeout(() => {
      startScanning();
    }, 100);
  }, [stopAllScanners, startScanning]);

  const handleManualSubmit = useCallback(() => {
    if (manualInput.trim()) {
      handleCodeDetected(manualInput.trim(), "Manual Input");
      setManualInput("");
      setShowManualInput(false);
    }
  }, [manualInput, handleCodeDetected]);

  const testCamera = useCallback(async () => {
    try {
      console.log("Testing camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera test successful:", stream);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        console.log("Video element updated with test stream");
      }
      
      // Stop the test stream after 3 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        console.log("Test stream stopped");
      }, 3000);
      
    } catch (error) {
      console.error("Camera test failed:", error);
      setError(`Camera test failed: ${error.message}`);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    getAvailableCameras();
    startScanning();

    return () => {
      stopAllScanners();
    };
  }, [getAvailableCameras, startScanning, stopAllScanners]);

  // Restart scanner when scan mode changes
  useEffect(() => {
    if (isInitialized) {
      console.log("Scan mode changed, restarting scanner...");
      stopAllScanners();
      setTimeout(() => {
        startScanning();
      }, 200);
    }
  }, [scanMode, isInitialized, stopAllScanners, startScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllScanners();
    };
  }, [stopAllScanners]);

  return (
    <div className="scanner-container">
      {/* Scanner Controls */}
      <div className="scanner-controls">
        <div className="scan-mode-selector">
          <label>
            <input
              type="radio"
              value="auto"
              checked={scanMode === "auto"}
              onChange={(e) => setScanMode(e.target.value)}
              disabled={isScanning}
            />
            Auto (QR + Barcode)
          </label>
          <label>
            <input
              type="radio"
              value="qr"
              checked={scanMode === "qr"}
              onChange={(e) => setScanMode(e.target.value)}
              disabled={isScanning}
            />
            QR Code Only
          </label>
          <label>
            <input
              type="radio"
              value="barcode"
              checked={scanMode === "barcode"}
              onChange={(e) => setScanMode(e.target.value)}
              disabled={isScanning}
            />
            Barcode Only
          </label>
        </div>

        {cameraList.length > 1 && (
          <div className="camera-selector">
            <label>Camera: </label>
            <select
              value={selectedCamera || ""}
              onChange={(e) => setSelectedCamera(e.target.value)}
              disabled={isScanning}
            >
              {cameraList.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timer Display */}
      {isScanning && (
        <div className={`timer-display ${timeLeft <= 5 ? 'timer-warning' : ''}`}>
          ⏱️ {timeLeft} seconds remaining
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-display">
          <strong>⚠️ Error:</strong> {error}
          {scanComplete && (
            <button onClick={resetScanner} className="retry-button">
              🔄 Try Again
            </button>
          )}
        </div>
      )}

      {/* Manual Input Option */}
      {!isScanning && !scannedCode && (
        <div className="manual-input-section">
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="manual-input-toggle"
            >
              {showManualInput ? "Hide" : "Show"} Manual Input
            </button>
            <button
              onClick={testCamera}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              📷 Test Camera
            </button>
          </div>
          {showManualInput && (
            <div className="manual-input-form">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter code manually..."
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                Submit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scanner View */}
      <div className={`scanner-box ${flash ? "scanner-flash" : ""}`}>
        <p>Point your camera at the code to scan</p>
        
        {!isInitialized && !error && (
          <div className="status-message">
            {isRetrying ? "Retrying..." : "Initializing camera..."}
            <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#666' }}>
              Check browser console for detailed logs
            </div>
          </div>
        )}

        {/* Scanner View - Only one scanner at a time */}
        <div className="scanner-view">
          {/* QR Scanner Video */}
          {scanMode === "qr" && (
            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          
          {/* Barcode Scanner */}
          {scanMode === "barcode" && (
            <div ref={scannerRef} style={{ width: "100%", height: "100%", position: "relative" }}></div>
          )}
          
          {/* Auto mode - show video for QR, div for barcode */}
          {scanMode === "auto" && (
            <>
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div ref={scannerRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, opacity: 0 }}></div>
            </>
          )}
          
          {/* Focus indicators */}
          {isScanning && (
            <div className="focus-indicator">
              <div className="scan-frame"></div>
              {scanMode === "barcode" && <div className="scan-line"></div>}
            </div>
          )}
        </div>
      </div>

      {/* Success Display */}
      {scannedCode && (
        <div className="success-display">
          <div className="success-icon">✅</div>
          <h3>Code Scanned Successfully!</h3>
          <div className="scanned-details">
            <p><strong>Type:</strong> {scannedCode.type}</p>
            <p><strong>Code:</strong> <code>{scannedCode.code}</code></p>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={resetScanner} className="scan-again-button">
              🔄 Scan Another Code
            </button>
            <button 
              onClick={() => navigate(`/verify?code=${encodeURIComponent(scannedCode.code)}`)}
              style={{
                padding: '12px 24px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'background 0.2s'
              }}
            >
              ✅ Verify This Code
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {isInitialized && !error && !scanComplete && (
        <div className="instructions">
          <p>📱 Position the code within the frame and hold steady</p>
          <p>💡 Ensure good lighting and avoid reflections</p>
        </div>
      )}
    </div>
  );
};

export default Scanner;