import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import formUI from "../assets/formUI.jpg";

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const barcode = queryParams.get("code");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setError("Name and Phone Number are required");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    navigate(`/success?code=${barcode}`);
  };

  return (
    <div className="card">
      <h1>Verify Product</h1>
      <p>Enter your details to verify the scanned product.</p>

      {/* Form UI Image */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img 
          src={formUI} 
          alt="Product Verification Form" 
          style={{ 
            maxWidth: '100%', 
            height: 'auto', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxHeight: '300px',
            objectFit: 'contain'
          }} 
        />
      </div>

      {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            value={phone}
            placeholder="Enter your phone number"
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button type="submit" className="btn">
          Verify
        </button>
      </form>
    </div>
  );
};

export default VerificationPage;
