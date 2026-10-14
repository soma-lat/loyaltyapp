"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  return (
    <div className="inline-block rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
