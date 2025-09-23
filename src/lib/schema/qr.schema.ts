// lib/validation/qr.schema.ts
import { z } from "zod";

export const qrSchema = {
    qrCreateSchema: z.object({
        qrCodeId: z.string().min(1, "qrCodeId is required"),
        url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
        isUsed: z.boolean().default(false),
        isActive: z.boolean().default(true),
        count:z.number().default(0)
    }),

    qrUpdateSchema: z.object({
        qrCodeId: z.string().min(1, "qrCodeId is required").optional(),
        url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
        isUsed: z.boolean().optional(),
        isActive: z.boolean().optional(),
        isDeleted: z.boolean().optional(),
        count:z.number().default(0)
    }),

    // just validate ID for delete, get, verify
    qrIdSchema: z.object({
        qrCodeId: z.string().min(1, "qrCodeId is required"),
    }),
}

