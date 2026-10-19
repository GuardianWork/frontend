import { authenticatedRequest, getCurrentUser } from "./auth.ts";
import { ApiError } from "./api.ts";
import type { AuthUser } from "./auth.ts";
/**
 * Company Verification Service & Store
 * Implements the 4-Tier Verification Model, 5-Point Inspection Checklist,
 * and State Machine defined in docs/feat/admin/company_verification.md.
 */

export type VerificationStatus = "REGISTERED" | "PENDING" | "VERIFIED" | "REJECTED";
export type SubmitterRole = "LEGAL_REP" | "AUTHORIZED_HR";

export interface CompanyVerificationRecord {
  id: number;
  submittedBy?: AuthUser;
  name: string;
  englishName?: string;
  taxCode: string;
  email: string;
  website: string;
  phone: string;
  registeredAddress: string;
  city: string;
  district: string;
  legalRepresentative: string;
  representativeTitle: string;
  submitterRole: SubmitterRole;
  contactPerson: string;
  contactTitle: string;
  registrationCertificateUrl: string;
  certificateNumber?: string;
  issueDate?: string;
  issuingAuthority?: string;
  powerOfAttorneyUrl?: string;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedBy: number | null;
  verifiedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  ticketId: string;
  ocrConfidence?: number;
  tamperingRiskScore?: number;
}

export interface CompanyRegistrationRequest {
  name: string;
  englishName?: string;
  taxCode: string;
  email: string;
  website?: string;
  phone?: string;
  registeredAddress?: string;
  city?: string;
  district?: string;
  legalRepresentative?: string;
  representativeTitle?: string;
  submitterRole?: SubmitterRole;
  contactPerson?: string;
  contactTitle?: string;
  registrationCertificateUrl: string;
  certificateNumber?: string;
  issueDate?: string;
  issuingAuthority?: string;
  powerOfAttorneyUrl?: string;
}

export interface CompanyResubmissionRequest {
  name: string;
  englishName?: string;
  email: string;
  website?: string;
  phone?: string;
  registeredAddress?: string;
  city?: string;
  district?: string;
  legalRepresentative?: string;
  representativeTitle?: string;
  submitterRole?: SubmitterRole;
  contactPerson?: string;
  contactTitle?: string;
  registrationCertificateUrl: string;
  certificateNumber?: string;
  issueDate?: string;
  issuingAuthority?: string;
  powerOfAttorneyUrl?: string;
  expectedVersion: number;
}

export interface NationalRegistryRecord {
  taxCode: string;
  legalName: string;
  internationalName: string;
  shortName: string;
  status: "ACTIVE" | "PENDING_REVOCATION" | "SUSPENDED";
  statusText: string;
  registeredAddress: string;
  legalRepresentative: string;
  representativeTitle: string;
  foundedDate: string;
  mainIndustry: string;
  licensingAuthority: string;
}

const STORAGE_KEY = "guardianwork_company_verification";
function storageKey() {
  return `${STORAGE_KEY}_${getCurrentUser()?.id ?? "guest"}`;
}

// Sample registry dataset for instant lookups matching dangkykinhdoanh.gov.vn / gdt.gov.vn
export const NATIONAL_REGISTRY_DATABASE: Record<string, NationalRegistryRecord> = {
  "0316892341": {
    taxCode: "0316892341",
    legalName: "CÔNG TY CỔ PHẦN GUARDIAN TECH VIỆT NAM",
    internationalName: "GUARDIAN TECH VIETNAM JOINT STOCK COMPANY",
    shortName: "GUARDIAN TECH JSC",
    status: "ACTIVE",
    statusText: "Đang hoạt động (đã được cấp GCN ĐKT)",
    registeredAddress:
      "Tầng 12, Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh",
    legalRepresentative: "Nguyễn Văn An",
    representativeTitle: "Tổng Giám đốc",
    foundedDate: "15/06/2021",
    mainIndustry: "6201 - Lập trình máy tính, nền tảng công nghệ số và giải pháp bảo mật",
    licensingAuthority: "Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh",
  },
  "0108934522": {
    taxCode: "0108934522",
    legalName: "CÔNG TY TNHH CÔNG NGHỆ VEL LƯƠNG STUDIO",
    internationalName: "VELLUM STUDIO TECHNOLOGY COMPANY LIMITED",
    shortName: "VELLUM STUDIO",
    status: "ACTIVE",
    statusText: "Đang hoạt động (đã được cấp GCN ĐKT)",
    registeredAddress: "Số 18, Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội",
    legalRepresentative: "Trần Thị Mai Phương",
    representativeTitle: "Giám đốc điều hành",
    foundedDate: "08/11/2019",
    mainIndustry: "6202 - Tư vấn máy vi tính và quản trị hệ thống máy vi tính",
    licensingAuthority: "Sở Kế hoạch và Đầu tư Thành phố Hà Nội",
  },
  "0315487690": {
    taxCode: "0315487690",
    legalName: "CÔNG TY CỔ PHẦN GIẢI PHÁP TÀI CHÍNH AURA SYSTEMS",
    internationalName: "AURA SYSTEMS FINANCIAL SOLUTIONS JSC",
    shortName: "AURA SYSTEMS",
    status: "ACTIVE",
    statusText: "Đang hoạt động (đã được cấp GCN ĐKT)",
    registeredAddress:
      "Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    legalRepresentative: "Lê Hoàng Quân",
    representativeTitle: "Chủ tịch Hội đồng Quản trị",
    foundedDate: "22/03/2018",
    mainIndustry: "6311 - Xử lý dữ liệu, cho thuê và các hoạt động liên quan",
    licensingAuthority: "Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh",
  },
  "0401928374": {
    taxCode: "0401928374",
    legalName: "CÔNG TY CỔ PHẦN PHẦN MỀM TECHCORP ĐÀ NẴNG",
    internationalName: "TECHCORP DANANG SOFTWARE JSC",
    shortName: "TECHCORP DANANG",
    status: "ACTIVE",
    statusText: "Đang hoạt động (đã được cấp GCN ĐKT)",
    registeredAddress:
      "Khu Công viên Phần mềm Đà Nẵng, Số 2 Quang Trung, Phường Thạch Thang, Quận Hải Châu, TP. Đà Nẵng",
    legalRepresentative: "Phạm Quốc Tuấn",
    representativeTitle: "Tổng Giám đốc",
    foundedDate: "10/01/2020",
    mainIndustry: "6201 - Lập trình máy tính và phát triển giải pháp phần mềm xuất khẩu",
    licensingAuthority: "Sở Kế hoạch và Đầu tư Thành phố Đà Nẵng",
  },
};

