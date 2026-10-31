import { authenticatedFetch, authenticatedRequest } from "./auth.ts";
import { ApiError } from "./api.ts";

export interface CandidateCv {
  id: string;
  candidateId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  publicId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadSignature {
  url: string;
  apiKey: string;
  timestamp: string;
  signature: string;
  publicId: string;
}

export interface DownloadUrl {
  url: string;
  apiKey: null;
  timestamp: null;
  signature: null;
  publicId: string;
}

function mapCv(value: unknown): CandidateCv {
  const cv = value as Partial<CandidateCv>;
  if (!cv || typeof cv.id !== "string" || typeof cv.fileName !== "string") {
    throw new ApiError("Phản hồi hồ sơ xin việc không hợp lệ.", 500);
  }
  return {
    id: cv.id,
    candidateId: String(cv.candidateId ?? ""),
    fileName: cv.fileName,
    fileSize: Number(cv.fileSize ?? 0),
    contentType: cv.contentType ?? "",
    publicId: cv.publicId ?? "",
    isDefault: Boolean(cv.isDefault),
    createdAt: cv.createdAt ?? new Date().toISOString(),
    updatedAt: cv.updatedAt ?? new Date().toISOString(),
  };
}

export async function listCandidateCvs(): Promise<CandidateCv[]> {
  const data = await authenticatedRequest("/v1/candidate/cvs");
  if (!Array.isArray(data)) return [];
  return data.map(mapCv);
}

export async function requestCvUploadUrl(consentGiven: boolean): Promise<UploadSignature> {
  const data = await authenticatedRequest("/v1/candidate/cvs/upload-url", {
    method: "POST",
    body: JSON.stringify({ consentGiven }),
  });
  const value = data as Partial<UploadSignature>;
  if (!value?.url || !value?.publicId) {
    throw new ApiError("Phản hồi đường dẫn tải lên không hợp lệ.", 500);
  }
  return {
    url: value.url,
    apiKey: value.apiKey ?? "",
    timestamp: value.timestamp ?? "",
    signature: value.signature ?? "",
    publicId: value.publicId,
  };
}

export async function registerCandidateCv(
  fileName: string,
  publicId: string,
): Promise<CandidateCv> {
  const data = await authenticatedRequest("/v1/candidate/cvs", {
    method: "POST",
    body: JSON.stringify({ fileName, publicId }),
  });
  return mapCv(data);
}

export function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
  onProgress: (percent: number) => void,
): Promise<{ public_id?: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", signature.timestamp);
    form.append("signature", signature.signature);
    form.append("public_id", signature.publicId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signature.url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({ public_id: signature.publicId });
        }
      } else {
        reject(new ApiError("Tải tệp lên dịch vụ lưu trữ thất bại.", xhr.status || 503));
      }
    };
    xhr.onerror = () => reject(new ApiError("Lỗi mạng khi tải tệp lên.", 0));
    xhr.send(form);
  });
}

export async function getCvDownloadUrl(id: string): Promise<DownloadUrl> {
  const data = await authenticatedRequest(`/v1/candidate/cvs/${id}/download-url`);
  const value = data as Partial<DownloadUrl>;
  if (!value?.url) throw new ApiError("Không tạo được liên kết tải xuống.", 500);
  return {
    url: value.url,
    apiKey: null,
    timestamp: null,
    signature: null,
    publicId: value.publicId ?? "",
  };
}

export function unwrapApiData<T>(payload: unknown): T {
  if (payload !== null && typeof payload === "object" && "data" in payload && "status" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

// Aliases for compatibility with the integration document naming.
export const getCandidateCvs = listCandidateCvs;
export const registerCv = registerCandidateCv;
export const getDownloadUrl = getCvDownloadUrl;
