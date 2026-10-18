import { useCallback, useEffect, useState } from "react";
import {
  getStoredVerificationRecord,
  type CompanyVerificationRecord,
} from "@/services/companyVerification";
import {
  COMPANY_WORKSPACE_EVENT,
  getCompanyWorkspace,
  currentMember,
  getCurrentUser,
  type CompanyWorkspace,
} from "@/services/companyMembers";

export function useCompanyWorkspace() {
  const [workspace, setWorkspace] = useState<CompanyWorkspace>({
    members: [],
    grants: [],
    jobs: [],
    applications: [],
  });
  const [company, setCompany] = useState<CompanyVerificationRecord | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(() => {
    try {
      setCompany(getStoredVerificationRecord());
      setWorkspace(getCompanyWorkspace());
      setError("");
    } catch {
      setWorkspace({ members: [], grants: [], jobs: [], applications: [] });
      setError("Không thể đọc dữ liệu công ty. Vui lòng thử lại.");
    }
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener(COMPANY_WORKSPACE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(COMPANY_WORKSPACE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  return {
    workspace,
    company,
    member: currentMember(workspace),
    user: getCurrentUser(),
    error,
    refresh,
  };
}
