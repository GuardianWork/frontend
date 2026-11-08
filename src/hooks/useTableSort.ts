import { useState } from "react";
import { sortTableRows, type SortColumns, type TableSort } from "@/lib/table-sort";

export function useTableSort<T>(
  rows: readonly T[],
  columns: SortColumns<T>,
  initial: TableSort,
  context = "",
) {
  const [selection, setSelection] = useState({ context, sort: initial });
  if (selection.context !== context) setSelection({ context, sort: initial });
  const sort = selection.context === context ? selection.sort : initial;
  const onSort = (key: string) =>
    setSelection({
      context,
      sort: { key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" },
    });
  return { rows: sortTableRows(rows, sort, columns), sort, onSort };
}
