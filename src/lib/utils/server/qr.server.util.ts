// lib/server/qrUtil.ts
import { dbConnect, QR, } from "@/lib/config";
import { ApiResponse, QRType } from "@/lib/types";
import { AppError } from "./error.server.utils";
import { helperServerUtils } from "./helper.server.utils";

export const qrUtils = {
    async create(data: QRType): Promise<ApiResponse<QRType>> {
    await dbConnect();
    const qr = await QR.create({
        ...data,
        count: data.count ?? 0 // 👈 agar count undefined ya null ho to 0 set
    });
    if (!qr) throw new AppError("Failed to create QR", 500);
    return { success: true, message: "QR created successfully", data: qr };
},


    async list(queryParams: Record<string, any> = {}): Promise<ApiResponse<QRType[]>> {
        await dbConnect();

        const allowedFields: (keyof QRType)[] = ["qrCodeId", "url", "isUsed", "isActive", "isDeleted","count"];

        if (queryParams.isDeleted === undefined) queryParams.isDeleted = false;

        const filter = helperServerUtils.buildQuery<QRType>(queryParams, allowedFields);
        const qrs = await QR.find(filter).lean();
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
        const qr = await QR.findOne({ qrCodeId });
        if (!qr) throw new AppError("QR not found", 404);
        await qr.softDelete();
        return { success: true, message: "QR deleted successfully", data: qr };
    },

  async verify(qrCodeId: string): Promise<ApiResponse<QRType>> {
  await dbConnect();

  const qr = await QR.findOneAndUpdate(
  { qrCodeId, isDeleted: false, isActive: true },
  {$inc:{count:1}},
  { new: true, lean: true }
);

  if (!qr) throw new AppError("Invalid or inactive QR", 404);

 const enrichedQR: QRType = {
    ...qr,
    count: qr.count ?? 0,
    valid: (qr.count ?? 0) <= 10 && qr.isActive && !qr.isDeleted,
    totalScans: qr.count ?? 0
};
  return {
    success: true,
    message: "QR verified successfully",
    data: enrichedQR
  };
}
}