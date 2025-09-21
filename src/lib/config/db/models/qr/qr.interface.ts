import { Document, Model } from "mongoose";

export interface IQR {
  url?: string;
  qrCodeId: string;
  isUsed: boolean;
  isActive: boolean;
  isDeleted: boolean;
  count: number;   // ✅ Add count to track scans
}

// Document interface (instance methods + fields)
export interface IQRDocument extends IQR, Document {
  markUsed(): Promise<IQRDocument>;
  softDelete(): Promise<IQRDocument>;
  status: string; // virtual
}

// Model interface (static methods)
export interface IQRModel extends Model<IQRDocument> {
  verify(qrCodeId: string): Promise<IQRDocument | null>;
}
