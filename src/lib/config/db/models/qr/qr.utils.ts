import { IQRDocument, IQRModel } from "./qr.interface";

export const qrModelUtils = {
  // Instance methods
  async markUsed(this: IQRDocument) {
    this.isUsed = true;
    await this.save();
    return this;
  },

  async softDelete(this: IQRDocument) {
    this.isDeleted = true;
    await this.save();
    return this;
  },

  // Static method
  async verify(this: IQRModel, qrCodeId: string) {
    const qr = await this.findOneAndUpdate(
        { qrCodeId, isDeleted: false, isActive: true, isUsed: false },
        { isUsed: true },
        { new: true, lean: true }
    );

    return qr;
  },

  // Virtual getter
  getStatus(this: IQRDocument) {
    if (this.isDeleted) return "Deleted";
    if (!this.isActive) return "Inactive";
    if (this.isUsed) return "Used";
    return "Valid";
  },
};