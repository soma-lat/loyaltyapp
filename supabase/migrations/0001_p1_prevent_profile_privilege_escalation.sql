-- ============================================================================
-- Pendiente P1 (CLAUDE.md sección 8): escalada de privilegios.
-- La política "user updates own profile" (schema.sql) solo filtra por fila
-- (id = auth.uid()), no por columna, así que cualquier usuario autenticado
-- puede hacer UPDATE profiles SET role='super_admin', business_id=... sobre
-- su propia fila usando la anon key.
--
-- Corrección: trigger BEFORE UPDATE que revierte silenciosamente cualquier
-- cambio a role/business_id cuando quien ejecuta no es super_admin ni la
-- service_role key (los admins se asignan vía /api/superadmin/assign-admin,
-- que usa service_role).
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.current_role() = 'super_admin' then
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

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;
create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();
