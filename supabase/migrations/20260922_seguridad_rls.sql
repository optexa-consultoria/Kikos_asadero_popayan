-- =====================================================================
-- Seguridad de la base de datos (aplicado en producción el 2026-09-22)
-- Proyecto Supabase: Kikos_asadero_popayan (dmqmpkrfpetdvkkwgduk)
--
-- Antes: RLS desactivado en productos y pedidos_log, y una política
-- "PermitirTodo" en storage.objects → cualquiera con la llave pública
-- podía borrar el menú, leer pedidos y subir/borrar archivos.
--
-- Ahora:
--   * Público (anon): ve productos activos y registra pedidos (no los lee).
--   * Administradores (tabla public.administradores): CRUD de productos,
--     lectura de pedidos y gestión de imágenes.
--
-- Para agregar otro administrador (en el editor SQL de Supabase):
--   insert into public.administradores (user_id)
--   select id from auth.users where email = 'correo@ejemplo.com';
-- =====================================================================

-- 1. Administradores (sin políticas: solo se gestiona por SQL)
create table if not exists public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now()
);
alter table public.administradores enable row level security;

insert into public.administradores (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Función en un esquema no expuesto por la API REST
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated;

create or replace function privado.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.administradores a where a.user_id = (select auth.uid())
  );
$$;
revoke all on function privado.es_admin() from public;
grant execute on function privado.es_admin() to anon, authenticated;

-- 2. Productos
alter table public.productos enable row level security;

create policy "productos_lectura" on public.productos
  for select to anon, authenticated
  using ("Activo" = true or (select privado.es_admin()));

create policy "productos_crear_admin" on public.productos
  for insert to authenticated
  with check ((select privado.es_admin()));

create policy "productos_editar_admin" on public.productos
  for update to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

create policy "productos_borrar_admin" on public.productos
  for delete to authenticated
  using ((select privado.es_admin()));

-- 3. Registro de pedidos (sin datos personales)
alter table public.pedidos_log enable row level security;

create policy "pedidos_registrar" on public.pedidos_log
  for insert to anon, authenticated
  with check (
    "Estado" = 'Redirigido a WA'
    and "Total_Venta" >= 0
    and jsonb_typeof("Detalle_JSON") = 'array'
  );

create policy "pedidos_leer_admin" on public.pedidos_log
  for select to authenticated
  using ((select privado.es_admin()));

-- 4. Almacenamiento de imágenes (el bucket es público para lectura por URL)
drop policy if exists "PermitirTodo" on storage.objects;
drop policy if exists "PermitirTodo-imagen 1ukaz17_0" on storage.objects;
drop policy if exists "PermitirTodo-imagen 1ukaz17_1" on storage.objects;
drop policy if exists "PermitirTodo-imagen 1ukaz17_2" on storage.objects;
drop policy if exists "PermitirTodo-imagen 1ukaz17_3" on storage.objects;

create policy "imagenes_leer_admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'productos-imagenes' and (select privado.es_admin()));

create policy "imagenes_subir_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos-imagenes' and (select privado.es_admin()));

create policy "imagenes_editar_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos-imagenes' and (select privado.es_admin()))
  with check (bucket_id = 'productos-imagenes' and (select privado.es_admin()));

create policy "imagenes_borrar_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos-imagenes' and (select privado.es_admin()));
