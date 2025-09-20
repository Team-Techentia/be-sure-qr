// @/app/qr/page.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQR } from "@/hooks/useQR";
import { useAuth, useModal, useOutsideClick } from "@/hooks";
import { CreateQRFormData, QRType } from "@/lib/types";
import { LoginPage } from "./_components";
import { Loader } from "@/components";
import toast from "react-hot-toast";

export default function QRPage() {
    const { isAuthenticated, login, logout, isAuthLoading } = useAuth();
    const { qrs, isLoading, error, fetchQRs, createQR, updateQR, deleteQR, verifyQR, totalQRs, activeQRs, usedQRs } = useQR();

    // Modal states
    const { isOpen: isCreateModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
    const { isOpen: isUpdateModalOpen, openModal: openUpdateModal, closeModal: closeUpdateModal } = useModal();
    
    const createModalRef = useRef<HTMLDivElement>(null);
    const updateModalRef = useRef<HTMLDivElement>(null);
    
    useOutsideClick(createModalRef, closeCreateModal, isCreateModalOpen);
    useOutsideClick(updateModalRef, closeUpdateModal, isUpdateModalOpen);

    const [createForm, setCreateForm] = useState<CreateQRFormData>({
        qrCodeId: "",
        url: "",
        isUsed: false,
        isActive: true,
        isDeleted: false,
    });

    const [updateForm, setUpdateForm] = useState<QRType | null>(null);

    // Fetch QRs when authenticated
    useEffect(() => {
        if (isAuthenticated && !isAuthLoading) {
            fetchQRs().catch((error) => {
                toast.error("Failed to load QR codes");
            });
        }
    }, [isAuthenticated, isAuthLoading, fetchQRs]);

    // Handle create QR
    const handleCreate = useCallback(async () => {
        if (!createForm.qrCodeId.trim()) {
            toast.error("QR Code ID is required");
            return;
        }

        try {
            const success = await createQR(createForm);
            if (success) {
                closeCreateModal();
                setCreateForm({ qrCodeId: "", url: "", isUsed: false, isActive: true, isDeleted: false });
            }
        } catch (error) {
            toast.error("Failed to create QR code");
        }
    }, [createForm, createQR, closeCreateModal]);

    // Handle open update modal
    const handleOpenUpdateModal = useCallback((qr: QRType) => {
        setUpdateForm({ ...qr });
        openUpdateModal();
    }, [openUpdateModal]);

    // Handle update QR
    const handleUpdate = useCallback(async () => {
        if (!updateForm) return;

        try {
            const success = await updateQR(updateForm.qrCodeId, {
                url: updateForm.url,
                isActive: updateForm.isActive,
                isUsed: updateForm.isUsed,
                isDeleted: updateForm.isDeleted,
            });
            if (success) {
                closeUpdateModal();
                setUpdateForm(null);
            }
        } catch (error) {
            toast.error("Failed to update QR code");
        }
    }, [updateForm, updateQR, closeUpdateModal]);

    // Handle toggle active status
    const handleToggleActive = useCallback(async (qrCodeId: string, currentStatus: boolean) => {
        try {
            const qr = qrs.find(q => q.qrCodeId === qrCodeId);
            if (!qr) return;

            const success = await updateQR(qrCodeId, {
                url: qr.url,
                isActive: !currentStatus,
                isUsed: qr.isUsed,
                isDeleted: qr.isDeleted,
            });

            if (success) {
                toast.success(`QR code ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            }
        } catch (error) {
            toast.error("Failed to update QR status");
        }
    }, [qrs, updateQR]);

    // Handle toggle used status
    const handleToggleUsed = useCallback(async (qrCodeId: string, currentStatus: boolean) => {
        try {
            const qr = qrs.find(q => q.qrCodeId === qrCodeId);
            if (!qr) return;

            const success = await updateQR(qrCodeId, {
                url: qr.url,
                isActive: qr.isActive,
                isUsed: !currentStatus,
                isDeleted: qr.isDeleted,
            });

            if (success) {
                toast.success(`QR code marked as ${!currentStatus ? 'used' : 'unused'} successfully`);
            }
        } catch (error) {
            toast.error("Failed to update QR status");
        }
    }, [qrs, updateQR]);

    // Handle delete QR with confirmation
    const handleDelete = useCallback(async (qrCodeId: string) => {
        if (!confirm("Are you sure you want to delete this QR code?")) return;
        
        try {
            const success = await deleteQR(qrCodeId);
            if (!success) {
                toast.error("Failed to delete QR code");
            }
        } catch (error) {
            toast.error("An error occurred while deleting QR code");
        }
    }, [deleteQR]);

    // Handle verify QR with toast notification
    const handleVerify = useCallback(async (qrCodeId: string) => {
        try {
            const result = await verifyQR(qrCodeId);
            if (result.valid) {
                alert(`QR Code is valid ✅\nURL: ${result.url}`);
            } else {
                alert("QR Code is invalid ❌");
            }
        } catch (error) {
            toast.error("Failed to verify QR code");
            alert("Failed to verify QR code");
        }
    }, [verifyQR]);

    // Handle logout with error handling
    const handleLogout = useCallback(() => {
        try {
            logout();
        } catch (error) {
            toast.error("Error occurred during logout");
        }
    }, [logout]);

    // Show loader while checking authentication
    if (isAuthLoading) {
        return <Loader />;
    }

    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage login={login} />;
    }

    // Main QR management page
    return (
        <div className="p-6 h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="flex sm:flex-row flex-col justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">QR Management</h1>
                    <p className="text-gray-600 mt-1">Manage and track your QR codes</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Logout
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-600 text-sm font-medium">Total QRs</div>
                    <div className="text-2xl font-bold text-blue-800">{totalQRs}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-sm font-medium">Active QRs</div>
                    <div className="text-2xl font-bold text-green-800">{activeQRs}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-orange-600 text-sm font-medium">Used QRs</div>
                    <div className="text-2xl font-bold text-orange-800">{usedQRs}</div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="text-red-800 font-medium">Error</div>
                    <div className="text-red-600">{error}</div>
                </div>
            )}

            {/* Actions */}
            <div className="mb-6">
                <button
                    onClick={openCreateModal}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Create New QR
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-32">
                    <p className="text-gray-600">Loading QRs...</p>
                </div>
            ) : qrs.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">No QR codes found. Create your first QR code!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-300 p-3 text-left">QR Code ID</th>
                                <th className="border border-gray-300 p-3 text-left">URL</th>
                                <th className="border border-gray-300 p-3 text-left">Status</th>
                                <th className="border border-gray-300 p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {qrs.map((qr) => (
                                <tr key={qr.qrCodeId} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-3 font-mono text-sm">{qr.qrCodeId}</td>
                                    <td className="border border-gray-300 p-3 max-w-xs truncate" title={qr.url}>
                                        {qr.url}
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {qr.isActive && !qr.isDeleted && (
                                                <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded">Active</span>
                                            )}
                                            {!qr.isActive && (
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded">Inactive</span>
                                            )}
                                            {qr.isUsed && (
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded">Used</span>
                                            )}
                                            {qr.isDeleted && (
                                                <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded">Deleted</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleOpenUpdateModal(qr)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                                disabled={qr.isDeleted}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(qr.qrCodeId)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                                disabled={qr.isDeleted}
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => handleVerify(qr.qrCodeId)}
                                                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div
                        ref={createModalRef}
                        className="bg-white p-6 rounded-lg shadow-lg w-96 mx-4"
                    >
                        <h2 className="text-lg font-bold mb-4">Create New QR Code</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    QR Code ID *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter unique QR Code ID"
                                    value={createForm.qrCodeId}
                                    onChange={(e) => setCreateForm({ ...createForm, qrCodeId: e.target.value })}
                                    className="border border-gray-300 px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL *
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={createForm.url}
                                    onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })}
                                    className="border border-gray-300 px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="createActive"
                                        checked={createForm.isActive}
                                        onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="createActive" className="text-sm text-gray-700">
                                        Active
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="createUsed"
                                        checked={createForm.isUsed}
                                        onChange={(e) => setCreateForm({ ...createForm, isUsed: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="createUsed" className="text-sm text-gray-700">
                                        Used
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={closeCreateModal}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!createForm.qrCodeId.trim()}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Create QR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {isUpdateModalOpen && updateForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div
                        ref={updateModalRef}
                        className="bg-white p-6 rounded-lg shadow-lg w-96 mx-4"
                    >
                        <h2 className="text-lg font-bold mb-4">Update QR Code</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    QR Code ID
                                </label>
                                <input
                                    type="text"
                                    value={updateForm.qrCodeId}
                                    disabled
                                    className="border border-gray-300 px-3 py-2 w-full rounded bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL *
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={updateForm.url}
                                    onChange={(e) => setUpdateForm({ ...updateForm, url: e.target.value })}
                                    className="border border-gray-300 px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="updateActive"
                                        checked={updateForm.isActive}
                                        onChange={(e) => setUpdateForm({ ...updateForm, isActive: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="updateActive" className="text-sm text-gray-700">
                                        Active
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="updateUsed"
                                        checked={updateForm.isUsed}
                                        onChange={(e) => setUpdateForm({ ...updateForm, isUsed: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="updateUsed" className="text-sm text-gray-700">
                                        Used
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <button
                                onClick={() => {
                                    closeUpdateModal();
                                    setUpdateForm(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={!updateForm.qrCodeId.trim()}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Update QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}