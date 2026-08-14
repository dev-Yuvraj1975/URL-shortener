import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function useQr(text: string, size = 220, dark = "#0b1020") {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark, light: "#ffffff" },
    })
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [text, size, dark]);
  return src;
}

export function QrCard({ value, label, onClose }: { value: string; label: string; onClose: () => void }) {
  const src = useQr(value, 320);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">QR code</p>
        <p className="mt-1 truncate font-mono text-sm text-indigo-300">{label}</p>
        <div className="mt-4 flex justify-center">
          {src ? (
            <img src={src} alt="QR code" className="rounded-xl bg-white p-3" width={260} height={260} />
          ) : (
            <div className="h-[260px] w-[260px] animate-pulse rounded-xl bg-white/10" />
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <a
            href={src || "#"}
            download={`${label.replace(/[^a-z0-9]/gi, "-")}.png`}
            className="flex-1 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Download PNG
          </a>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
