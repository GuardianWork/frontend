import { ApiError } from "./api.ts";

type Page<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

/** Read newest-first windows from Staff endpoints whose contract is oldest-first.
 * A partial last page can straddle two source pages; reversing one page is not enough. */
export async function newestStaffPage<T, P extends Page<T>>(
  loadPage: (page: number) => Promise<P>,
  page: number,
): Promise<P> {
  if (!Number.isInteger(page) || page < 0) throw new ApiError("Trang không hợp lệ.", 400);
  const first = await loadPage(0);
  const size = first.pageSize;
  if (
    !Number.isInteger(size) ||
    size < 1 ||
    !Number.isSafeInteger(first.totalElements) ||
    first.totalElements < 0
  )
    throw new ApiError("Danh sách trả về không hợp lệ. Vui lòng tải lại.");
  const end = Math.max(0, first.totalElements - page * size);
  const start = Math.max(0, end - size);
  if (!end) return { ...first, content: [], pageNumber: page, first: page === 0, last: true };
  const from = Math.floor(start / size);
  const to = Math.floor((end - 1) / size);
  const indices = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const pages = await Promise.all(indices.map((index) => (index === 0 ? first : loadPage(index))));
  if (pages.some((item) => item.totalElements !== first.totalElements || item.pageSize !== size))
    throw new ApiError("Danh sách đã thay đổi. Vui lòng tải lại để xem dữ liệu mới nhất.", 409);
  const rows = pages.flatMap((item) => item.content);
  const content = rows.slice(start - from * size, end - from * size).reverse();
  return {
    ...first,
    content,
    pageNumber: page,
    first: page === 0,
    last: page >= first.totalPages - 1,
  };
}
