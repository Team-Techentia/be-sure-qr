// @/lib/api/qr.ts
import axiosClient from "../client/axios";
import { ApiResponse, CreateQRFormData, QRType, UpdateQRFormData } from "@/lib/types";

// Helper function to handle API errors
const handleApiError = (error: any, operation: string) => {
  let errorMessage = `Failed to ${operation}`;
  
  if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        errorMessage = `Bad request: Invalid data provided for ${operation}`;
        break;
      case 401:
        errorMessage = "Unauthorized: Please login again";
        break;
      case 403:
        errorMessage = "Forbidden: You don't have permission to perform this action";
        break;
      case 404:
        errorMessage = `QR code not found`;
        break;
      case 409:
        errorMessage = "QR code already exists";
        break;
      case 429:
        errorMessage = "Too many requests: Please try again later";
        break;
      case 500:
        errorMessage = "Server error: Please try again later";
        break;
      default:
        errorMessage = `${operation} failed with status ${error.response.status}`;
    }
  } else if (error?.code === 'NETWORK_ERROR') {
    errorMessage = "Network error: Please check your internet connection";
  } else if (error?.message) {
    errorMessage = error.message;
  }

  // Don't show toast here as it's handled in the hooks
  throw new Error(errorMessage);
};

export const qrAPI = {
  create: async (data: CreateQRFormData) => {
    try {      
      return await axiosClient.post<ApiResponse<QRType>>("/admin/qr", data);
    } catch (error) {
      handleApiError(error, "create QR code");
    }
  },

  list: async () => {
    try {
      return await axiosClient.get<ApiResponse<QRType[]>>("/admin/qr");
    } catch (error) {
      handleApiError(error, "fetch QR codes");
    }
  },

  getById: async (qrCodeId: string) => {
    try {
      if (!qrCodeId?.trim()) {
        throw new Error("QR Code ID is required");
      }
      
      return await axiosClient.get<ApiResponse<QRType>>(`/admin/qr/${qrCodeId}`);
    } catch (error) {
      handleApiError(error, "fetch QR code");
    }
  },

  update: async (qrCodeId: string, data: UpdateQRFormData) => {
    try {
      if (!qrCodeId?.trim()) {
        throw new Error("QR Code ID is required");
      }
      
      return await axiosClient.put<ApiResponse<QRType>>(`/admin/qr/${qrCodeId}`, data);
    } catch (error) {
      handleApiError(error, "update QR code");
    }
  },

  softDelete: async (qrCodeId: string) => {
    try {
      if (!qrCodeId?.trim()) {
        throw new Error("QR Code ID is required");
      }
      
      return await axiosClient.delete<ApiResponse<null>>(`/admin/qr/${qrCodeId}`);
    } catch (error) {
      handleApiError(error, "delete QR code");
    }
  },

  verify: async (qrCodeId: string) => {
    try {
      if (!qrCodeId?.trim()) {
        throw new Error("QR Code ID is required");
      }
      
      return await axiosClient.get<ApiResponse<{ valid: boolean; qrCodeId: string; url: string }>>(
        `/qr/verify/${qrCodeId}`
      );
    } catch (error) {
      handleApiError(error, "verify QR code");
    }
  },
};