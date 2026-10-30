import { CheckIcon } from "@/components/icons";

import type { AccountPurpose } from "@/services/auth";

export function AccountPurposeChoice({
  value,
  onChange,
  disabled,
}: {
  value: AccountPurpose;
  onChange: (purpose: AccountPurpose) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="mb-6">
      <legend className="mb-3 text-sm font-semibold">Bạn muốn làm gì tiếp theo?</legend>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            {
              value: "candidate",
              title: "Tôi muốn tìm việc",
              description: "Khám phá cơ hội mới",
            },
            {
              value: "recruiter",
              title: "Tôi muốn tuyển dụng",
              description: "Bắt đầu tuyển dụng",
            },
          ] as const
        ).map(({ value: option, title, description }) => (
          <label
            key={option}
            className={`relative cursor-pointer rounded-md border p-3 transition-colors sm:p-4 ${value === option ? "border-primary bg-surface-container-low" : "border-warm-border hover:bg-surface-container-low"}`}
          >
            <input
              type="radio"
              name="account-purpose"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only peer"
            />
            <span className="pointer-events-none absolute inset-0 rounded-md peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
            <span className="block text-xs font-semibold sm:text-sm">{title}</span>
            <span className="mt-1 block text-xs leading-5 text-charcoal-83">{description}</span>
            {value === option && <CheckIcon size={14} className="absolute right-3 top-3" />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
