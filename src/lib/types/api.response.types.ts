export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

export interface PaginationResponse {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
}