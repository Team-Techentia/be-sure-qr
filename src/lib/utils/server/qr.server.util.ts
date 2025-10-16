// lib/utils/server/qr.server.util.ts
import { dbConnect, QR } from "@/lib/config";
import { ApiResponse, PaginationResponse, QRType } from "@/lib/types";
import { AppError } from "./error.server.utils";
import { helperServerUtils } from "./helper.server.utils";

export const qrUtils = {
  async create(data: QRType): Promise<ApiResponse<QRType>> {
    await dbConnect();

    // Check if QR code already exists
    const existing = await QR.findOne({ qrCodeId: data.qrCodeId });
    if (existing) {
      throw new AppError(`QR Code '${data.qrCodeId}' already exists`, 409);
    }

    const qr = await QR.create({
      ...data,
      count: data.count ?? 0,
      isUsed: data.isUsed ?? false,
      isActive: data.isActive ?? true,
      isDeleted: data.isDeleted ?? false,
    });

    if (!qr) throw new AppError("Failed to create QR", 500);

    return {
      success: true,
      message: "QR created successfully",
      data: qr
    };
  },

  async list(queryParams: Record<string, any> = {}): Promise<ApiResponse<{ qrs: QRType[], pagination: PaginationResponse }>> {
    await dbConnect();

    const allowedFields: (keyof QRType)[] = [
      "qrCodeId",
      "url",
      "isUsed",
      "isActive",
      "isDeleted",
      "count"
    ];

    // Default to showing only non-deleted records
    if (queryParams.isDeleted === undefined) {
      queryParams.isDeleted = false;
    }

    const { filter, pagination, sort } = helperServerUtils.buildQuery<QRType>(queryParams, allowedFields);

    const [qrs, total] = await Promise.all([
      QR.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      QR.countDocuments({ ...filter, isDeleted: false })
    ]);

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      success: true,
      message: "QRs fetched successfully",
      data: {
        qrs,
        pagination: {
          currentPage: pagination.page,
          totalPages,
          totalCount: total,
          limit: pagination.limit,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1,
        },
      }
    };
  },

  async get(qrCodeId: string): Promise<ApiResponse<QRType>> {
    await dbConnect();

    const qr = await QR.findOne({
      qrCodeId,
      isDeleted: false
    }).lean();

    if (!qr) throw new AppError("QR not found", 404);

    return {
      success: true,
      message: "QR fetched successfully",
      data: qr
    };
  },

  async update(qrCodeId: string, data: Partial<QRType>): Promise<ApiResponse<QRType>> {
    await dbConnect();

    // Don't allow updating certain fields via this method
    const { _id, createdAt, ...updateData } = data as any;

    const qr = await QR.findOneAndUpdate(
      { qrCodeId, isDeleted: false },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!qr) throw new AppError("QR not found", 404);

    return {
      success: true,
      message: "QR updated successfully",
      data: qr
    };
  },

  async softDelete(qrCodeId: string): Promise<ApiResponse<QRType>> {
    await dbConnect();

    const qr = await QR.findOne({ qrCodeId, isDeleted: false });
    if (!qr) throw new AppError("QR not found", 404);

    await qr.softDelete();

    return {
      success: true,
      message: "QR deleted successfully",
      data: qr
    };
  },

  async verify(qrCodeId: string): Promise<ApiResponse<QRType>> {
    await dbConnect();

    const qr = await QR.findOneAndUpdate(
      {
        qrCodeId,
        isDeleted: false,
        isActive: true
      },
      { $inc: { count: 1 } },
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
  },

  async bulkInsert(rows: QRType[]): Promise<ApiResponse<QRType[]>> {
    await dbConnect();

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError("No data provided for bulk insert", 400);
    }

    // Sanitize and ensure all required fields
    const sanitizedRows = rows.map(row => ({
      qrCodeId: row.qrCodeId,
      url: row.url,
      isUsed: row.isUsed ?? false,
      isActive: row.isActive ?? true,
      isDeleted: row.isDeleted ?? false,
      count: row.count ?? 0,
    }));

    // Check for existing QR codes in batch
    const qrCodeIds = sanitizedRows.map(r => r.qrCodeId);
    const existingQRs = await QR.find({
      qrCodeId: { $in: qrCodeIds }
    }).select('qrCodeId').lean();

    const existingIds = new Set(existingQRs.map(qr => qr.qrCodeId));
    const duplicates = sanitizedRows.filter(r => existingIds.has(r.qrCodeId));

    if (duplicates.length > 0) {
      throw new AppError(
        `Duplicate QR codes found: ${duplicates.map(d => d.qrCodeId).join(', ')}`,
        409
      );
    }

    try {
      // Insert with ordered: false to continue on error
      const result = await QR.insertMany(sanitizedRows, {
        ordered: false
      });

      // Cast result to proper type since insertMany returns an array of documents
      const insertedDocs = Array.isArray(result) ? result : [];

      return {
        success: true,
        message: `Bulk QR inserted successfully: ${insertedDocs.length} records`,
        data: insertedDocs as any[],
      };
    } catch (err: any) {
      // Handle MongoDB duplicate key errors
      if (err.code === 11000 || err.name === 'BulkWriteError') {
        const insertedCount = err.result?.nInserted || 0;
        const errors = err.writeErrors || [];

        if (insertedCount > 0) {
          throw new AppError(
            `Partial insert: ${insertedCount} succeeded, ${errors.length} failed due to duplicates`,
            207
          );
        } else {
          throw new AppError(
            `All inserts failed: Duplicate QR codes detected`,
            409
          );
        }
      }
      throw err;
    }
  },

  async bulkDelete(qrCodeIds: string[]): Promise<ApiResponse<any>> {
    await dbConnect();

    const result = await QR.updateMany(
      {
        qrCodeId: { $in: qrCodeIds },
        isDeleted: false
      },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date()
        }
      }
    );

    return {
      success: true,
      message: `Bulk delete completed: ${result.modifiedCount} QR codes deleted`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    };
  },

  async getStats(): Promise<ApiResponse<any>> {
    await dbConnect();

    const [total, active, used, deleted] = await Promise.all([
      QR.countDocuments({ isDeleted: false }),
      QR.countDocuments({ isDeleted: false, isActive: true }),
      QR.countDocuments({ isDeleted: false, isUsed: true }),
      QR.countDocuments({ isDeleted: true }),
    ]);

    const totalScans = await QR.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);

    return {
      success: true,
      message: "Stats fetched successfully",
      data: {
        total,
        active,
        used,
        deleted,
        totalScans: totalScans[0]?.total || 0,
      }
    };
  }
};