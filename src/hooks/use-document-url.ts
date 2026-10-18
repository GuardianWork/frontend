import { useEffect, useState } from "react";

/** Data URLs persist across reloads; Blob URLs allow browser document navigation. */
export function useDocumentUrl(value: string) {
  const [documentUrl, setDocumentUrl] = useState("");
  useEffect(() => {
    if (!value.startsWith("data:")) {
      setDocumentUrl(value);
      return;
    }
    const match = /^data:(application\/pdf|image\/png|image\/jpeg);base64,(.+)$/.exec(value);
    if (!match) {
      setDocumentUrl("");
      return;
    }
    try {
      const binary = atob(match[2]);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: match[1] }));
      setDocumentUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setDocumentUrl("");
    }
  }, [value]);
  return documentUrl;
}
