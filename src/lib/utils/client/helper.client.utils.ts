export const helperClientUtils = {
    formatDate: (dateStr?: string) => (dateStr ? new Date(dateStr).toLocaleString() : "-"),

    // Convert QR object status
    getQRStatus: (qr: { isUsed: boolean; isActive: boolean; isDeleted: boolean }) => {
        if (qr.isDeleted) return "Deleted";
        if (!qr.isActive) return "Inactive";
        if (qr.isUsed) return "Used";
        return "Active";
    },

    // Build query string safely
    buildQuery: (params: Record<string, any>) => "?" + new URLSearchParams(params as Record<string, string>).toString(),
};
