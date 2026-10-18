-- ============================================================================
-- Pendiente P6 (CLAUDE.md sección 8): profiles no guarda correo y full_name
-- nunca se capturaba en el registro (src/app/login/page.tsx no mandaba
-- options.data.full_name al signUp, aunque handle_new_user() ya lo esperaba).
-- Decisión de producto (revisada con el usuario): identificar al cliente con
-- full_name (obligatorio), email y phone (opcional) en profiles.
--
-- Ejecutar en el SQL editor de Supabase.
-- ============================================================================

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;

-- Backfill de cuentas ya existentes: copia el correo desde auth.users.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- handle_new_user ahora también copia email (de auth.users, siempre
-- disponible) y phone (de raw_user_meta_data, enviado por /login al
-- registrarse).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    'customer',
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

-- Mantiene profiles.email sincronizado si el usuario cambia su correo desde
-- auth.users (p. ej. al confirmar un cambio de email).
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();
