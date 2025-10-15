"use client"
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQR } from '@/hooks/useQR';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  mobile: string;
}

type VerificationResult = 'valid' | 'invalid' | null;

const ProductVerificationPage: React.FC = () => {
  const searchParams = useSearchParams();
  

  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobile: ''
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

  const MAX_SCANS = parseInt(process.env.NEXT_PUBLIC_MAX_LIMIT || '10', 10);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault();

  if (!formData.name.trim() || !formData.mobile.trim()) {
    toast.error("Kindly enter your details");
    return;
  }

  if (!/^\d{10}$/.test(formData.mobile.trim())) {
    toast.error("Kindly enter a valid mobile number");
    return;
  }

  const qrCodeId = searchParams?.get('id');
  if (!qrCodeId) {
    toast.error("Not a valid QR id");
    return;
  }

  setIsSubmitting(true);

  // ✅ Check scan count
  const result = await verifyQR(qrCodeId, true); // Pass flag to get count only
  if (result.total >= MAX_SCANS) {
    toast.error(`This QR code has reached the maximum limit of ${MAX_SCANS} scans`);
    setIsSubmitting(false);
    setVerificationResult('invalid');
    return;
  }

  // ✅ Proceed with verification
  // const result = await verifyQR(qrCodeId);
  console.log(result)
  if (result.valid) {
    setVerificationResult('valid');
    setSerialNumber(qrCodeId);
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

  const verifyQR = async (qrCodeId: string, countOnly = false) => {
  try {
    const response = await fetch(`/api/qr/verify/${qrCodeId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const res = await response.json();
    
    return { valid: res.data.valid, total: res.data.count };
  } catch (error) {

    return { valid: false, total: 0 }; 
  }
};

  return (
    <div className="h-max relative max-w-md w-full mx-auto bg-gray-100 flex flex-col items-center justify-center gap-2 p-2">
      <div className="relative bg-blue-800 rounded-3xl p-2.5 border-blue-800">
        <div className="absolute top-0 right-0 w-32 h-32 border-t-10 border-r-10 border-red-500 rounded-tr-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-10 border-l-10 border-red-500 rounded-bl-3xl"></div>

        {/* Inner content */}
        <div className="relative bg-white rounded-2xl shadow-lg">
          {/* <div className="h-4 bg-gradient-to-r from-blue-500 via-white to-red-500"></div> */}

          <div className="p-2.5">
            <img
              src="/product.jpg"
              alt="Product"
              className="w-full h-auto rounded-lg"
            />
          </div>

          {
            verificationResult == "invalid" ?
              <div className="p-2.5 flex flex-col items-center text-center">
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
              </div> :
              verificationResult === "valid" ?
                <div className="p-2.5 pt-0 flex flex-col items-center text-center">
                  {/* <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div> */}
                  <img
                    src="/tick.png"
                    alt="Product"
                    className="w-20 h-auto mb-2 rounded-lg"
                  />
                  <h3 className="text-green-600 text-lg font-semibold mb-2">
                    Thank you for buying original VITUM-H Product of TINETA.
                  </h3>
                  <div className="mb-4">
                    <p className="text-gray-700 font-semibold">Serial No. : {serialNumber}</p>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Discover our complete range of products on
                  </p>
                  <a href="https://tineta.com/" className="text-blue-500 text-sm">
                    https://tineta.com/
                  </a>
                </div> :
                <div className="p-2.5">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
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
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>

                    <p className="text-blue-800 text-center text-sm">
                      All fields are mandatory
                    </p>

                    <div className="w-full flex justify-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-max mx-auto bg-red-500 hover:bg-red-600 text-[15px] text-white py-1 px-2 rounded-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'VERIFYING...' : 'SUBMIT'}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-800 text-sm">
                      By Continuing You Accept Our{' '}
                      <a href="#" className="text-blue-500 underline">Terms</a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-500 underline">Privacy Policy</a>
                    </p>
                  </div>
                </div>
          }

        </div>
      </div >
      <div className="py-2 text-center">
        <div className="w-full text-gray-500 text-sm flex justify-center mb-3 items-center gap-1">
          Powered by
          <img
            src="/besure.png"
            alt="Product"
            className="w-20 h-auto rounded-lg"
          />
        </div>
        <p className='text-sm'>Subject to <span className="text-blue-500">Terms and Conditions</span></p>
      </div>
    </div>
  );
};

export default ProductVerificationPage;