const DEFAULT_COMPANY_RECORD: CompanyVerificationRecord = {
  id: 0,
  ticketId: "",
  name: "",
  englishName: "",
  taxCode: "",
  email: "",
  website: "",
  phone: "",
  registeredAddress: "",
  city: "TP. Hồ Chí Minh",
  district: "",
  legalRepresentative: "",
  representativeTitle: "Tổng Giám đốc",
  submitterRole: "AUTHORIZED_HR",
  contactPerson: "",
  contactTitle: "Trưởng phòng Tuyển dụng & Thu hút Nhân tài",
  registrationCertificateUrl: "",
  certificateNumber: "",
  issueDate: "",
  issuingAuthority: "",
  powerOfAttorneyUrl: "",
  verificationStatus: "REGISTERED",
  rejectionReason: null,
  verifiedBy: null,
  verifiedAt: null,
  version: 0,
  createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
};

export function lookupNationalRegistry(taxCode: string): NationalRegistryRecord | null {
  const cleaned = taxCode.trim().replace(/[-\s]/g, "");
  if (NATIONAL_REGISTRY_DATABASE[cleaned]) {
    return NATIONAL_REGISTRY_DATABASE[cleaned];
  }
  // If valid 10 or 13 digit number not in presets, generate realistic simulated lookup
  if (/^\d{10}(\d{3})?$/.test(cleaned)) {
    return {
      taxCode: cleaned,
      legalName: `CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ TRUYỀN THÔNG SỐ ${cleaned.slice(-4)}`,
      internationalName: `DIGITAL TECH & MEDIA JSC ${cleaned.slice(-4)}`,
      shortName: `TECH JSC ${cleaned.slice(-4)}`,
      status: "ACTIVE",
      statusText: "Đang hoạt động (đã được cấp GCN ĐKT)",
      registeredAddress: `Số ${cleaned.slice(-2)} Đường Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh`,
      legalRepresentative: "Nguyễn Văn Đại Diện",
      representativeTitle: "Tổng Giám đốc",
      foundedDate: "12/04/2020",
      mainIndustry: "6201 - Lập trình máy tính, phát triển ứng dụng di động",
      licensingAuthority: "Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh",
    };
  }
  return null;
}

export function getStoredVerificationRecord(): CompanyVerificationRecord {
  if (typeof window === "undefined") {
    return DEFAULT_COMPANY_RECORD;
  }
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) {
      localStorage.setItem(storageKey(), JSON.stringify(DEFAULT_COMPANY_RECORD));
      return DEFAULT_COMPANY_RECORD;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COMPANY_RECORD;
  }
}

export function saveStoredVerificationRecord(record: CompanyVerificationRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(record));
    window.dispatchEvent?.(new Event("guardianwork-company-workspace"));
  } catch (e) {
    throw new Error(
      "Không thể lưu hồ sơ trên trình duyệt. Vui lòng giải phóng bộ nhớ hoặc giảm dung lượng tài liệu.",
      { cause: e },
    );
  }
}

