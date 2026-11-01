import { formatAccountTime, type CodeDelivery } from "@/services/accountControl";

export function CodeChallenge({
  id,
  value,
  onChange,
  delivery,
  disabled,
  acknowledged,
  onAcknowledge,
  acknowledgement,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  delivery: CodeDelivery;
  disabled: boolean;
  acknowledged?: boolean;
  onAcknowledge?: (value: boolean) => void;
  acknowledgement?: string;
}) {
  return (
    <div className="account-challenge">
      <label htmlFor={id}>Mã xác nhận 6 chữ số</label>
      <input
        id={id}
        className="account-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        minLength={6}
        maxLength={6}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="account-hint">
        Dùng mã mới nhất trong email cho đúng thao tác này. Gửi lại sẽ thay thế mã trước đó.
        {delivery.expiresAt && (
          <> Hết hạn lúc {formatAccountTime(delivery.expiresAt)} (giờ Việt Nam).</>
        )}
      </p>
      {onAcknowledge && (
        <label className="account-ack">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => onAcknowledge(event.target.checked)}
            required
            disabled={disabled}
          />
          <span>{acknowledgement}</span>
        </label>
      )}
    </div>
  );
}
