-- ============================================================================
-- Pendiente P2 (CLAUDE.md sección 8): current_role()/current_business_id()
-- devuelven NULL si no hay sesión o el perfil no existe. "NULL <> 'x'" evalúa
-- NULL (no TRUE) en SQL, así que "if current_role() <> 'business_admin'" no
-- disparaba la excepción con una sesión sin rol. En redeem_coupon esto es
-- explotable: sin sesión, el chequeo de rol no revienta y tampoco el de
-- "v_coupon.business_id <> current_business_id()" (también NULL), por lo que
-- la ejecución llega a redimir el cupón sin ninguna autenticación.
--
-- Corrección: reemplazar "<>" por "IS DISTINCT FROM" en las comparaciones de
-- rol/negocio de ambas funciones, que sí evalúa TRUE cuando hay NULL de por
-- medio. Se reemplazan las funciones completas (CREATE OR REPLACE) porque
-- Postgres no permite editar el cuerpo de una función con ALTER.
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

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
  if public.current_role() is distinct from 'business_admin' then
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
  if public.current_role() is distinct from 'business_admin' then
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
