"use client"
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQR } from '@/hooks/useQR';

interface FormData {
  name: string;
  mobile: string;
}

type VerificationResult = 'valid' | 'invalid' | null;

const ProductVerificationPage: React.FC = () => {
  const searchParams = useSearchParams();
  const { verifyQR } = useQR();
  
  const [formData, setFormData] = useState<FormData>({
    name: 'Test',
    mobile: '1234567890'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult>(null);
  const [serialNumber, setSerialNumber] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.mobile.trim()) {
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      return;
    }

    // Get QR code ID from URL search parameters
    const qrCodeId = searchParams?.get('id');
    
    if (!qrCodeId) {
      return;
    }

    setIsSubmitting(true);

    const result = await verifyQR(qrCodeId);
    
    if (result.valid) {
      setVerificationResult('valid');
      setSerialNumber((Math.floor(Math.random() * 900000) + 100000).toString());
    } else {
      setVerificationResult('invalid');
    }
    
    setIsSubmitting(false);
  };

  const resetForm = (): void => {
    setFormData({ name: '', mobile: '' });
    setVerificationResult(null);
    setSerialNumber('');
  };

  // Valid result screen
  if (verificationResult === 'valid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-sm w-full border-8 border-red-500 relative">
          <div className="h-4 bg-gradient-to-r from-blue-500 via-white to-red-500"></div>
          
          <div className="p-4">
            <img 
              src="/product.jpg" 
              alt="Product" 
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-green-600 text-lg font-semibold mb-2">
              Thank you for buying original VITUM-H Product of TINETA.
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 font-semibold">Serial No. : {serialNumber}</p>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              Discover our complete range of products on
            </p>
            <a href="https://tineta.com/" className="text-blue-500 underline text-sm">
              https://tineta.com/
            </a>
            
            <button 
              onClick={resetForm}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Verify Another Product
            </button>
          </div>

          <div className="bg-gray-100 py-2 text-center">
            <p className="text-gray-500 text-xs">Powered by <span className="font-semibold">BeSure</span></p>
            <p className="text-blue-500 text-xs underline">Subject to Terms and Conditions</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid result screen
  if (verificationResult === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-sm w-full border-8 border-red-500 relative">
          <div className="h-4 bg-gradient-to-r from-blue-500 via-white to-red-500"></div>
          
          <div className="p-4">
            <img 
              src="/product.jpg" 
              alt="Product" 
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-red-600 text-lg font-medium">
              This might not be a genuine product, please contact customer care
            </p>
            
            <button 
              onClick={resetForm}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>

          <div className="bg-gray-100 py-2 text-center">
            <p className="text-gray-500 text-xs">Powered by <span className="font-semibold">BeSure</span></p>
            <p className="text-blue-500 text-xs underline">Subject to Terms and Conditions</p>
          </div>
        </div>
      </div>
    );
  }

  // Main form screen
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-sm w-full border-8 border-red-500 relative">
        <div className="h-4 bg-gradient-to-r from-blue-500 via-white to-red-500"></div>
        
        <div className="p-4">
          <img 
            src="/product.jpg" 
            alt="Product" 
            className="w-full h-auto rounded-lg"
          />
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                required
              />
            </div>
            
            <div>
              <input
                type="tel"
                name="mobile"
                placeholder="Enter mobile Number"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                maxLength={10}
                pattern="[0-9]{10}"
                required
              />
            </div>

            <p className="text-blue-600 text-center text-sm font-medium">
              All fields are mandatory
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'VERIFYING...' : 'SUBMIT'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              By Continuing You Accept Our{' '}
              <a href="#" className="text-blue-500 underline">Terms</a>{' '}
              and{' '}
              <a href="#" className="text-blue-500 underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        <div className="bg-gray-100 py-2 text-center">
          <p className="text-gray-500 text-xs">Powered by <span className="font-semibold">BeSure</span></p>
          <p className="text-blue-500 text-xs underline">Subject to Terms and Conditions</p>
        </div>
      </div>
    </div>
  );
};

export default ProductVerificationPage;