-- ============================================================================
-- Fase 6 de la reestructura del panel de negocio: el desglose por promocion
-- en Informes necesita saber a que promocion pertenece cada canje. La
-- columna transactions.loyalty_program_id ya existe desde la migracion 0008,
-- pero redeem_coupon nunca la llenaba (quedaba siempre null en canjes).
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

create or replace function public.redeem_coupon(p_coupon_id uuid)
returns public.coupons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons;
begin
  if public.current_profile_role() not in ('business_admin', 'employee') then
    raise exception 'Only business staff can redeem coupons';
  end if;

  select * into v_coupon from public.coupons where id = p_coupon_id;

  if v_coupon is null then
    raise exception 'Coupon not found';
  end if;

  if v_coupon.business_id is distinct from public.current_business_id() then
    raise exception 'Coupon does not belong to this business';
  end if;

  if v_coupon.status <> 'available' then
    raise exception 'Coupon already % ', v_coupon.status;
  end if;

  update public.coupons
  set status = 'redeemed', redeemed_at = now()
  where id = p_coupon_id
  returning * into v_coupon;

  insert into public.transactions (business_id, customer_id, registered_by, type, note, loyalty_program_id)
  values (v_coupon.business_id, v_coupon.customer_id, auth.uid(), 'redemption', v_coupon.reward_description, v_coupon.loyalty_program_id);

  return v_coupon;
end;
$$;
