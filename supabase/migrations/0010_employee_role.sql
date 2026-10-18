-- ============================================================================
-- Fase 5 de la reestructura del panel de negocio: rol "employee" simple
-- (permisos fijos: escanear, ver clientes y canjear cupones; no configura
-- promociones ni el perfil del negocio, ni ve el registro de seguridad).
--
-- profiles.business_id ya no identifica solo a business_admin, tambien a
-- employee, asi que las policies/funciones que usaban "business_id =
-- current_business_id()" como proxy de "es business_admin" quedaban
-- abiertas de mas para employee. Se endurecen aqui.
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'employee', 'business_admin', 'super_admin'));

-- Antes "business_admin manages own programs" (for all) cubria tambien el
-- select, dejando a employee sin ver promociones pausadas/finalizadas en
-- /admin/clientes (solo las "active", via la policy publica de abajo). Se
-- separa lectura (ambos roles, la necesitan para ver progreso de clientes)
-- de escritura (solo business_admin).
drop policy if exists "business_admin manages own programs" on public.loyalty_programs;

create policy "business staff reads own programs" on public.loyalty_programs
  for select using (business_id = public.current_business_id());

create policy "business_admin inserts own programs" on public.loyalty_programs
  for insert
  with check (business_id = public.current_business_id() and public.current_profile_role() = 'business_admin');

create policy "business_admin updates own programs" on public.loyalty_programs
  for update
  using (business_id = public.current_business_id() and public.current_profile_role() = 'business_admin')
  with check (business_id = public.current_business_id() and public.current_profile_role() = 'business_admin');

drop policy if exists "business_admin updates own business" on public.businesses;
create policy "business_admin updates own business" on public.businesses
  for update
  using (id = public.current_business_id() and public.current_profile_role() = 'business_admin')
  with check (id = public.current_business_id() and public.current_profile_role() = 'business_admin');

drop policy if exists "business_admin reads own audit log" on public.audit_log;
create policy "business_admin reads own audit log" on public.audit_log
  for select using (business_id = public.current_business_id() and public.current_profile_role() = 'business_admin');

drop policy if exists "business_admin reads own business customers" on public.profiles;
create policy "business staff reads own business customers" on public.profiles
  for select using (
    public.current_profile_role() in ('business_admin', 'employee')
    and exists (
      select 1 from public.customer_business_progress p
      where p.customer_id = profiles.id and p.business_id = public.current_business_id()
    )
  );

create policy "business_admin reads own employees" on public.profiles
  for select using (
    public.current_profile_role() = 'business_admin'
    and role = 'employee'
    and business_id = public.current_business_id()
  );

create or replace function public.register_purchase(
  p_customer_id uuid,
  p_program_id uuid,
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
  if public.current_profile_role() not in ('business_admin', 'employee') then
    raise exception 'Only business staff can register purchases';
  end if;

  v_business_id := public.current_business_id();
  if v_business_id is null then
    raise exception 'Caller has no associated business';
  end if;

  if not exists (select 1 from public.profiles where id = p_customer_id and role = 'customer') then
    raise exception 'Customer not found';
  end if;

  select * into v_program from public.loyalty_programs where id = p_program_id;

  if v_program is null
    or v_program.business_id is distinct from v_business_id
    or v_program.status is distinct from 'active' then
    raise exception 'Promotion not found or not active for this business';
  end if;

  insert into public.transactions (business_id, customer_id, registered_by, type, amount, note, loyalty_program_id)
  values (v_business_id, p_customer_id, auth.uid(), 'purchase', p_amount, p_note, v_program.id)
  returning id into v_transaction_id;

  insert into public.customer_business_progress (customer_id, business_id, loyalty_program_id, purchases_count)
  values (p_customer_id, v_business_id, v_program.id, 1)
  on conflict (customer_id, business_id, loyalty_program_id)
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

  insert into public.transactions (business_id, customer_id, registered_by, type, note)
  values (v_coupon.business_id, v_coupon.customer_id, auth.uid(), 'redemption', v_coupon.reward_description);

  return v_coupon;
end;
$$;
