import { QRState } from "../types";

// @/lib/consts/index.ts
export const appConsts = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    endpoints: {
      qr: {
        create: '/admin/qr',
        list: '/admin/qr',
        getById: (id: string) => `/admin/qr/${id}`,
        update: (id: string) => `/admin/qr/${id}`,
        softDelete: (id: string) => `/qr/${id}`,
        verify: (id: string) => `/qr/verify/${id}`,
      }
    },
    headers: {
      'Content-Type': 'application/json',
    }
  },

  // QR Code States
  qrStates: QRState,

  // Status Colors
  statusColors: {
    active: 'text-green-600 bg-green-50',
    inactive: 'text-yellow-600 bg-yellow-50',
    used: 'text-blue-600 bg-blue-50',
    deleted: 'text-red-600 bg-red-50'
  } as const,

  // Table Configuration
  table: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    maxDisplayLength: 50
  },

  // Form Validation
  validation: {
    url: {
      pattern: /^https?:\/\/.+/,
      message: 'Please enter a valid URL starting with http:// or https://'
    },
    qrCodeId: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: 'QR Code ID must contain only letters, numbers, hyphens, and underscores'
    }
  },

  // UI Constants
  ui: {
    toast: {
      duration: 5000,
      position: 'top-right'
    },
    modal: {
      defaultWidth: 'max-w-md',
      defaultAnimation: 'fade'
    },
    loadingDelay: 300
  },

  // Date Formats
  dateFormats: {
    display: 'MMM dd, yyyy',
    displayWithTime: 'MMM dd, yyyy HH:mm',
    iso: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
  }
} as const;

export type StatusColor = keyof typeof appConsts.statusColors;