import mongoose from "mongoose";
import { ZodError } from "zod";

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;

        // 👇 ensures instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const errorHandler = (error: any) => {

    if (error instanceof AppError) {
        return { status: error.statusCode, body: { success: false, message: error.message, error } };
    }

    if (error instanceof ZodError) {
        return {
            status: 400, body: {
                success: false, message: "Validation failed",
                // error:error.message,
                error: error.issues.map(e => e.message),
            }
        };
    }

    if (error instanceof mongoose.Error.ValidationError) {
        return { status: 400, body: { success: false, message: "Database validation error", error: error } };
    }

    if (error.code && error.code === 11000) {
        return { status: 409, body: { success: false, message: "Duplicate key errorr", error: error?.keyValue } };
    }

    return { status: 500, body: { success: false, message: "Internal server error", error: error?.message || "Unknown error" } };
}