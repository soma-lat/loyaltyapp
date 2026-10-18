-- ============================================================================
-- Fase 2 de la reestructura del panel de negocio: loyalty_programs pasa de
-- "una fila activa implícita por negocio" a promociones de sellos con ciclo
-- de vida (draft/active/paused/finished), y varias pueden estar 'active' al
-- mismo tiempo (ej. café y crepas por separado). Por eso el progreso ya no
-- puede ser un contador por (cliente, negocio): pasa a ser por (cliente,
-- negocio, promoción). register_purchase ahora recibe explícitamente a cuál
-- promoción aplica la compra (el admin la elige en /admin/scan antes de
-- escanear).
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

alter table public.loyalty_programs add column if not exists status text;

update public.loyalty_programs
set status = case when active then 'active' else 'paused' end
where status is null;

alter table public.loyalty_programs alter column status set not null;
alter table public.loyalty_programs alter column status set default 'draft';
alter table public.loyalty_programs
  add constraint loyalty_programs_status_check
  check (status in ('draft', 'active', 'paused', 'finished'));

drop policy if exists "customer reads active programs" on public.loyalty_programs;
create policy "customer reads active programs" on public.loyalty_programs
  for select using (status = 'active');

alter table public.loyalty_programs drop column active;

alter table public.customer_business_progress
  add column if not exists loyalty_program_id uuid references public.loyalty_programs (id) on delete cascade;

update public.customer_business_progress p
set loyalty_program_id = (
  select lp.id from public.loyalty_programs lp
  where lp.business_id = p.business_id
  order by lp.created_at desc
  limit 1
)
where loyalty_program_id is null;

alter table public.customer_business_progress alter column loyalty_program_id set not null;
alter table public.customer_business_progress
  drop constraint if exists customer_business_progress_customer_id_business_id_key;
alter table public.customer_business_progress
  add constraint customer_business_progress_customer_business_program_key
  unique (customer_id, business_id, loyalty_program_id);

alter table public.transactions
  add column if not exists loyalty_program_id uuid references public.loyalty_programs (id) on delete set null;

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
