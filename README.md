# Lealtad MVP

Aplicativo de recompensas y lealtad. Cada cliente tiene un QR único; el negocio
lo escanea para registrar compras y otorgar recompensas automáticamente
(ej. 6 compras → producto gratis).

## Paneles

- **Portal del cliente** (`/portal`): QR propio, cupones vigentes, progreso por negocio, historial de movimientos.
- **Panel de negocio** (`/admin`): escaneo de QR para registrar compras, configuración del programa de lealtad, transacciones del negocio.
- **Super admin** (`/superadmin`): alta de negocios, activar/suspender, asignar administradores, transacciones globales.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind — desplegado en **Vercel**.
- Supabase: Postgres + Auth + Row Level Security — toda la lógica de negocio
  (registrar compra, emitir cupón, canjear cupón) vive en funciones
  `SECURITY DEFINER` (`supabase/schema.sql`), no en el cliente.
- `@zxing/browser` para escanear QR con la cámara; `qrcode.react` para generarlo.

No hay nada que corra localmente de forma permanente: los secrets viven en
**Vercel** (env vars del proyecto) y en **Supabase** (API keys del proyecto).

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre el **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
   Esto crea las tablas, políticas RLS y las funciones `register_purchase` / `redeem_coupon`.
3. En **Authentication → Providers**, deja Email habilitado (Magic link u OTP opcional).
4. En **Authentication → URL Configuration**, agrega la URL de tu despliegue de Vercel.
5. Copia de **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secreta, solo servidor)
6. Crea el primer super admin: registra una cuenta desde `/login`, luego en el
   **Table Editor → profiles**, edita esa fila y pon `role = super_admin`.

### 2. GitHub

```bash
git init
git add .
git commit -m "MVP app de lealtad"
git branch -M main
git remote add origin <tu-repo-url>
git push -u origin main
```

### 3. Vercel

1. Importa el repo de GitHub en [vercel.com](https://vercel.com).
2. En **Settings → Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (marca como "Sensitive"/solo servidor)
3. Deploy. Vercel detecta Next.js automáticamente (`npm install && npm run build`).

### 4. Flujo de uso

1. **Super admin** crea un negocio desde `/superadmin` y asigna un administrador por correo.
2. El **administrador del negocio** entra a `/admin/programa` y configura las compras
   necesarias y la recompensa (ej. 6 compras → pan gratis).
3. El **cliente** se registra en `/login`, ve su QR en `/portal`.
4. El negocio abre `/admin/scan`, escanea el QR del cliente en cada compra.
   Al llegar al umbral, se emite un cupón automáticamente (vía `register_purchase`).
5. El cliente ve su cupón vigente en `/portal`; el negocio lo marca como canjeado
   llamando a `redeem_coupon` (se puede exponer un botón de canje en una iteración futura).

## Desarrollo local (opcional)

Si en algún momento quieres correrlo localmente:

```bash
npm install
cp .env.example .env.local   # rellena con tus valores de Supabase
npm run dev
```

## Notas de seguridad

- Toda escritura de transacciones/cupones pasa por funciones `SECURITY DEFINER`
  en Postgres que validan el rol del usuario (`register_purchase`, `redeem_coupon`),
  así que el cliente nunca puede inventar compras o cupones directamente.
- La `service_role` key solo se usa en una ruta de servidor (`/api/superadmin/assign-admin`)
  protegida por verificación de rol `super_admin`.
