import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const authInputClass =
  "w-full rounded-lg border border-warm-border bg-paper-white px-3.5 py-3 text-sm text-charcoal-text placeholder:text-charcoal-40 focus:outline-2 focus:outline-offset-2 focus:outline-primary disabled:opacity-60";

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label} <span aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          maxLength={128}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${authInputClass} pr-12`}
        />
        <button
          type="button"
          aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-83 hover:text-primary"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-charcoal-83">
          {hint}
        </p>
      )}
    </div>
  );
}
