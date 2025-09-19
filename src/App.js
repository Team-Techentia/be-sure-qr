import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ScannerPage from "./pages/ScannerPage";
import VerificationPage from "./pages/VerificationPage";
import SuccessPage from "./pages/SuccessPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <Link to="/" className="logo">
            VITUM-H Verify
          </Link>
        </header>

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ScannerPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/success" element={<SuccessPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Tineta | Product Verification</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
