-- ============================================================================
-- Fase 1 de la reestructura del panel de negocio (rama
-- reestructura-portal-negocio): agrega los campos de perfil del negocio
-- (logo, descripción, ubicación, contacto) y permite que business_admin los
-- edite desde /admin/perfil, sin poder tocar status/plan/slug (reservados a
-- super_admin, igual que profiles.role/business_id en la migración 0001).
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

alter table public.businesses
  add column if not exists logo_url text,
  add column if not exists description text,
  add column if not exists address text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

create policy "business_admin updates own business" on public.businesses
  for update using (id = public.current_business_id())
  with check (id = public.current_business_id());

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
    new.status := old.status;
  end if;

  if new.plan is distinct from old.plan then
    new.plan := old.plan;
  end if;

  if new.slug is distinct from old.slug then
    new.slug := old.slug;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_business_privilege_escalation on public.businesses;
create trigger prevent_business_privilege_escalation
  before update on public.businesses
  for each row execute function public.prevent_business_privilege_escalation();
