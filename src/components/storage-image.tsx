import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_MARKER = "/storage/v1/object/public/";
const PROTOCOL = "storage://";

/** Turns a private-bucket URL/path into a temporary signed URL. */
export function useStorageUrl(src: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(src ?? null);

  useEffect(() => {
    let cancelled = false;
    const raw = (src ?? "").trim();
    if (!raw) {
      setUrl(null);
      return;
    }

    let bucket: string | null = null;
    let path: string | null = null;

    if (raw.startsWith(PROTOCOL)) {
      const rest = raw.slice(PROTOCOL.length);
      const slash = rest.indexOf("/");
      if (slash > 0) {
        bucket = rest.slice(0, slash);
        path = rest.slice(slash + 1);
      }
    } else {
      const idx = raw.indexOf(PUBLIC_MARKER);
      if (idx >= 0) {
        const rest = raw.slice(idx + PUBLIC_MARKER.length);
        const slash = rest.indexOf("/");
        if (slash > 0) {
          bucket = rest.slice(0, slash);
          path = decodeURIComponent(rest.slice(slash + 1).split("?")[0]);
        }
      }
    }

    if (!bucket || !path) {
      setUrl(raw);
      return;
    }

    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? raw);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return url;
}

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { src?: string | null };

export function StorageImage({ src, ...rest }: Props) {
  const resolved = useStorageUrl(src);
  if (!resolved) return null;
  return <img {...rest} src={resolved} />;
}
