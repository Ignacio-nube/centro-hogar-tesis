import type { PaginatedResult } from '../models/types'

export function parsePagination(query: Record<string, unknown>): { page: number; pageSize: number; offset: number } {
  const page     = Math.max(1, parseInt(String(query['page'] ?? '1'), 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query['pageSize'] ?? '20'), 10)))
  const offset   = (page - 1) * pageSize
  return { page, pageSize, offset }
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
