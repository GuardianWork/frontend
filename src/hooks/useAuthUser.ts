import { useEffect, useState } from "react";
import { AUTH_SESSION_EVENT, getCurrentUser } from "@/services/auth";
import type { AuthUser } from "@/services/auth";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const update = () => setUser(getCurrentUser());
    update();
    window.addEventListener(AUTH_SESSION_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return user;
}
