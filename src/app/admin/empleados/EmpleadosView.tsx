"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";

export function EmpleadosView({ initialEmployees }: { initialEmployees: Profile[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage(null);

    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    setInviting(false);

    if (!res.ok) {
      setMessage(body.error);
      return;
    }

    setMessage(`${email} ahora es empleado.`);
    setEmail("");
    window.location.reload();
  }

  async function handleRemove(employeeId: string) {
    setRemovingId(employeeId);
    setMessage(null);

    const res = await fetch("/api/admin/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });
    const body = await res.json();
    setRemovingId(null);

    if (!res.ok) {
      setMessage(body.error);
      return;
    }

    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleInvite} className="space-y-3 rounded-3xl border border-bordercolor bg-white p-5">
        <label className="text-sm font-bold text-primary">Correo del empleado</label>
        <p className="text-xs text-muted">La cuenta debe existir ya (pídele que se registre primero en /login).</p>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="flex-1 rounded-2xl border border-bordercolor px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={inviting}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {inviting ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </form>

      {message && <p className="text-sm text-muted">{message}</p>}

      {!employees.length ? (
        <p className="rounded-3xl border border-dashed border-bordercolor bg-white p-5 text-sm text-muted">
          Aún no tienes empleados. Pueden escanear, ver clientes y canjear cupones, pero no configurar
          promociones ni el perfil del negocio.
        </p>
      ) : (
        <ul className="grid gap-3">
          {employees.map((employee) => (
            <li
              key={employee.id}
              className="flex items-center justify-between gap-3 rounded-3xl border border-bordercolor bg-white p-4"
            >
              <div>
                <p className="font-bold text-primary">{employee.full_name || "Sin nombre"}</p>
                <p className="text-sm text-muted">{employee.email}</p>
              </div>
              <button
                type="button"
                disabled={removingId === employee.id}
                onClick={() => handleRemove(employee.id)}
                className="rounded-2xl border border-bordercolor px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {removingId === employee.id ? "Quitando..." : "Quitar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
