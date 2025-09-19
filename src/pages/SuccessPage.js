import React from "react";
import { useLocation } from "react-router-dom";
import formUI from "../assets/formUI.jpg";

const SuccessPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const barcode = queryParams.get("code");

  return (
    <div className="card">
      {/* Form UI Image */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img 
          src={formUI} 
          alt="Product Verification Success" 
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

      <div className="success-icon">✔</div>
      <div className="success-text">Thank you for buying original VITUM-H Product of TINETA.</div>
      <div className="success-details">
        <p>Barcode Number: <strong>{barcode}</strong></p>
      </div>
    </div>
  );
};

export default SuccessPage;
