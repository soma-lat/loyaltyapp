==============================================================================
CONTEXTO DEL PROYECTO: LEALTAD MVP
==============================================================================

1. GENERALIDADES
------------------------------------------------------------------------------
Aplicativo de recompensas y lealtad. Cada cliente tiene un QR unico; el negocio
lo escanea para registrar compras y otorgar recompensas automaticamente
(ejemplo: 6 compras = producto gratis).

Pagina publica (/): landing de marketing (hero, como funciona, para negocios,
para ti, FAQ) con diseño propio (paleta navy/blanco/dorado, tipografia Nunito
via next/font) aislado en CSS Modules; no usa los componentes ni el Tailwind
del resto del sitio. El hero incluye una demo interactiva de tarjeta de
sellos (tilt 3D con mouse/trackpad, animacion idle en touch) y animaciones de
aparicion por scroll en el resto de secciones (respetan
prefers-reduced-motion). La hoja de estilos (src/styles/landing.module.css)
usa una escala de espaciado unica y solo dos breakpoints (700px y 1100px)
para todo el layout responsive. "Crear mi cuenta" lleva a /login?modo=registro;
"Registrar mi negocio" lleva a /login (no hay alta de negocio self-service,
ver seccion 6).

Paneles:
- Portal del cliente (/portal): QR propio (en QrCredentialModal, codifica
  user.id), cupones vigentes, progreso por negocio, historial de movimientos.
  Diseño movil propio con header y navegacion inferior (Inicio y
  Movimientos), tipografia Nunito, tokens primary/accent/surface/
  bordercolor/muted en tailwind.config.ts. No hay puntos ni equivalencia en
  dinero (se usan compras/sellos del modelo actual); no hay seccion de
  Promociones ni Perfil.
- Panel de negocio (/admin): mismo lenguaje visual que el portal (tokens
  compartidos, Nunito, header y bottom nav propios: AdminHeader/
  AdminBottomNav). Secciones: Inicio (resumen del mes + actividad reciente),
  Escanear (acceso directo desde el header), Clientes (lista buscable; cada
  cliente abre un modal con su progreso y boton "Canjear" que llama a
  redeem_coupon), Compras (historial con filtro Todas/Compras/Canjes y
  paginado), Informes (resumen del mes, tendencia de 14 dias, ranking de
  clientes frecuentes) y Programa (configuracion del programa de lealtad).
  Clientes, Compras y Programa resuelven sus datos en el servidor (page.tsx)
  y los pasan como props a una vista cliente.
- Super admin (/superadmin): alta de negocios, activar/suspender, asignar
  administradores (src/app/superadmin/negocios/[id]/), transacciones
  globales.

2. STACK Y DESPLIEGUE
------------------------------------------------------------------------------
- Next.js 14 (App Router) + TypeScript + Tailwind, desplegado en Vercel.
- Supabase: Postgres + Auth + Row Level Security (RLS).
- Logica de negocio en funciones SECURITY DEFINER (register_purchase,
  redeem_coupon), no en el cliente.
- @zxing/browser para escanear QR con la camara; qrcode.react para generarlo.
- Proyecto Supabase: LOYALTYAPP (ref iflgodmgofocejxkkbhk).

Variables de entorno (en Vercel):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (secreta, solo servidor)
Nota: las variables NEXT_PUBLIC_* se incorporan en el build; si se cambian
hay que hacer Redeploy.

3. ROLES
------------------------------------------------------------------------------
Columna profiles.role (texto con CHECK):
- customer        : valor por defecto, cliente final.
- business_admin  : administrador de un negocio (requiere business_id).
- super_admin     : administrador global.

4. CONFIGURACION DE SUPABASE AUTH
------------------------------------------------------------------------------
- Enable email provider: ON
- Allow new users to sign up: ON
- Allow manual linking: OFF
- Allow anonymous sign-ins: OFF
- Confirm email: OFF (temporal, mientras no haya SMTP propio)
- SMTP: el predeterminado de Supabase (limite bajo de envios, solo para
  pruebas; no hay dominio propio configurado).

