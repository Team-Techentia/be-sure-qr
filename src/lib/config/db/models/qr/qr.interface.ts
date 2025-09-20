import { Document, Model } from "mongoose";

export interface IQR {
  url?: string;
  qrCodeId: string;
  isUsed: boolean;
  isActive: boolean;
  isDeleted: boolean;
}

// Document interface (instance methods + fields)
export interface IQRDocument extends IQR, Document {
  markUsed(): Promise<IQRDocument>;
  softDelete(): Promise<IQRDocument>;
  status: string; // virtual
}

export interface IQRModel extends Model<IQRDocument> {
  verify(qrCodeId: string): Promise<IQRDocument | null>;
}