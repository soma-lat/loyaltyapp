-- ============================================================================
-- Loyalty MVP — Supabase schema
-- Run in Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status text not null default 'trial' check (status in ('active', 'suspended', 'trial')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

-- Extends auth.users. role drives which panel a user can reach.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'business_admin', 'super_admin')),
  business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_business_id_idx on public.profiles (business_id);

create table if not exists public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null default 'Programa de lealtad',
  purchases_required int not null default 6 check (purchases_required > 0),
  reward_description text not null default 'Producto gratis',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_programs_business_id_idx on public.loyalty_programs (business_id);

-- One progress row per (customer, business): counts purchases since last reward.
create table if not exists public.customer_business_progress (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  purchases_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique (customer_id, business_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  registered_by uuid references public.profiles (id) on delete set null,
  type text not null default 'purchase' check (type in ('purchase', 'redemption')),
  amount numeric(12, 2),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_business_id_idx on public.transactions (business_id);
create index if not exists transactions_customer_id_idx on public.transactions (customer_id);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  loyalty_program_id uuid references public.loyalty_programs (id) on delete set null,
  reward_description text not null,
  status text not null default 'available' check (status in ('available', 'redeemed', 'expired')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index if not exists coupons_customer_id_idx on public.coupons (customer_id);
create index if not exists coupons_business_id_idx on public.coupons (business_id);

-- ---------------------------------------------------------------------------
-- Helper functions (used by RLS policies)
-- ---------------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_business_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.customer_business_progress enable row level security;
alter table public.transactions enable row level security;
alter table public.coupons enable row level security;

-- businesses
create policy "super_admin full access businesses" on public.businesses
  for all using (public.current_role() = 'super_admin');

create policy "business_admin reads own business" on public.businesses
  for select using (id = public.current_business_id());

-- profiles
create policy "user reads own profile" on public.profiles
  for select using (id = auth.uid());

create policy "user updates own profile" on public.profiles
  for update using (id = auth.uid());

create policy "super_admin reads all profiles" on public.profiles
  for select using (public.current_role() = 'super_admin');

create policy "business_admin reads own business customers" on public.profiles
  for select using (
    public.current_role() = 'business_admin'
    and exists (
      select 1 from public.customer_business_progress p
      where p.customer_id = profiles.id and p.business_id = public.current_business_id()
    )
  );

-- loyalty_programs
create policy "super_admin full access programs" on public.loyalty_programs
  for all using (public.current_role() = 'super_admin');

create policy "business_admin manages own programs" on public.loyalty_programs
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "customer reads active programs" on public.loyalty_programs
  for select using (active = true);

-- customer_business_progress
create policy "super_admin reads all progress" on public.customer_business_progress
  for select using (public.current_role() = 'super_admin');

create policy "business_admin reads own business progress" on public.customer_business_progress
  for select using (business_id = public.current_business_id());

create policy "customer reads own progress" on public.customer_business_progress
  for select using (customer_id = auth.uid());

-- transactions
create policy "super_admin reads all transactions" on public.transactions
  for select using (public.current_role() = 'super_admin');

create policy "business_admin reads own business transactions" on public.transactions
  for select using (business_id = public.current_business_id());

create policy "customer reads own transactions" on public.transactions
  for select using (customer_id = auth.uid());

-- coupons
create policy "super_admin reads all coupons" on public.coupons
  for select using (public.current_role() = 'super_admin');

create policy "business_admin reads own business coupons" on public.coupons
  for select using (business_id = public.current_business_id());

create policy "business_admin updates own business coupons" on public.coupons
  for update using (business_id = public.current_business_id());

create policy "customer reads own coupons" on public.coupons
  for select using (customer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Core business logic as SECURITY DEFINER RPCs.
-- Writes to transactions/progress/coupons go ONLY through these functions,
-- so the INSERT/UPDATE privilege itself never needs to be granted broadly.
-- ---------------------------------------------------------------------------

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
  if public.current_role() <> 'business_admin' then
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
  if public.current_role() <> 'business_admin' then
    raise exception 'Only business admins can redeem coupons';
  end if;

  select * into v_coupon from public.coupons where id = p_coupon_id;

  if v_coupon is null then
    raise exception 'Coupon not found';
  end if;

  if v_coupon.business_id <> public.current_business_id() then
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

-- ---------------------------------------------------------------------------
-- New auth.users -> profiles bootstrap. Default role is 'customer';
-- promote to business_admin/super_admin manually (or via a future admin API).
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'customer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
