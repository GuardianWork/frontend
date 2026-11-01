import type { EmployerStage } from "@/services/employerOnboarding";

export function RecruiterSetupProgress({ stage }: { stage: EmployerStage }) {
  const current = stage === "COMPANY_ACTION_REQUIRED" ? 0 : stage === "VERIFIED" ? 2 : 1;
  const steps = [
    ["Kết nối công ty", current > 0 ? "Đã gửi hồ sơ công ty" : "Đăng ký công ty hoặc nhận lời mời"],
    [
      "Xác thực công ty",
      stage === "REJECTED"
        ? "Cần bổ sung hồ sơ"
        : current > 1
          ? "Đã xác thực"
          : current === 1
            ? "Đang chờ xét duyệt"
            : "Sau khi gửi hồ sơ",
    ],
    [
      "Bắt đầu tuyển dụng",
      current === 2 ? "Tạo tin và lưu bản nháp đầu tiên" : "Mở sau khi công ty được xác thực",
    ],
  ];
  return (
    <ol
      aria-label="Các bước bắt đầu tuyển dụng"
      className="my-6 grid gap-4 border-y border-warm-border py-5 sm:grid-cols-3"
    >
      {steps.map(([title, description], index) => (
        <li
          key={title}
          aria-current={index === current ? "step" : undefined}
          className="flex gap-3 text-sm"
        >
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-semibold ${index === current ? "border-primary bg-primary text-on-primary" : "border-warm-border text-charcoal-83"}`}
          >
            {index + 1}
          </span>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 leading-5 text-charcoal-83">{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
