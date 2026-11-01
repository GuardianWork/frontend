import { useEffect, useState } from "react";
import { ApiError } from "@/services/api";
import { isoTime, type CodeDelivery } from "@/services/accountControl";

export function useCodeCooldown() {
  const [nextAt, setNextAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return {
    now,
    seconds: Math.max(0, Math.ceil((nextAt - now) / 1000)),
    accept: (delivery: CodeDelivery) => {
      setNextAt(isoTime(delivery.nextRequestAt) || Date.now() + 60000);
      setNow(Date.now());
    },
    reject: (error: unknown) => {
      if (error instanceof ApiError && error.status === 429) {
        setNextAt(
          Math.max(
            isoTime(error.nextRequestAt),
            Date.now() + (error.retryAfterSeconds ?? 60) * 1000,
          ),
        );
        setNow(Date.now());
      }
    },
  };
}
