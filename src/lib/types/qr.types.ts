export type QRType = {
    qrCodeId: string;
    url?: string;
    isUsed: boolean;
    isActive: boolean;
    isDeleted: boolean;
    scanCount?: number;
    createdAt?: string;
    valid?: boolean;
    count: number;
    totalScans?: number;
    updatedAt?: string;
};