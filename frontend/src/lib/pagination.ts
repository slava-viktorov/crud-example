import { PAGINATION } from '@/constants';

export interface PaginationItem {
  page: number;
  isActive: boolean;
  isEllipsis: boolean;
}

export function getPaginationItems(
  currentPage: number, 
  totalPages: number, 
  maxVisible: number = PAGINATION.MAX_VISIBLE_PAGES
): PaginationItem[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      isActive: currentPage === i + 1,
      isEllipsis: false,
    }));
  }

  if (currentPage <= 2) {
    return [
      { page: 1, isActive: currentPage === 1, isEllipsis: false },
      { page: 2, isActive: currentPage === 2, isEllipsis: false },
      { page: 3, isActive: currentPage === 3, isEllipsis: false },
    ];
  }

  if (currentPage >= totalPages - 1) {
    return [
      { page: totalPages - 2, isActive: currentPage === totalPages - 2, isEllipsis: false },
      { page: totalPages - 1, isActive: currentPage === totalPages - 1, isEllipsis: false },
      { page: totalPages, isActive: currentPage === totalPages, isEllipsis: false },
    ];
  }

  return [
    { page: currentPage - 1, isActive: false, isEllipsis: false },
    { page: currentPage, isActive: true, isEllipsis: false },
    { page: currentPage + 1, isActive: false, isEllipsis: false },
  ];
}

export function shouldShowStartEllipsis(currentPage: number, totalPages: number): boolean {
  return currentPage > 2 && totalPages > PAGINATION.MAX_VISIBLE_PAGES;
}

export function shouldShowEndEllipsis(currentPage: number, totalPages: number): boolean {
  return currentPage < totalPages - 1 && totalPages > PAGINATION.MAX_VISIBLE_PAGES;
}

export function calculateTotalPages(count: number, limit: number): number {
  return Math.ceil(count / limit);
} 