// pages/api/qr/import.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { qrUtils } from "@/lib/utils/server/qr.server.util";
import { AppError } from "@/lib/utils/server/error.server.utils";
import { withErrorHandler } from "@/lib/middleware";

interface ImportRow {
  qrCodeId: string;
  url: string;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
  insertedIds: string[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== "POST") {
      throw new AppError(`Method ${req.method} Not Allowed`, 405);
    }

    const rows: ImportRow[] = req.body;

    // Validation
    if (!Array.isArray(rows)) {
      throw new AppError("Request body must be an array", 400);
    }

    if (rows.length === 0) {
      throw new AppError("No data provided", 400);
    }

    if (rows.length > 1000) {
      throw new AppError("Maximum 1000 rows allowed per import", 400);
    }

    // Validate and sanitize each row
    const validRows: Array<{
      qrCodeId: string;
      url: string;
      isUsed: boolean;
      isActive: boolean;
      isDeleted: boolean;
      count: number;
    }> = [];
    
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because CSV has header and is 1-indexed

      // Validate qrCodeId
      if (!row.qrCodeId || typeof row.qrCodeId !== 'string') {
        errors.push(`Row ${rowNum}: Missing or invalid qrCodeId`);
        continue;
      }

      const qrCodeId = row.qrCodeId.trim();
      if (qrCodeId.length === 0) {
        errors.push(`Row ${rowNum}: qrCodeId cannot be empty`);
        continue;
      }

      if (qrCodeId.length > 50) {
        errors.push(`Row ${rowNum}: qrCodeId too long (max 50 characters)`);
        continue;
      }

      // Validate URL
      if (!row.url || typeof row.url !== 'string') {
        errors.push(`Row ${rowNum}: Missing or invalid url`);
        continue;
      }

      const url = row.url.trim();
      if (url.length === 0) {
        errors.push(`Row ${rowNum}: url cannot be empty`);
        continue;
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        errors.push(`Row ${rowNum}: Invalid URL format`);
        continue;
      }

      // Check for duplicates in current batch
      if (validRows.some(r => r.qrCodeId === qrCodeId)) {
        errors.push(`Row ${rowNum}: Duplicate qrCodeId '${qrCodeId}' in CSV`);
        continue;
      }

      validRows.push({
        qrCodeId,
        url,
        isUsed: false,
        isActive: true,
        isDeleted: false,
        count: 0,
      });
    }

    // If no valid rows, return error
    if (validRows.length === 0) {
      throw new AppError(
        "No valid QR entries found. Errors: " + errors.join("; "),
        400
      );
    }

    // Attempt bulk insert with duplicate handling
    let result: ImportResult = {
      successful: 0,
      failed: 0,
      errors: [...errors],
      insertedIds: []
    };

    try {
      // Try bulk insert
      const bulkResult = await qrUtils.bulkInsert(validRows);
      result.successful = validRows.length;
      result.insertedIds = bulkResult.data?.map((qr: any) => qr.qrCodeId) || [];
      
      return res.status(200).json({
        success: true,
        message: `Successfully imported ${result.successful} QR code(s)`,
        details: result,
        data: bulkResult.data,
      });
    } catch (bulkError: any) {
      // If bulk insert fails (e.g., due to duplicates), try individual inserts
      console.log("Bulk insert failed, trying individual inserts:", bulkError.message);

      for (const row of validRows) {
        try {
          const createResult = await qrUtils.create(row);
          if (createResult.data) {
            result.successful++;
            result.insertedIds.push(createResult.data.qrCodeId);
          }
        } catch (err: any) {
          result.failed++;
          if (err.message.includes("duplicate") || err.code === 11000) {
            result.errors.push(`QR Code '${row.qrCodeId}' already exists`);
          } else {
            result.errors.push(`Failed to insert '${row.qrCodeId}': ${err.message}`);
          }
        }
      }

      // Determine response status
      if (result.successful === 0) {
        return res.status(400).json({
          success: false,
          message: "All imports failed",
          details: result,
        });
      } else if (result.failed > 0) {
        return res.status(207).json({ // 207 Multi-Status
          success: true,
          message: `Partially successful: ${result.successful} imported, ${result.failed} failed`,
          details: result,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: `Successfully imported ${result.successful} QR code(s)`,
          details: result,
        });
      }
    }
  } catch (err: any) {
    console.error("Import error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
};

export default withErrorHandler(handler);