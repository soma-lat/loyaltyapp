"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    const reader = new BrowserQRCodeReader();
    let controls: { stop: () => void } | undefined;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result) => {
          if (result && activeRef.current) {
            onResult(result.getText());
          }
        }
      )
      .then((c) => {
        controls = c;
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo acceder a la cámara"));

    return () => {
      activeRef.current = false;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <video ref={videoRef} className="w-full rounded-lg bg-black" muted />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
