export function formatPeriod(from: string, to: string, present: string) {
  const format = (value: string) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    return month ? `${month}/${year}` : year;
  };
  return `${format(from)} – ${to ? format(to) : present}`;
}
