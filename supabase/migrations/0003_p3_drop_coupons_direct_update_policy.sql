-- ============================================================================
-- Pendiente P3 (CLAUDE.md sección 8): la política
-- "business_admin updates own business coupons" (schema.sql) permite a un
-- business_admin hacer UPDATE directo sobre coupons (status,
-- reward_description, customer_id, etc.) por PostgREST, sin pasar por
-- redeem_coupon(), que es la función que valida status='available' y
-- registra la transacción de canje.
--
-- redeem_coupon es SECURITY DEFINER (corre con los privilegios de su owner,
-- que tiene BYPASSRLS), por lo que no depende de esta política para
-- funcionar: register_purchase ya inserta coupons sin tener una política de
-- INSERT para business_admin, con el mismo mecanismo. Se elimina la política
-- sin reemplazo.
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

drop policy if exists "business_admin updates own business coupons" on public.coupons;
