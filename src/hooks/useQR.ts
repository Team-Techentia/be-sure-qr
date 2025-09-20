// @/hooks/useQR.ts
import { useState, useCallback } from "react";
import { qrAPI } from "@/lib/api";
import { QRType, CreateQRFormData, UpdateQRFormData } from "@/lib/types";
import toast from "react-hot-toast";

export function useQR() {
    const [qrs, setQrs] = useState<QRType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to extract error message
    const getErrorMessage = (error: any): string => {
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }
        if (error?.message) {
            return error.message;
        }
        return "An unexpected error occurred";
    };

    // Fetch all QRs
    const fetchQRs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await qrAPI.list();
            const qrData = response?.data.data || [];

            setQrs(qrData);
            return qrData;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            toast.error(`Failed to fetch QR codes: ${errorMessage}`);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create a new QR
    const createQR = useCallback(async (formData: CreateQRFormData) => {
        if (!formData.qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return false;
        }

        try {
            await qrAPI.create(formData);

            toast.success("QR code created successfully ✅");

            // Refresh the list
            await fetchQRs();
            return true;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to create QR code: ${errorMessage}`);
            setError(errorMessage);
            return false;
        }
    }, [fetchQRs]);

    // Update an existing QR
    const updateQR = useCallback(async (qrCodeId: string, updateData: UpdateQRFormData) => {
        if (!qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return false;
        }

        try {
            await qrAPI.update(qrCodeId, updateData);

            toast.success("QR code updated successfully ✅");

            // Refresh the list
            await fetchQRs();
            return true;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to update QR code: ${errorMessage}`);
            setError(errorMessage);
            return false;
        }
    }, [fetchQRs]);

    // Delete a QR (soft delete)
    const deleteQR = useCallback(async (qrCodeId: string) => {
        if (!qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return false;
        }

        try {
            await qrAPI.softDelete(qrCodeId);

            toast.success("QR code deleted successfully ✅");

            // Refresh the list
            await fetchQRs();
            return true;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to delete QR code: ${errorMessage}`);
            setError(errorMessage);
            return false;
        }
    }, [fetchQRs]);

    // Verify a QR code
    const verifyQR = useCallback(async (qrCodeId: string) => {
        if (!qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return { valid: false, url: null, message: "QR Code ID is required" };
        }

        try {
            const response = await qrAPI.verify(qrCodeId);
            const data: any = response?.data.data;

            if (data && data.isActive && !data.isDeleted) {
                const message = `QR is valid ✅\nURL: ${data.url}`;
                toast.success("QR code is valid ✅");
                return { valid: true, url: data.url, message };
            } else {
                const message = "QR code is invalid ❌";
                toast.error("QR code is invalid ❌");
                return { valid: false, url: null, message };
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to verify QR code: ${errorMessage}`);
            setError(errorMessage);
            return { valid: false, url: null, message: errorMessage };
        }
    }, []);

    // Get a single QR by ID
    const getQR = useCallback((qrCodeId: string): QRType | undefined => {
        if (!qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return undefined;
        }
        return qrs.find(qr => qr.qrCodeId === qrCodeId);
    }, [qrs]);

    // Clear error state
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Refresh QRs (alias for fetchQRs)
    const refreshQRs = useCallback(() => {
        return fetchQRs();
    }, [fetchQRs]);

    return {
        // State
        qrs,
        isLoading,
        error,

        // Actions
        fetchQRs,
        createQR,
        updateQR,
        deleteQR,
        verifyQR,
        getQR,
        refreshQRs,
        clearError,

        // Computed values
        totalQRs: qrs.length,
        activeQRs: qrs.filter(qr => qr.isActive && !qr.isDeleted).length,
        usedQRs: qrs.filter(qr => qr.isUsed).length,
    };
}