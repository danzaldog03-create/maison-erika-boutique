# Supabase en Maison Erika

## Estado de origen

El proyecto remoto `jvbaszjtjhzgrarkbhvt` ya tenía estas migraciones aplicadas
antes de que este repositorio incorporara una carpeta `supabase/`:

| Versión | Nombre |
| --- | --- |
| `20261103013436` | `maison_erika_initial_commerce_schema` |
| `20261103013505` | `maison_erika_lock_down_permissions` |
| `20261103013526` | `maison_erika_foreign_key_indexes` |

No se recrearon aquí: contienen el estado ya existente en producción. Antes de
trabajar en otra base o desarrollar en local, hay que vincular el proyecto con
la CLI de Supabase y generar un _baseline_ revisable con `supabase db pull`.
No se debe aplicar ese baseline otra vez al proyecto remoto.

La CLI no estaba instalada en este entorno, por lo que no fue posible generar
ese baseline automáticamente durante esta etapa. Hasta tenerlo, no se debe
usar `supabase db reset` en local: faltan las migraciones históricas que crean
el esquema.

## Baseline histórico pendiente

La historia remota conserva sólo estos metadatos de migración, no el SQL de
cada una. Por ello `supabase db pull` no puede recuperar los tres archivos
originales: creará un baseline del esquema remoto actual. Ese baseline, su
complemento para la personalización de Auth y las migraciones posteriores
permiten reconstruir una base nueva de manera reproducible.

La CLI debe generar el baseline y su nombre oficial. Procedimiento preparado,
sin ejecutar todavía:

```powershell
# Ejecutar desde maison-erika-next, después de autorizar la vinculación.
supabase --version
supabase db pull --help
supabase migration new --help
supabase migration list --help

supabase init
supabase login
supabase link --project-ref jvbaszjtjhzgrarkbhvt
supabase migration list
supabase db pull
supabase db pull --schema auth -f pull-auth-schema
```

`db pull` lee el esquema, crea un archivo de baseline en
`supabase/migrations/` y registra esa migración como aplicada en el historial
remoto; no modifica tablas ni filas, pero requiere autorización por ese cambio
de historial. La segunda extracción es necesaria porque Maison Erika tiene un
trigger propio sobre `auth.users`; deben conservarse sólo sus personalizaciones
y no versionar objetos administrados por Supabase. Después se deben revisar
ambos archivos creados:

```powershell
$baselines = Get-ChildItem .\supabase\migrations\*.sql |
  Sort-Object LastWriteTime |
  Select-Object -ExpandProperty FullName

foreach ($baseline in $baselines) {
  .\supabase\scripts\review-baseline.ps1 -BaselinePath $baseline
}
```

El revisor detecta correos, credenciales potenciales y DML de nivel superior.
En particular, se espera que señale el correo codificado en
`private.handle_new_auth_user`; no es una clave, pero sí es información
personal. No se debe versionar el baseline hasta decidir si ese bootstrap pasa
a una operación manual protegida o si se autoriza conservar ese dato en un
repositorio privado.

## Plantilla de migración de seguridad

`pending/harden_profile_roles_and_auth_trigger.sql` conserva el SQL preparado,
pero **no es una migración ejecutable todavía**. Tras revisar el baseline, la
CLI debe asignar el nombre oficial:

```powershell
supabase migration new harden_profile_roles_and_auth_trigger
```

Copia el contenido de `pending/harden_profile_roles_and_auth_trigger.sql` al
archivo generado por ese comando, revísalo y valida el orden:

```powershell
supabase migration list
```

Sus efectos serán:

1. No cambia la política RLS de actualización: el análisis de privilegios
   confirmó que ya limita la edición por columna correctamente y preserva la
   asistencia administrativa sobre perfiles.
2. Reafirma `UPDATE` general revocado y concede a `authenticated` sólo
   `UPDATE(full_name)`.
3. Conserva el trigger autorizado que crea perfiles y elimina el trigger y la
   función redundantes.
4. Mantiene la asignación inicial existente del administrador dentro de una
   función `SECURITY DEFINER` privada; los clientes no pueden modificar roles.

No ejecutes `db push`, `db reset --linked` ni uses datos de producción como
seed durante este procedimiento.

Cuando los baselines y la migración de seguridad ya estén versionados, un
entorno local nuevo se reconstruye únicamente en una base local desechable:

```powershell
supabase start
supabase db reset
```

Nunca ejecutes esos comandos con `--linked` para producción.

La promoción o degradación de roles debe hacerse de forma manual y controlada
por una persona con privilegios de base de datos, nunca desde el navegador:

```sql
update public.profiles
set role = 'admin'
where id = '<auth_user_uuid_verificado>';
```

Verifica primero el UUID y el correo en Auth Dashboard. Esta operación no debe
integrarse en el cliente ni exponerse como RPC público.

## Pruebas

- `tests/20261103020000_profile_security.sql` valida privilegios por columna,
  política RLS, trigger único y la política de lectura administrativa sin
  modificar datos. Ejecutar en una rama o staging tras aplicar la migración.
- `npm run test:auth` prueba la lista blanca de rutas OAuth del proyecto.

Para comprobar comportamiento completo en staging, crea dos usuarios de prueba
desde Auth Dashboard y verifica con sus sesiones que: (a) un usuario no puede
actualizar `role`, (b) no puede editar otro perfil, (c) el administrador sigue
viendo `/admin`, y (d) el registro de un tercer usuario crea exactamente un
perfil con rol `customer`.


## Migración de Comercio Electrónico Pendiente (Etapa 2)

El archivo `supabase/pending/20261108_ecommerce_full_schema.sql` contiene la definición de:
1. `public.store_settings`: Configuración general de la boutique (WhatsApp, cuentas bancarias SPEI, reglas de envío, redes sociales y textos).
2. `public.orders` y `public.order_items`: Gestión de pedidos transaccionales, montos auditados por el servidor, desglose de compra y seguimiento.
3. Inserción de la categoría `Ropa` con `is_active = false` (oculta por defecto hasta activación administrativa).
4. Políticas de seguridad RLS integrales para todas las tablas (`store_settings`, `orders`, `order_items`, `products`, `product_variants`, `product_images`, `categories`, `inventory_movements`).

### Aplicación manual recomendada en Supabase SQL Editor:
Copia el contenido íntegro de `supabase/pending/20261108_ecommerce_full_schema.sql` en el SQL Editor de tu proyecto Supabase y ejecútalo. Es 100% idempotente (`IF NOT EXISTS` / `ON CONFLICT`).