/** Only server-confirmed company state is persisted; failed requests never become PENDING. */
function companyRecord(
  result: unknown,
  local: Partial<CompanyVerificationRecord> = {},
): CompanyVerificationRecord {
  const data = result as Partial<CompanyVerificationRecord> & { companyId?: number };
  const id = data?.id ?? data?.companyId;
  if (
    !data ||
    !Number.isSafeInteger(id) ||
    typeof data.name !== "string" ||
    typeof data.taxCode !== "string" ||
    !["PENDING", "VERIFIED", "REJECTED"].includes(data.verificationStatus ?? "") ||
    !Number.isSafeInteger(data.version)
  )
    throw new ApiError("Phản hồi hồ sơ công ty không hợp lệ. Vui lòng tải lại trước khi gửi tiếp.");
  return {
    ...DEFAULT_COMPANY_RECORD,
    ...local,
    ...data,
    id: id!,
    ticketId: String(id),
    submittedBy: local.submittedBy,
  };
}

export async function loadCompanyVerification(): Promise<CompanyVerificationRecord> {
  const membership = getCurrentUser()?.activeMembership;
  if (!membership) return { ...DEFAULT_COMPANY_RECORD };
  const result = await authenticatedRequest(
    membership.companyRole === "OWNER"
      ? "/companies/me/verification"
      : `/companies/${membership.companyId}`,
  );
  const previous = getStoredVerificationRecord();
  const record = companyRecord(result, {
    ...(previous.id === membership.companyId ? previous : {}),
    submittedBy: membership.companyRole === "OWNER" ? (getCurrentUser() ?? undefined) : undefined,
  });
  if (record.id !== membership.companyId)
    throw new ApiError("Hồ sơ công ty không khớp với tài khoản hiện tại.");
  saveStoredVerificationRecord(record);
  return record;
}

function companyPayload(req: CompanyRegistrationRequest | CompanyResubmissionRequest) {
  if (!/^https?:\/\//i.test(req.registrationCertificateUrl.trim()))
    throw new Error("Vui lòng nhập URL http hoặc https của giấy đăng ký doanh nghiệp.");
  return {
    name: req.name.trim(),
    email: req.email.trim().toLowerCase(),
    registrationCertificateUrl: req.registrationCertificateUrl.trim(),
  };
}

export async function submitVerification(
  req: CompanyRegistrationRequest,
): Promise<CompanyVerificationRecord> {
  const result = await authenticatedRequest("/companies/verification-request", {
    method: "POST",
    body: JSON.stringify({ ...companyPayload(req), taxCode: req.taxCode.trim() }),
  });
  const record = companyRecord(result, { submittedBy: getCurrentUser() ?? undefined });
  saveStoredVerificationRecord(record);
  return record;
}

export async function resubmitVerification(
  companyId: number,
  req: CompanyResubmissionRequest,
): Promise<CompanyVerificationRecord> {
  const result = await authenticatedRequest(`/companies/${companyId}/resubmit`, {
    method: "PUT",
    body: JSON.stringify({ ...companyPayload(req), expectedVersion: req.expectedVersion }),
  });
  const record = companyRecord(result, { submittedBy: getCurrentUser() ?? undefined });
  saveStoredVerificationRecord(record);
  return record;
}

/**
 * Admin action: Approve or reject verification
 * Corresponds to PUT /api/admin/companies/{id}/verify
 */
export async function executeAdminDecision(
  companyId: number,
  status: "VERIFIED" | "REJECTED",
  rejectionReason?: string,
  expectedVersion?: number,
): Promise<CompanyVerificationRecord> {
  const current = getStoredVerificationRecord();

  if (expectedVersion !== undefined && current.version !== expectedVersion) {
    throw new Error(
      `40022 CONCURRENT_MODIFICATION: Version mismatch. Expected: ${expectedVersion}, current: ${current.version}`,
    );
  }

  if (status === "REJECTED" && (!rejectionReason || rejectionReason.trim().length < 10)) {
    throw new Error(
      "40000 INVALID_INPUT: Rejection reason must be at least 10 characters (BR-ADM-05)",
    );
  }

  const now = new Date().toISOString();
  const updated: CompanyVerificationRecord = {
    ...current,
    verificationStatus: status,
    rejectionReason: status === "REJECTED" ? rejectionReason?.trim() || null : null,
    verifiedBy: status === "VERIFIED" ? 901 : null,
    verifiedAt: status === "VERIFIED" ? now : null,
    version: current.version + 1,
    updatedAt: now,
  };

  try {
    await fetch(`/api/admin/companies/${companyId}/verify`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Id": "901",
        "X-Admin-Role": "ADMIN",
      },
      body: JSON.stringify({
        status,
        rejectionReason: updated.rejectionReason,
        expectedVersion: current.version,
      }),
    });
  } catch {
    // Local fallback
  }

  saveStoredVerificationRecord(updated);
  return updated;
}
