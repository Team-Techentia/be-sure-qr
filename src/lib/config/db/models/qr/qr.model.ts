import { model, models, Schema } from "mongoose";
import { IQRDocument, IQRModel } from "./qr.interface";
import { qrModelUtils } from "./qr.utils";

const qrSchema = new Schema<IQRDocument, IQRModel>({
    qrCodeId: { type: String, required: [true, "Qr Id is missing"], unique: true, index: true },
    url: { type: String, sparse: true },
    isUsed: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

qrSchema.index({ qrCodeId: 1, isDeleted: 1 }, { unique: true });
qrSchema.index({ url: 1, isDeleted: 1 }, { sparse: true });
qrSchema.index({ isDeleted: 1, isActive: 1, isUsed: 1 });

// Instance methods
qrSchema.methods.markUsed = qrModelUtils.markUsed;

qrSchema.methods.softDelete = qrModelUtils.softDelete;

// Static method
qrSchema.statics.verify = qrModelUtils.verify;

// Virtual
qrSchema.virtual("status").get(qrModelUtils.getStatus);

const QR: IQRModel = (models?.QR as IQRModel) || model<IQRDocument, IQRModel>("QR", qrSchema);

export default QR;