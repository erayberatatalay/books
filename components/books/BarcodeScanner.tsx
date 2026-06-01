"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

const SCAN_HINTS = new Map<DecodeHintType, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128],
  ],
  [DecodeHintType.TRY_HARDER, true],
]);

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
  },
};

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
};

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector ?? null;
}

function applyAutofocus(track: MediaStreamTrack): void {
  const caps = track.getCapabilities?.() as MediaTrackCapabilities & {
    focusMode?: string[];
  };
  if (caps?.focusMode?.includes("continuous")) {
    track
      .applyConstraints({
        advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
      })
      .catch(() => {});
  }
}

export function BarcodeScanner({
  onDetected,
  active,
}: {
  /** true dönerse tarama durur; false ise okumaya devam eder. */
  onDetected: (code: string) => boolean;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const stopNativeRef = useRef<(() => void) | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const stopAll = useCallback(() => {
    stopNativeRef.current?.();
    stopNativeRef.current = null;
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await BrowserMultiFormatReader.mediaStreamSetTorch(track, next);
      setTorchOn(next);
    } catch {
      // Torch desteklenmiyorsa sessizce yoksay.
    }
  }, [torchOn]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    setStarting(true);
    setError(null);
    setTorchOn(false);
    setTorchAvailable(false);

    async function startNativeLoop(
      video: HTMLVideoElement,
      Detector: BarcodeDetectorCtor
    ) {
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "code_128"],
      });
      let running = true;
      stopNativeRef.current = () => {
        running = false;
      };

      while (running && !cancelled) {
        if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          try {
            const codes = await detector.detect(video);
            const match = codes.find((c) => c.rawValue?.trim());
            if (match && onDetectedRef.current(match.rawValue.trim())) {
              stopAll();
              return;
            }
          } catch {
            // Kare okunamadı; bir sonraki denemeye geç.
          }
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    }

    async function startZxing(
      video: HTMLVideoElement
    ): Promise<IScannerControls> {
      const reader = new BrowserMultiFormatReader(SCAN_HINTS, {
        delayBetweenScanAttempts: 50,
        delayBetweenScanSuccess: 400,
      });

      return reader.decodeFromVideoElement(video, (result) => {
        if (!result || cancelled) return;
        const text = result.getText()?.trim();
        if (text && onDetectedRef.current(text)) {
          stopAll();
        }
      });
    }

    async function start() {
      const video = videoRef.current;
      if (!video) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          VIDEO_CONSTRAINTS
        );
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        const track = stream.getVideoTracks()[0];
        applyAutofocus(track);
        setTorchAvailable(
          BrowserMultiFormatReader.mediaStreamIsTorchCompatibleTrack(track)
        );

        const NativeDetector = getBarcodeDetector();
        if (NativeDetector) {
          void startNativeLoop(video, NativeDetector);
        } else {
          const controls = await startZxing(video);
          if (cancelled) {
            controls.stop();
            return;
          }
          controlsRef.current = controls;
        }

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
      stopAll();
    };
  }, [active, stopAll]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black sm:aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-28 w-[92%] rounded-lg border-2 border-brand-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          <p className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">
            ISBN barkodunu yatay hizala
          </p>
        </div>
        {torchAvailable && !starting && !error && (
          <button
            type="button"
            onClick={toggleTorch}
            className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-2 text-sm text-white backdrop-blur hover:bg-black/75"
            aria-pressed={torchOn}
          >
            {torchOn ? "🔦 Flaş Kapat" : "🔦 Flaş Aç"}
          </button>
        )}
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
        <ul className="space-y-1 text-center text-sm text-gray-500">
          <li>Barkodu çerçevenin içine getirin, 15–20 cm mesafe deneyin.</li>
          <li>Netleşmesi için telefonu sabit tutun veya yavaşça yaklaştırın.</li>
        </ul>
      )}
    </div>
  );
}
