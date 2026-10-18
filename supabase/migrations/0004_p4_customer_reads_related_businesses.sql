-- ============================================================================
-- Pendiente P4 (CLAUDE.md sección 8): el portal del cliente
-- (src/app/portal/page.tsx) hace joins embebidos "businesses:business_id(id,
-- name)" sobre customer_business_progress y coupons para mostrar el nombre
-- del negocio (p.ej. líneas 64 y 87, con fallback `?? ""`).
--
-- En schema.sql, las únicas políticas de SELECT sobre businesses son para
-- super_admin y business_admin (su propio negocio); no existe ninguna para
-- el rol customer. Con RLS activo, el join embebido de PostgREST aplica RLS
-- también a la tabla referenciada, así que para un customer ese join siempre
-- devuelve null y el "?? ''" lo tapa en silencio: el nombre del negocio sale
-- vacío en /portal.
--
-- Corrección: agregar una política de SELECT para customer, acotada a los
-- negocios con los que tiene una relación real (progreso registrado o algún
-- cupón), no abierta a toda la tabla.
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

create policy "customer reads related businesses" on public.businesses
  for select using (
    exists (
      select 1 from public.customer_business_progress p
      where p.business_id = businesses.id and p.customer_id = auth.uid()
    )
    or exists (
      select 1 from public.coupons c
      where c.business_id = businesses.id and c.customer_id = auth.uid()
    )
  );
