// lib/server/qrUtil.ts
import { dbConnect, QR, } from "@/lib/config";
import { ApiResponse, QRType } from "@/lib/types";
import { AppError } from "./error.server.utils";

export const qrUtils = {
    async create(data: QRType): Promise<ApiResponse<QRType>> {
        await dbConnect();
        const qr = await QR.create(data);
        if (!qr) throw new AppError("Failed to create QR", 500);
        return { success: true, message: "QR created successfully", data: qr };
    },

    async list(): Promise<ApiResponse<QRType[]>> {
        await dbConnect();
        const qrs = await QR.find().lean();
        return { success: true, message: "QRs fetched successfully", data: qrs };
    },

    async get(qrCodeId: string): Promise<ApiResponse<QRType>> {
        await dbConnect();
        const qr = await QR.findOne({ qrCodeId });
        if (!qr) throw new AppError("QR not found", 404);
        return { success: true, message: "QRs fetched successfully", data: qr };
    },

    async update(qrCodeId: string, data: Partial<QRType>): Promise<ApiResponse<QRType>> {
        await dbConnect();
        const qr = await QR.findOneAndUpdate({ qrCodeId }, data, { new: true });
        if (!qr) throw new AppError("QR not found", 404);
        return { success: true, message: "QR updated successfully", data: qr };
    },

    async softDelete(qrCodeId: string): Promise<ApiResponse<QRType>> {
        await dbConnect();
        const qr = await QR.findOneAndUpdate({ qrCodeId }, { isDeleted: true }, { new: true });
        if (!qr) throw new AppError("QR not found", 404);
        return { success: true, message: "QR deleted successfully", data: qr };
    },

    async verify(qrCodeId: string): Promise<ApiResponse<QRType>> {
        await dbConnect();
        const qr = await QR.verify(qrCodeId);
        if (!qr) throw new AppError("Invalid or inactive QR", 404);
        return { success: true, message: "QR verified successfully", data: qr };
    },
};
