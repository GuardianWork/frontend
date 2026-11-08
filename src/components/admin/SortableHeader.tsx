import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { TableSort } from "@/lib/table-sort";

export function SortableHeader({
  label,
  column,
  sort,
  onSort,
  scope = "page",
}: {
  label: string;
  column: string;
  sort: TableSort;
  onSort: (column: string) => void;
  scope?: "page" | "all";
}) {
  const active = sort.key === column;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  const next = active && sort.direction === "asc" ? "giảm dần" : "tăng dần";
  return (
    <th
      scope="col"
      aria-label={label}
      className="staff-sort-header"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        title={`Sắp xếp ${next}${scope === "page" ? " trong trang hiện tại" : ""}`}
        aria-label={`Sắp xếp theo ${label.toLocaleLowerCase("vi")}${scope === "page" ? " trong trang hiện tại" : ""}`}
      >
        {label}
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}
