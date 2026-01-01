/**
 * Pagination utility functions
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number | undefined;
  take: number | undefined;
  skipPagination: boolean;
}

/**
 * Calculate skip and take values for Prisma queries
 * @param page - Page number (1-indexed)
 * @param limit - Items per page (0 or undefined means no pagination)
 * @returns Pagination parameters for Prisma
 */
export function calculatePagination(page: number = 1, limit?: number): PaginationResult {
  const skipPagination = !limit || limit === 0;

  return {
    skip: skipPagination ? undefined : (page - 1) * limit,
    take: skipPagination ? undefined : limit,
    skipPagination,
  };
}

/**
 * Create a paginated response metadata
 * @param total - Total count of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export function createPaginationMeta(total: number, page: number, limit?: number) {
  if (!limit || limit === 0) {
    return {
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    };
  }

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
