import { SearchIcon, CloseIcon } from "@/components/icons";

export function ListSearch({
  value,
  onChange,
  label,
  count,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  count?: number;
}) {
  return (
    <div className="list-search-row">
      <label className="list-search-field">
        <SearchIcon size={18} aria-hidden="true" />
        <span className="sr-only">{label}</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
        />
      </label>
      {value && (
        <button
          type="button"
          className="list-search-clear"
          onClick={() => onChange("")}
          aria-label="Xóa từ khóa tìm kiếm"
        >
          <CloseIcon size={17} aria-hidden="true" />
        </button>
      )}
      {count !== undefined && (
        <span role="status" className="list-search-count">
          {count} kết quả
        </span>
      )}
    </div>
  );
}
