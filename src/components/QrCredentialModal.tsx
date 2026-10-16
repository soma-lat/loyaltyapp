"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { QrCode } from "@/components/QrCode";
import { QrIcon } from "@/components/icons";

// El QR codifica el id del usuario: /admin/scan lo pasa tal cual a register_purchase
export function QrCredentialModal({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [open, setOpen] = useState(false);
  const shortId = memberId.slice(0, 8).toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-base font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <QrIcon className="h-6 w-6" />
        Mostrar mi QR
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tu credencial">
        <div className="flex flex-col items-center gap-4 text-center">
          <QrCode value={memberId} size={220} />
          <div>
            <p className="font-bold text-primary">{memberName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">ID de socio {shortId}</p>
          </div>
          <p className="text-sm text-muted">Muestra este código en caja para registrar tu compra.</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Listo
          </button>
        </div>
      </Modal>
    </>
  );
}
