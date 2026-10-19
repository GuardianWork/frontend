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

export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const pagination = getPagination(items.length, requestedPage, pageSize);
  return { ...pagination, items: items.slice(pagination.start, pagination.start + pageSize) };
}
