export type CreateQRFormData = {
  qrCodeId: string;
  url?: string;
  isUsed?: boolean;   // default: false
  isActive?: boolean; // default: true
  isDeleted?: boolean; // default: false
};

export type UpdateQRFormData = {
  qrCodeId?: string;
  url?: string;
  isDeleted?: boolean;
  isUsed?: boolean;   // default: false
  isActive?: boolean; // default: true
};