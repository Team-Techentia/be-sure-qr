// @/hooks/useQR.ts
import { useState, useCallback } from "react";
import { qrAPI } from "@/lib/api";
import { QRType, CreateQRFormData, UpdateQRFormData } from "@/lib/types";
import toast from "react-hot-toast";

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export function useQR() {
    const [qrs, setQrs] = useState<QRType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 50,
        hasNextPage: false,
        hasPrevPage: false,
    });

    // Stats that need to be fetched separately or calculated
    const [stats, setStats] = useState({
        totalQRs: 0,
        activeQRs: 0,
        usedQRs: 0,
    });

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

    // Fetch QRs with pagination and search
    const fetchQRs = useCallback(async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
        isUsed?: boolean;
        isDeleted?: boolean;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            // Build query params
            const queryParams: Record<string, any> = {
                page: params?.page || 1,
                limit: params?.limit || 50,
                isDeleted: params?.isDeleted ?? false,
            };

            // Add search filter if provided
            if (params?.search?.trim()) {
                queryParams.qrCodeId = params.search.trim();
            }

            // Add status filters if provided
            if (params?.isActive !== undefined) {
                queryParams.isActive = params.isActive;
            }
            if (params?.isUsed !== undefined) {
                queryParams.isUsed = params.isUsed;
            }

            const response = await qrAPI.list(queryParams);
            const qrData = response?.data.data?.qrs || [];
            const paginationData = response?.data?.data?.pagination;

            setQrs(qrData);
            
            if (paginationData) {
                setPagination({
                    currentPage: paginationData.currentPage,
                    totalPages: paginationData.totalPages,
                    totalCount: paginationData.totalCount,
                    limit: paginationData.limit,
                    hasNextPage: paginationData.hasNextPage,
                    hasPrevPage: paginationData.hasPrevPage,
                });
            }

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

    // Fetch stats separately (this could be a separate API endpoint)
    const fetchStats = useCallback(async () => {
        try {
            // Fetch all QRs to calculate stats (or use a dedicated stats endpoint)
            const [allResponse, activeResponse, usedResponse] = await Promise.all([
                qrAPI.list({ page: 1, limit: 1, isDeleted: false }),
                qrAPI.list({ page: 1, limit: 1, isActive: true, isDeleted: false }),
                qrAPI.list({ page: 1, limit: 1, isUsed: true, isDeleted: false }),
            ]);

            setStats({
                totalQRs: allResponse?.data?.data?.pagination?.totalCount || 0,
                activeQRs: activeResponse?.data?.data?.pagination?.totalCount || 0,
                usedQRs: usedResponse?.data?.data?.pagination?.totalCount || 0,
            });
        } catch (err) {
            console.error("Failed to fetch stats:", err);
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

            // Refresh stats after creating
            await fetchStats();
            
            return true;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to create QR code: ${errorMessage}`);
            setError(errorMessage);
            return false;
        }
    }, [fetchStats]);

    // Update an existing QR
    const updateQR = useCallback(async (qrCodeId: string, updateData: UpdateQRFormData) => {
        if (!qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return false;
        }

        try {
            await qrAPI.update(qrCodeId, updateData);
            toast.success("QR code updated successfully ✅");

            // Refresh stats after updating
            await fetchStats();
            
            return true;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to update QR code: ${errorMessage}`);
            setError(errorMessage);
            return false;
        }
    }, [fetchStats]);

    // Delete a QR (soft delete)
    const deleteQR = useCallback(async (qrCodeId: string) => {
        if (!qrCodeId?.trim()) {
            toast.error("QR Code ID is required");
            return false;
        }

        try {
            await qrAPI.softDelete(qrCodeId);
            toast.success("QR code deleted successfully ✅");

            // Refresh stats after deleting
            await fetchStats();
            
            return true;
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to delete QR code: ${errorMessage}`);
            setError(errorMessage);
            return false;
        }
    }, [fetchStats]);

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

    // Get a single QR by ID (from current page only)
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

    return {
        // State
        qrs,
        isLoading,
        error,
        pagination,
        stats,

        // Actions
        fetchQRs,
        fetchStats,
        createQR,
        updateQR,
        deleteQR,
        verifyQR,
        getQR,
        clearError,

        // Computed values (from stats)
        totalQRs: stats.totalQRs,
        activeQRs: stats.activeQRs,
        usedQRs: stats.usedQRs,
    };
}