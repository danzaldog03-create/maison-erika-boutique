-- Plantilla de seguridad de Maison Erika - Etapa 1.
--
-- No está en supabase/migrations para impedir una aplicación accidental antes
-- de crear y revisar el baseline con Supabase CLI. Tras el baseline, genera
-- una migración con `supabase migration new harden_profile_roles_and_auth_trigger`
-- y copia este contenido en el archivo que cree la CLI.

begin;

-- La política RLS existente conserva que una clienta sólo edita su propia
-- fila y que un administrador puede asistir con perfiles. RLS no limita
-- columnas, por lo que la barrera decisiva para `role` son estos privilegios
-- explícitos. Se reaplican de forma idempotente como defensa ante cambios
-- futuros de permisos.
revoke update on table public.profiles from anon, authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- `role`, `id` y las marcas de tiempo no pueden modificarse mediante la clave
-- publishable, aunque la persona sea dueña de su perfil. La asignación de rol
-- sigue siendo una operación manual de base de datos o de backend protegido.

-- Se conserva el trigger que ya contiene la regla del administrador inicial.
-- El segundo trigger hacía el mismo INSERT con `on conflict do nothing`, por
-- lo que era redundante.
drop trigger if exists on_auth_user_created_maison_erika on auth.users;
drop function if exists private.handle_new_user();

-- El trigger no necesita que los roles de API ejecuten directamente esta
-- función; el trigger se ejecuta con los privilegios de su definidor.
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

commit;
