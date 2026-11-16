export const DEFAULT_PAGE_SIZE = 10;

export function getPagination(
  totalItems: number,
  requestedPage: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.max(0, Math.min(Math.trunc(requestedPage), totalPages - 1));
  const start = page * pageSize;
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    from: totalItems ? start + 1 : 0,
    to: Math.min(start + pageSize, totalItems),
    start,
  };
}

export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Builds the compact page list shown in paginators. Small result sets render
 * every page; larger ones keep the first page, a six-page window around the
 * current page, and the last page, with ellipses for the gaps.
 */
export function getPaginationItems(
  requestedPage: number,
  totalPages: number,
  windowSize = 6,
): PaginationItem[] {
  const total = Math.max(1, Math.trunc(totalPages));
  const current = Math.min(Math.max(0, Math.trunc(requestedPage)), total - 1);
  const size = Math.max(3, Math.trunc(windowSize));

  if (total <= size + 1) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  let start = current + 1 - Math.floor(size / 2);
  start = Math.min(Math.max(1, start), total - size + 1);
  const end = start + size - 1;

  const items: PaginationItem[] = [];
  if (start > 2) {
    items.push(1, "ellipsis-start");
  } else if (start === 2) {
    items.push(1);
  }
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) {
    items.push("ellipsis-end", total);
  } else if (end === total - 1) {
    items.push(total);
  }
  return items;
}

export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const pagination = getPagination(items.length, requestedPage, pageSize);
  return { ...pagination, items: items.slice(pagination.start, pagination.start + pageSize) };
}
