-- Prueba de configuración posterior a la migración.
-- Sólo lee catálogo de PostgreSQL; no crea ni borra datos.
-- Ejecutar contra una rama/staging después de aplicar la migración.

begin read only;

do $$
declare
  profile_trigger_count integer;
  admin_policy_present boolean;
begin
  -- Un cliente autenticado sólo puede actualizar full_name: ni role ni id.
  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') then
    raise exception 'authenticated still has UPDATE on public.profiles.role';
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE') then
    raise exception 'authenticated still has UPDATE on public.profiles.id';
  end if;

  if not has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE') then
    raise exception 'authenticated lost UPDATE on public.profiles.full_name';
  end if;

  -- La política conserva la edición del propio perfil para clientas y la
  -- asistencia administrativa. El privilegio de columna anterior impide a
  -- ambos roles API cambiar `role`.
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profile_update_own_or_admin'
      and cmd = 'UPDATE'
      and roles = array['authenticated']::name[]
      and qual like '%auth.uid()%'
      and with_check like '%auth.uid()%'
  ) then
    raise exception 'profile update policy no longer protects profile ownership';
  end if;

  -- Debe permanecer un único trigger de perfil para auth.users y debe usar el
  -- manejador autorizado. Esto preserva la creación de perfiles al registrarse.
  select count(*)
    into profile_trigger_count
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace n on n.oid = p.pronamespace
  where t.tgrelid = 'auth.users'::regclass
    and not t.tgisinternal
    and n.nspname = 'private'
    and p.proname = 'handle_new_auth_user';

  if profile_trigger_count <> 1 then
    raise exception 'expected exactly one Maison Erika auth profile trigger, found %', profile_trigger_count;
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'handle_new_auth_user'
      and p.prosecdef
  ) then
    raise exception 'the trusted profile creation function is missing or not SECURITY DEFINER';
  end if;

  -- Los administradores continúan leyendo perfiles mediante private.is_admin.
  select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profile_select_own_or_admin'
      and qual like '%is_admin%'
  ) into admin_policy_present;

  if not admin_policy_present then
    raise exception 'admin profile read policy is missing';
  end if;
end;
$$;

rollback;
