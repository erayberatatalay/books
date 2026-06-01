"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

export function BarcodeScanner({
  onDetected,
  active,
}: {
  onDetected: (code: string) => void;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    detectedRef.current = false;
    setStarting(true);
    setError(null);

    async function start() {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              onDetected(result.getText());
              controlsRef.current?.stop();
            }
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch (err) {
        if (cancelled) return;
        setStarting(false);
        const name = (err as { name?: string })?.name;
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError(
            "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera erişimine izin verin."
          );
        } else if (name === "NotFoundError") {
          setError("Kamera bulunamadı.");
        } else {
          setError("Kamera başlatılamadı. Cihazınız desteklemiyor olabilir.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, onDetected]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black sm:aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-4/5 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
        </div>
      </div>

      {starting && !error && (
        <p className="text-center text-sm text-gray-500">
          Kamera başlatılıyor...
        </p>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!error && !starting && (
        <p className="text-center text-sm text-gray-500">
          Barkodu çerçevenin içine getirin.
        </p>
      )}
    </div>
  );
}
