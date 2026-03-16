import { useState, useMemo, useCallback } from 'react';

const PAGE_SIZE = 50;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  // Reset to page 1 when items change significantly
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(
    () => items.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [items, safeCurrentPage, pageSize]
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(safeCurrentPage + 1), [goToPage, safeCurrentPage]);
  const prevPage = useCallback(() => goToPage(safeCurrentPage - 1), [goToPage, safeCurrentPage]);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: safeCurrentPage < totalPages,
    hasPrevPage: safeCurrentPage > 1,
    totalItems: items.length,
    pageSize,
    startIndex: (safeCurrentPage - 1) * pageSize + 1,
    endIndex: Math.min(safeCurrentPage * pageSize, items.length),
  };
}
