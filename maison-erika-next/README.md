# Maison Erika — Tienda de Comercio Electrónico Completa

Sistema integral de comercio electrónico para Maison Erika, boutique de joyería y accesorios finos nacida en Aguascalientes, México.

## Requisitos de Entorno
- Node.js 20.9 o superior (recomendado Node 22+ / 26)
- Proyecto Supabase: `https://jvbaszjtjhzgrarkbhvt.supabase.co`

## Configuración y Variables de Entorno
Crea o conserva el archivo `.env.local` en la carpeta `maison-erika-next/` con:
```env
NEXT_PUBLIC_SUPABASE_URL=https://jvbaszjtjhzgrarkbhvt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... (tu clave publishable de Supabase)
```
> **Nota de seguridad:** No expongas la clave `service_role` ni secretos en el cliente. La aplicación utiliza Supabase SSR con sesiones seguras y re-cálculo de montos e inventario exclusivamente en el servidor.

## Scripts Disponibles
Ejecutables desde la raíz `D:\Maison-Erika\Maison-Erika-PRODUCCION` o desde `maison-erika-next/`:
- `npm run dev`: Inicia el servidor de desarrollo en http://localhost:3000
- `npm run build`: Genera el build de producción optimizado (Next.js 16 + Turbopack)
- `npm run start`: Inicia el servidor en modo producción
- `npm test`: Ejecuta toda la suite de pruebas unitarias (redirecciones OAuth y cálculos seguros de pedidos)

---

## Módulos Implementados

### 1. TIENDA Y CATÁLOGO PÚBLICO
- **Portada de Lujo:** Identidad visual oficial, paleta cálida y elegante (vino, rosa suave, crema, oro), logotipo oficial y homenaje a Aguascalientes, México.
- **Catálogo Interactivo (`ProductCatalog`):** Filtrado instantáneo por categorías y colecciones, barra de búsqueda en tiempo real (por nombre, material o SKU), indicadores de existencias en tiempo real y precios con descuento comparativo.
- **Ficha Individual de Producto (`/productos/[slug]`):**
  - Galería de imágenes interactiva con miniaturas.
  - Selector de variantes (tallas, acabados, colores).
  - Selector de cantidad delimitado por el stock real disponible.
  - Botones "Agregar a la bolsa" y "Comprar ahora" con apertura automática del carrito.
  - Enlace directo a WhatsApp para consultas sobre la pieza seleccionada.

### 2. CARRITO Y CHECKOUT TRANSACCIONAL
- **Bolsa Persistente (`CartProvider` + `CartDrawer`):** Carrito deslizante accesible desde el botón superior, persistido en `localStorage`. Modificación de cantidades y eliminación de artículos.
- **Página de Bolsa (`/carrito`):** Vista extendida con cálculo de progreso hacia Envío Gratis.
- **Checkout Seguro (`/checkout`):**
  - Captura nombre completo, teléfono/WhatsApp, correo electrónico y dirección completa de entrega con referencias.
  - Cálculo de subtotal, costo de envío según reglas configuradas y total final.
  - **Operación Segura en Servidor (`createOrder`):** Valida existencias directamente en la base de datos, recalcula los importes sin confiar en el cliente, genera el número de pedido único (ej. `ME-202611-XXXX`), crea el registro en `orders` y `order_items`, y descuenta el inventario registrando el movimiento de venta en `inventory_movements`.

### 3. PEDIDOS Y PAGO POR TRANSFERENCIA BANCARIA (SPEI)
- **Confirmación de Compra (`/pedidos/[id]`):**
  - Desglose detallado del pedido, artículos comprados y datos de envío.
  - Ficha de instrucciones de pago por transferencia SPEI con Banco (BBVA), Beneficiario, CLABE Interbancaria de 18 dígitos, concepto de referencia y monto exacto.
  - Botón integrado "ENVIAR COMPROBANTE POR WHATSAPP" con mensaje prellenado que incluye el número de pedido y monto para agilizar la confirmación.
  - Arquitectura preparada para añadir pasarelas de pago (Stripe, Mercado Pago) a futuro.

### 4. PANEL DE ADMINISTRACIÓN (`/admin`)
Acceso protegido exclusivamente para cuentas con rol `admin` en `public.profiles`.
- **Dashboard:** Resumen ejecutivo de productos, pedidos, categorías y ventas confirmadas acumuladas.
- **Catálogo (`/admin/products`):**
  - Alta de piezas con fotografía principal, categoría, precio, precio comparativo, SKU, stock inicial, material y descripciones.
  - Edición completa de piezas existentes.
  - Baja lógica (Archivar producto para ocultarlo de la tienda sin romper pedidos históricos).
  - Gestión avanzada de fotografías: subida de múltiples fotos a Supabase Storage (`product-media`), selección de foto principal y eliminación.
  - Gestión de variantes (tallas, colores) y ajuste manual de existencias con registro en auditoría de inventario.
- **Categorías (`/admin/categories`):**
  - Activación y desactivación de colecciones con un clic.
  - **Regla de negocio garantizada:** La categoría **Ropa** permanece oculta por defecto hasta que la administradora decida activarla desde este panel.
- **Pedidos (`/admin/orders`):**
  - Listado con filtros por estado (`pendiente`, `confirmado`, `enviado`, `entregado`, `cancelado`).
  - Actualización de estado en tiempo real.
  - Registro de guía de paquetería (DHL, FedEx, Estafeta, etc.) y número de rastreo al marcar como enviado.
  - Enlace directo para escribir por WhatsApp a la clienta.
- **Configuración (`/admin/settings`):**
  - WhatsApp comercial y mensaje predeterminado.
  - Cuentas bancarias para transferencias SPEI (Banco, CLABE, Beneficiario, Instrucciones).
  - Reglas de paquetería (costo fijo y monto mínimo para envío gratis).
  - Redes sociales (Instagram, Facebook, TikTok).
  - Textos oficiales de la portada (anuncio, hero e historia de la marca).

---

## Migraciones Pendientes
La migración lista para aplicar en Supabase SQL Editor se ubica en:
`supabase/pending/20261108_ecommerce_full_schema.sql`
Contiene la creación segura e idempotente de las tablas `store_settings`, `orders`, `order_items`, índices y políticas RLS completas.