Reglas operativas para evitar rebotes de correo:
- Crear usuarios de prueba en Authentication > Users > Add user > Create new
  user con "Auto Confirm User" (no envia correo).
- No usar Invite user, recuperar contrasena ni magic link con correos
  inventados.
- Para pruebas con correo real usar alias de Gmail (usuario+prueba1@gmail.com).
- Borrar un usuario implica borrarlo en Authentication > Users; borrar solo la
  fila de profiles no libera el correo.

5. BASE DE DATOS
------------------------------------------------------------------------------
El esquema vive en supabase/schema.sql mas los archivos de
supabase/migrations/ (numerados, se ejecutan a mano en el SQL editor de
Supabase). Para conocer el estado real de una tabla, funcion o politica hay
que revisar ambos: schema.sql no se edita directamente, cada cambio de base
de datos se agrega como una migracion nueva.

Tablas:

businesses
  id uuid PK | name text | slug text unique | status (active, suspended,
  trial; default trial) | plan (free, pro, enterprise; default free) |
  created_at

profiles (extiende auth.users, on delete cascade)
  id uuid PK -> auth.users | full_name text | role text (default customer) |
  business_id uuid -> businesses (on delete set null) | email text |
  phone text | created_at
  (email se copia de auth.users al registrarse y se mantiene sincronizado si
  el usuario lo cambia; phone es opcional, capturado en /login)

loyalty_programs
  id | business_id -> businesses | name (default "Programa de lealtad") |
  purchases_required int > 0 (default 6) | reward_description (default
  "Producto gratis") | active boolean (default true) | created_at

customer_business_progress (una fila por cliente y negocio)
  id | customer_id -> profiles | business_id -> businesses |
  purchases_count int (default 0) | updated_at | unique (customer_id,
  business_id)

transactions
  id | business_id | customer_id | registered_by -> profiles |
  type (purchase, redemption) | amount numeric(12,2) | note | created_at

coupons
  id | customer_id | business_id | loyalty_program_id | reward_description |
  status (available, redeemed, expired; default available) | created_at |
  redeemed_at

Funciones auxiliares (SECURITY DEFINER, usadas por RLS):
- current_profile_role() : rol del usuario autenticado.
- current_business_id()  : negocio del usuario autenticado.

Funciones de negocio (SECURITY DEFINER):
- register_purchase(p_customer_id, p_amount, p_note)
    Solo business_admin. Valida cliente y programa activo, inserta la
    transaccion, suma al progreso y, al llegar al umbral, emite un cupon y
    reinicia el contador a 0.
- redeem_coupon(p_coupon_id)
    Solo business_admin del mismo negocio. Marca el cupon como redeemed y
    registra una transaccion de tipo redemption.

Triggers:
- on_auth_user_created -> handle_new_user(): crea el perfil como customer al
  registrarse un usuario en auth.users, copiando full_name, email y phone.
- on_auth_user_email_updated -> sync_profile_email(): mantiene profiles.email
  sincronizado si el usuario cambia su correo.
- prevent_profile_privilege_escalation (BEFORE UPDATE en profiles): revierte
  cambios a role/business_id si quien actualiza no es super_admin ni
  service_role.

Politicas RLS (resumen):
- businesses: super_admin todo; business_admin lee el suyo; customer lee los
  negocios con los que tiene progreso o algun cupon.
- profiles: cada usuario lee y actualiza el propio (el trigger
  prevent_profile_privilege_escalation bloquea cambios a role/business_id
  salvo super_admin o service_role); super_admin lee todos; business_admin
  lee clientes con progreso en su negocio.
- loyalty_programs: super_admin todo; business_admin gestiona los de su
  negocio; cualquiera lee los activos.
- customer_business_progress, transactions: lectura para super_admin,
  business_admin (su negocio) y cliente (lo propio).
- coupons: lectura igual que lo anterior; las escrituras pasan solo por
  register_purchase y redeem_coupon, no hay update directo de columnas.
