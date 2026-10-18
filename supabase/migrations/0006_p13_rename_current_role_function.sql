-- ============================================================================
-- Pendiente P13 (CLAUDE.md sección 8): current_role() comparte nombre con
-- CURRENT_ROLE, palabra clave del estándar SQL (como CURRENT_USER). Al estar
-- siempre invocada calificada como public.current_role(), no causa un bug
-- activo hoy, pero es ambigua/riesgosa si alguna vez se llama sin calificar.
--
-- Corrección: renombrar la función. Las políticas RLS que la usan resuelven
-- la llamada por OID (no por texto), así que el RENAME las actualiza solas.
-- PERO register_purchase(), redeem_coupon() y
-- prevent_profile_privilege_escalation() (migración 0001/0002) la llaman
-- desde código plpgsql (texto), que SÍ se resuelve por nombre en cada
-- ejecución — hay que recrear las tres apuntando al nuevo nombre o quedan
-- rotas ("function current_role() does not exist") después del rename. Se
-- recrean con la lógica ya vigente de 0001/0002, solo cambiando el nombre de
-- la llamada.
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

alter function public.current_role() rename to current_profile_role;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.current_profile_role() = 'super_admin' then
    return new;
  end if;

  if new.role is distinct from old.role then
    new.role := old.role;
  end if;

  if new.business_id is distinct from old.business_id then
    new.business_id := old.business_id;
  end if;

  return new;
end;
$$;

create or replace function public.register_purchase(
  p_customer_id uuid,
  p_amount numeric default null,
  p_note text default null
)
returns table (
  transaction_id uuid,
  purchases_count int,
  purchases_required int,
  coupon_issued boolean,
  coupon_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_program public.loyalty_programs;
  v_progress public.customer_business_progress;
  v_transaction_id uuid;
  v_coupon_id uuid;
  v_coupon_issued boolean := false;
begin
  if public.current_profile_role() is distinct from 'business_admin' then
    raise exception 'Only business admins can register purchases';
  end if;

  v_business_id := public.current_business_id();
  if v_business_id is null then
    raise exception 'Caller has no associated business';
  end if;

  if not exists (select 1 from public.profiles where id = p_customer_id and role = 'customer') then
    raise exception 'Customer not found';
  end if;

  select * into v_program
  from public.loyalty_programs
  where business_id = v_business_id and active = true
  order by created_at desc
  limit 1;

  if v_program is null then
    raise exception 'Business has no active loyalty program';
  end if;

  insert into public.transactions (business_id, customer_id, registered_by, type, amount, note)
  values (v_business_id, p_customer_id, auth.uid(), 'purchase', p_amount, p_note)
  returning id into v_transaction_id;

  insert into public.customer_business_progress (customer_id, business_id, purchases_count)
  values (p_customer_id, v_business_id, 1)
  on conflict (customer_id, business_id)
  do update set purchases_count = customer_business_progress.purchases_count + 1,
                updated_at = now()
  returning * into v_progress;

  if v_progress.purchases_count >= v_program.purchases_required then
    insert into public.coupons (customer_id, business_id, loyalty_program_id, reward_description)
    values (p_customer_id, v_business_id, v_program.id, v_program.reward_description)
    returning id into v_coupon_id;

    update public.customer_business_progress
    set purchases_count = 0, updated_at = now()
    where id = v_progress.id;

    v_coupon_issued := true;
    v_progress.purchases_count := 0;
  end if;

  return query select v_transaction_id, v_progress.purchases_count, v_program.purchases_required,
                       v_coupon_issued, v_coupon_id;
end;
$$;

create or replace function public.redeem_coupon(p_coupon_id uuid)
returns public.coupons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons;
begin
  if public.current_profile_role() is distinct from 'business_admin' then
    raise exception 'Only business admins can redeem coupons';
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

  insert into public.transactions (business_id, customer_id, registered_by, type, note)
  values (v_coupon.business_id, v_coupon.customer_id, auth.uid(), 'redemption', v_coupon.reward_description);

  return v_coupon;
end;
$$;
