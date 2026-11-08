import { useEffect, useState } from "react";
import { fetchEvidence } from "@/services/staffDossiers";
import "./staff-evidence.css";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function Preview({ src, type, name }: { src: string; type: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  if (failed)
    return (
      <p className="staff-media-message">
        Không thể hiển thị bản xem trước. Bạn vẫn có thể mở hoặc tải tài liệu.
      </p>
    );
  if (IMAGE_TYPES.has(type))
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="staff-media-image-link"
        aria-label={`Mở ảnh ${name}`}
      >
        <img src={src} alt={name} onError={() => setFailed(true)} referrerPolicy="no-referrer" />
      </a>
    );
  if (type === "application/pdf")
    return showPdf ? (
      <iframe
        src={src}
        title={`Xem trước ${name}`}
        className="staff-media-pdf"
        onError={() => setFailed(true)}
      />
    ) : (
      <div className="staff-media-message">
        <p>Tài liệu PDF · {name}</p>
        <button type="button" className="admin-text-link" onClick={() => setShowPdf(true)}>
          Xem trước PDF
        </button>
      </div>
    );
  return (
    <p className="staff-media-message">
      Định dạng này chưa hỗ trợ xem trước. Tải tài liệu để kiểm tra nội dung.
    </p>
  );
}

export function StaffEvidencePreview({ documentId }: { documentId: string }) {
  const [file, setFile] = useState<{ src: string; type: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setFile(null);
    setError("");
    void fetchEvidence(documentId)
      .then(({ blob, filename }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setFile({ src: objectUrl, type: blob.type.split(";")[0].toLowerCase(), name: filename });
      })
      .catch((cause) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "Không tải được bản xem trước.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, retry]);
  if (error)
    return (
      <div className="staff-media-message" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="admin-text-link"
          onClick={() => setRetry((value) => value + 1)}
        >
          Thử lại bản xem trước
        </button>
      </div>
    );
  if (!file)
    return (
      <p className="staff-media-message" role="status">
        Đang tải bản xem trước…
      </p>
    );
  return (
    <>
      <Preview key={file.src} {...file} />
      <p className="staff-media-filename">{file.name}</p>
    </>
  );
}

/** External images never receive API credentials; unknown file types remain plain links. */
export function ExternalEvidencePreview({ href }: { href: string }) {
  const extension = new URL(href).pathname.split(".").pop()?.toLowerCase();
  const type = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : `image/${extension}`;
  if (!IMAGE_TYPES.has(type))
    return <p className="staff-media-message">Mở tài liệu ở tab mới để xem nội dung.</p>;
  return <Preview key={href} src={href} type={type} name="Giấy đăng ký công ty" />;
}
