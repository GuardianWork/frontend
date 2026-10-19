import { useState } from "react";
import { paginateItems } from "@/lib/pagination";

/** Filters reset the page; removals clamp it without an extra render or stale empty page. */
export function useListPagination<T>(items: readonly T[], resetKey: string) {
  const [selection, setSelection] = useState({ key: resetKey, page: 0 });
  const pagination = paginateItems(items, selection.key === resetKey ? selection.page : 0);
  return {
    ...pagination,
    onPageChange: (page: number) => setSelection({ key: resetKey, page }),
  };
}
