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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState("");

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

    // Filter QRs based on search term
    const filteredQRs = useCallback(() => {
        if (!searchTerm.trim()) return qrs;
        
        const search = searchTerm.toLowerCase();
        return qrs.filter(qr => 
            qr.qrCodeId.toLowerCase().includes(search) ||
            (qr.url && qr.url.toLowerCase().includes(search))
        );
    }, [qrs, searchTerm]);

    // Pagination calculations
    const filtered = filteredQRs();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentQRs = filtered.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Pagination handlers
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

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
                alert(`✅ QR Code is valid\nSerial`);
            } else {
                alert(`❌ QR Code is invalid or scan limit reached\nTotal Scans:}`);
            }
        } catch (error) {
            toast.error("Failed to verify QR code");
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

            {/* Search and Actions Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by QR Code ID or URL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border border-gray-300 px-4 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                        <option value={200}>200 per page</option>
                    </select>
                    <button
                        onClick={openCreateModal}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                        Create New QR
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-32">
                    <p className="text-gray-600">Loading QRs...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">
                        {searchTerm ? "No QR codes found matching your search." : "No QR codes found. Create your first QR code!"}
                    </p>
                </div>
            ) : (
                <>
                    {/* Results Info */}
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} QR codes
                        {searchTerm && ` (filtered from ${qrs.length} total)`}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto mb-6">
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
                                {currentQRs.map((qr) => (
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </div>
                            
                            <div className="flex gap-2 items-center flex-wrap justify-center">
                                <button
                                    onClick={goToFirstPage}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    First
                                </button>
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                
                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => goToPage(pageNum)}
                                                className={`px-3 py-1 border rounded transition-colors ${
                                                    currentPage === pageNum
                                                        ? "bg-blue-500 text-white border-blue-500"
                                                        : "border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={goToLastPage}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Last
                                </button>
                            </div>

                            {/* Jump to Page */}
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-gray-600">Go to:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => {
                                        const page = parseInt(e.target.value);
                                        if (!isNaN(page)) {
                                            goToPage(page);
                                        }
                                    }}
                                    className="border border-gray-300 px-2 py-1 w-20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </>
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