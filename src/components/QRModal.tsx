import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { ShortLink } from "../lib/store";
import { displayShortUrl, shortUrlFor } from "../lib/store";

interface Props {
  link: ShortLink;
  onClose: () => void;
}

export default function QRModal({ link, onClose }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${link.code}.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">QR Code</h3>
            <p className="mt-0.5 text-xs font-medium text-indigo-600">{displayShortUrl(link.code)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div ref={wrapRef} className="mt-5 flex justify-center rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <QRCodeCanvas
            value={shortUrlFor(link.code)}
            size={200}
            level="M"
            marginSize={2}
            fgColor="#1e1b4b"
            bgColor="#ffffff"
          />
        </div>

        <p className="mt-3 truncate text-center text-[11px] text-slate-400" title={link.longUrl}>
          → {link.longUrl}
        </p>

        <button
          onClick={download}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" /><path d="M12 15V3" />
          </svg>
          Download PNG
        </button>
      </div>
    </div>
  );
}
