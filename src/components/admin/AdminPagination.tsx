import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_PAGE_SIZE, getPagination } from "@/lib/pagination";
import "./pagination.css";

export function AdminPagination({
  totalItems,
  page,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  itemLabel = "bản ghi",
  label = "Phân trang danh sách",
  standalone = false,
}: {
  totalItems: number;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  itemLabel?: string;
  label?: string;
  standalone?: boolean;
}) {
  const current = getPagination(totalItems, page, pageSize);
  const pageNumbers = Array.from(
    new Set([0, current.page - 1, current.page, current.page + 1, current.totalPages - 1]),
  )
    .filter((number) => number >= 0 && number < current.totalPages)
    .sort((a, b) => a - b);
  return (
    <nav
      className={`admin-list-pagination${standalone ? " is-standalone" : ""}`}
      aria-label={label}
    >
      <div className="admin-pagination-meta">
        <p role="status" aria-live="polite">
          <strong>
            {current.from}–{current.to}
          </strong>{" "}
          / {totalItems} {itemLabel}
        </p>
      </div>
      <div className="admin-pagination-controls">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={current.page === 0}
          onClick={() => onPageChange(current.page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span>Trước</span>
        </button>
        {pageNumbers.map((number, index) => (
          <span className="admin-pagination-number-group" key={number}>
            {index > 0 && number - pageNumbers[index - 1] > 1 && (
              <span className="admin-pagination-gap" aria-hidden="true">
                …
              </span>
            )}
            <button
              type="button"
              className="admin-pagination-number"
              aria-label={`Trang ${number + 1}`}
              aria-current={current.page === number ? "page" : undefined}
              disabled={current.page === number}
              onClick={() => onPageChange(number)}
            >
              {number + 1}
            </button>
          </span>
        ))}
        <button
          type="button"
          aria-label="Trang sau"
          disabled={current.page >= current.totalPages - 1}
          onClick={() => onPageChange(current.page + 1)}
        >
          <span>Sau</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
