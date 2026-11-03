import { SearchIcon, CloseIcon } from "@/components/icons";

export function ListSearch({
  value,
  onChange,
  label,
  count,
  describedBy,
  invalid,
  searchAction = false,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  count?: number;
  describedBy?: string;
  invalid?: boolean;
  searchAction?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="list-search-row">
      {searchAction ? (
        <div className="application-search-control">
          <label className="application-search-label">
            <span className="sr-only">{label}</span>
            <input
              className="application-search-input"
              type="search"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder || label}
            />
          </label>
          <button
            className="application-search-submit"
            type="submit"
            aria-label="Tìm kiếm ứng viên"
          >
            <SearchIcon size={18} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="list-search-field">
          <SearchIcon size={18} aria-hidden="true" />
          <span className="sr-only">{label}</span>
          <input
            type="search"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder || label}
          />
        </label>
      )}
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