- Las escrituras de transacciones, progreso y cupones pasan solo por las
  funciones RPC.

6. FLUJO FUNCIONAL
------------------------------------------------------------------------------
1. Super admin entra a /superadmin y crea un negocio.
2. Super admin asigna un administrador por correo (la cuenta debe existir; la
   ruta usa la service_role key). El perfil queda como business_admin con
   business_id.
3. El administrador entra a /admin/programa y configura compras necesarias y
   recompensa.
4. El cliente se registra en /login (sin correo de confirmacion) y ve su QR
   en /portal.
5. El negocio abre /admin/scan y escanea el QR en cada compra.
6. Al llegar al umbral se emite un cupon automaticamente.
7. El cliente ve su cupon en /portal. El negocio lo canjea desde el modal de
   cliente en /admin (boton "Canjear", llama a redeem_coupon).

Primer super admin: registrar una cuenta, luego en Table Editor > profiles
poner role = super_admin.

No existe alta de negocio self-service: el registro de negocios lo hace
unicamente el super admin desde /superadmin.

7. ESTRUCTURA DE CARPETAS (GITHUB)
------------------------------------------------------------------------------
src/
  app/
    admin/
      clientes/ (page.tsx, ClientesView.tsx)
      compras/ (page.tsx, ComprasView.tsx)
      informes/page.tsx
      programa/ (page.tsx, ProgramaView.tsx)
      scan/page.tsx
      layout.tsx
      page.tsx
    api/superadmin/assign-admin/route.ts
    login/page.tsx
    portal/
      movimientos/page.tsx
      layout.tsx
      page.tsx
    superadmin/
      negocios/[id]/ (page.tsx, AssignAdminForm.tsx, BusinessStatusControl.tsx)
      NewBusinessForm.tsx
      page.tsx
    globals.css
    layout.tsx      (metadata + viewport con manifest PWA)
    page.tsx        (pagina de inicio publica, ver seccion 1)
  components/
    NavBar.tsx          (nav de paneles autenticados: admin/portal/superadmin,
                         responsivo con menu hamburguesa en mobile)
    AdminHeader.tsx / AdminBottomNav.tsx  (nav propio del panel de negocio)
    PortalHeader.tsx / BottomNav.tsx      (nav propio del portal del cliente)
    PublicHeader.tsx    (nav de la pagina de inicio publica)
    FaqAccordion.tsx    (acordeon de preguntas frecuentes de la home)
    LoyaltyCardDemo.tsx (demo interactiva de sellos en el hero de la home)
    Reveal.tsx          (animacion de aparicion por scroll, usada en la home)
    QrCode.tsx / QrScanner.tsx / QrCredentialModal.tsx
    CouponCard.tsx / ProgressCard.tsx / StatCard.tsx / TransactionItem.tsx
    TrendChart.tsx / Modal.tsx / Toast.tsx / icons.tsx
  styles/
    landing.module.css (estilos de la pagina de inicio, CSS Modules)
  lib/
    supabase/
      admin.ts      (cliente con service_role, solo servidor)
      client.ts     (cliente del navegador)
      server.ts     (cliente del servidor)
    fonts.ts        (Nunito/IBM Plex Mono via next/font/local, autohospedadas
                     en src/fonts/ para que el build no dependa de red)
    types.ts
  fonts/            (archivos .woff2 usados por lib/fonts.ts)
  middleware.ts
public/
  manifest.webmanifest
  icon-192.png
  icon-512.png
  icon-maskable-512.png
  apple-touch-icon.png
  favicon-32.png
supabase/
  schema.sql
  migrations/ (cambios de base de datos posteriores a schema.sql, uno por
  archivo, numerados)
.env.example
.gitignore
README.md
next.config.mjs
package.json
postcss.config.js
tailwind.config.ts
tsconfig.json

8. ESTADO DE RAMAS
------------------------------------------------------------------------------
Todo el trabajo vive en main; no hay ramas adicionales abiertas en local ni
en origin.
