import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "./useAuthUser";
import { loadAccount } from "@/services/accountControl";
import { loadCurrentUser } from "@/services/auth";
import { loadCandidateProfile } from "@/services/candidateProfile";

export function useAccountIdentity() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["account", user?.id],
    queryFn: loadAccount,
    enabled: user?.role === "USER",
    retry: false,
    staleTime: 0,
  });
}
export function useCandidateProfile(enabled = true) {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["candidate-profile", user?.id],
    queryFn: loadCandidateProfile,
    enabled: enabled && user?.role === "USER",
    retry: false,
    staleTime: 0,
  });
}
export function useRefreshIdentity() {
  const client = useQueryClient();
  return async () => {
    const results = await Promise.all([
      client.invalidateQueries({ queryKey: ["account"] }),
      client.invalidateQueries({ queryKey: ["candidate-profile"] }),
      client.invalidateQueries({ queryKey: ["current-user"] }),
      loadCurrentUser(),
    ]);
    return results[3];
  };
}
