-- ============================================================================
-- Fase 4 de la reestructura del panel de negocio: registro de auditoria.
-- No duplica transactions (que ya guarda quien registro cada compra/canje):
-- aqui solo se registran dos cosas que hoy no dejan rastro en ningun lado:
-- (1) intentos bloqueados de escalar privilegios (los triggers de las
-- migraciones 0001 y 0007 ya los revierten, pero en silencio) y (2) cambios
-- de estado de una promocion (quien la activo/pauso/finalizo y cuando).
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_business_id_idx on public.audit_log (business_id);

alter table public.audit_log enable row level security;

create policy "super_admin reads all audit log" on public.audit_log
  for select using (public.current_profile_role() = 'super_admin');

create policy "business_admin reads own audit log" on public.audit_log
  for select using (business_id = public.current_business_id());

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
    insert into public.audit_log (business_id, actor_id, action, detail)
    values (old.business_id, auth.uid(), 'privilege_escalation_blocked',
      jsonb_build_object('table', 'profiles', 'field', 'role', 'attempted', new.role, 'kept', old.role));
    new.role := old.role;
  end if;

  if new.business_id is distinct from old.business_id then
    insert into public.audit_log (business_id, actor_id, action, detail)
    values (old.business_id, auth.uid(), 'privilege_escalation_blocked',
      jsonb_build_object('table', 'profiles', 'field', 'business_id', 'attempted', new.business_id, 'kept', old.business_id));
    new.business_id := old.business_id;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_business_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.current_profile_role() = 'super_admin' then
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.audit_log (business_id, actor_id, action, detail)
    values (old.id, auth.uid(), 'privilege_escalation_blocked',
      jsonb_build_object('table', 'businesses', 'field', 'status', 'attempted', new.status, 'kept', old.status));
    new.status := old.status;
  end if;

  if new.plan is distinct from old.plan then
    insert into public.audit_log (business_id, actor_id, action, detail)
    values (old.id, auth.uid(), 'privilege_escalation_blocked',
      jsonb_build_object('table', 'businesses', 'field', 'plan', 'attempted', new.plan, 'kept', old.plan));
    new.plan := old.plan;
  end if;

  if new.slug is distinct from old.slug then
    insert into public.audit_log (business_id, actor_id, action, detail)
    values (old.id, auth.uid(), 'privilege_escalation_blocked',
      jsonb_build_object('table', 'businesses', 'field', 'slug', 'attempted', new.slug, 'kept', old.slug));
    new.slug := old.slug;
  end if;

  return new;
end;
$$;

create or replace function public.log_promotion_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_log (business_id, actor_id, action, detail)
    values (new.business_id, auth.uid(), 'promotion_status_changed',
      jsonb_build_object('promotion_id', new.id, 'promotion_name', new.name, 'from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists on_loyalty_program_status_change on public.loyalty_programs;
create trigger on_loyalty_program_status_change
  after update of status on public.loyalty_programs
  for each row execute function public.log_promotion_status_change();
