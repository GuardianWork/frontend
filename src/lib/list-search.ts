export function matchesSearch(query: string, ...values: (string | undefined)[]) {
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const text = normalize(values.filter(Boolean).join(" "));
  return normalize(query)
    .trim()
    .split(/\s+/)
    .every((word) => text.includes(word));
}
