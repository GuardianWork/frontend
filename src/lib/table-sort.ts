export type SortValue = string | number | boolean | null | undefined;
export type TableSort = { key: string; direction: "asc" | "desc" };
export type SortColumns<T> = Record<string, (row: T) => SortValue>;

const collator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });

export function sortDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    value.trim(),
  );
  const result = local
    ? Date.UTC(
        Number(local[3]),
        Number(local[2]) - 1,
        Number(local[1]),
        Number(local[4] ?? 0),
        Number(local[5] ?? 0),
        Number(local[6] ?? 0),
      )
    : Date.parse(value);
  if (!Number.isFinite(result)) return null;
  if (local) {
    const date = new Date(result);
    if (
      date.getUTCDate() !== Number(local[1]) ||
      date.getUTCMonth() !== Number(local[2]) - 1 ||
      date.getUTCFullYear() !== Number(local[3]) ||
      Number(local[4] ?? 0) > 23 ||
      Number(local[5] ?? 0) > 59 ||
      Number(local[6] ?? 0) > 59
    )
      return null;
  }
  return result;
}

export function sortTableRows<T>(
  rows: readonly T[],
  sort: TableSort,
  columns: SortColumns<T>,
): T[] {
  const read = columns[sort.key];
  if (!read) return [...rows];
  return [...rows].sort((a, b) => {
    const left = read(a);
    const right = read(b);
    // Missing values stay last in either direction, rather than looking newest.
    if (left == null || left === "") return right == null || right === "" ? 0 : 1;
    if (right == null || right === "") return -1;
    const compared =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : collator.compare(String(left), String(right));
    if (compared === 0) {
      const leftId = (a as { id?: string | number }).id;
      const rightId = (b as { id?: string | number }).id;
      if (leftId != null && rightId != null)
        return collator.compare(String(rightId), String(leftId));
    }
    return sort.direction === "asc" ? compared : -compared;
  });
}
