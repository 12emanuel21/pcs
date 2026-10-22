# Bitácora

## 2026-10-18 · Tema: next-themes estándar, un proveedor por zona

**Estado: CERRADO.** Probado manualmente en navegador: claro, oscuro y sistema
funcionan en `/admin`, y la vitrina respeta su tema. Fusionado en `main`.

Commit `1ae6f4f` en la rama `fix/theme-estandar` (el estado anterior quedó en
`c909840`).

### Qué se hizo
- Variante `dark:` estándar de Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *))`.
  Se quitó la clase `theme-light` y las reglas `.light` / `.brand-scope.light`.
- `ThemeProvider` (next-themes nativo, `attribute="class"`, con el Toaster
  incluido) ya no está en el layout raíz. Hay uno por zona:
  - `/admin` (panel + login): clave `theme`.
  - `/superadmin`: clave `theme` (comparte la elección con el panel).
  - Vitrina `/[storeId]`: `StoreThemeScope`, con clave `store-theme:<id>` y
    `defaultTheme` = `default_theme` de la tienda.
- `ThemeToggle` usa solo `useTheme()`.
- SuperAdmin: modo oscuro (variantes `dark:` agregadas con un script) y botón
  de tema en el header. Botón "Control Maestro" del panel con contraparte oscura.

### Verificado
- `tsc`, `eslint` y `next build` sin errores.
- Build de producción: `/admin/login` responde 200 y trae el script nativo de
  next-themes (`class`, clave `theme`, sin mapeo de valores).
- CSS compilado: `.dark\:…:where(.dark,.dark *)`, sin restos de `.light` ni `theme-light`.

### Sin probar
- No se hizo clic en el botón de tema en un navegador: Chromium headless
  necesita librerías del sistema que se instalan con `sudo`.
- No se revisaron a ojo los modos oscuros del panel y del SuperAdmin; las
  variantes se agregaron con un script.
- No se encontró la causa exacta del fallo original (el panel se quedaba en
  oscuro); se reemplazó la configuración en vez de depurarla.

### Riesgos conocidos
1. **Rutas sin `ThemeProvider` ni Toaster:** `/` (landing), la 404 por
   defecto (incluye `notFound()` de una tienda inexistente) y los errores por
   defecto. La landing y las páginas por defecto no usan `toast()`, así que
   hoy no se pierde ningún aviso; pero un `toast()` futuro fuera de las tres
   zonas no se vería. La landing no tiene clases `dark:`, así que siempre se
   ve clara, salvo el fondo del `body` (`:root.dark`) si `<html>` conserva
   `.dark` de una navegación anterior.
2. **Partes de la vitrina fuera de su proveedor:** el aviso "Cargando
   tienda...", el mensaje de tienda fuera de servicio y los errores se
   renderizan antes de `StoreThemeScope`. Usan clases `dark:` y quedan con la
   clase que tenga `<html>` en ese momento: la del sistema/última zona en
   navegación interna, o claro en carga completa.
3. **Navegación con `<Link>` entre zonas:** next-themes aplica la clase en un
   `useEffect` y no la quita al desmontarse; en navegación del lado del
   cliente su script inline no se ejecuta. Por eso, al pasar de una zona a
   otra, `<html>` conserva el tema anterior hasta que el nuevo proveedor
   monta (al menos un cuadro de parpadeo) y para siempre en las rutas sin
   proveedor (riesgos 1 y 2). Hoy el enlace "Ver tienda" del panel abre en
   pestaña nueva (`target="_blank"`), así que este caso no ocurre desde la UI
   actual; entre `/admin` y `/superadmin` comparten clave, así que el tema
   coincide.

## 2026-10-18 · Migración documentada: `stores.default_theme`

### Qué se hizo
- Se creó `supabase/migrations/` (no existía) con
  `20261018000000_stores_default_theme.sql`: columna `default_theme TEXT NOT
  NULL DEFAULT 'system'` y restricción `stores_default_theme_check`
  (`light`, `dark`, `system`). Es idempotente (`IF NOT EXISTS` y un bloque
  `DO` que revisa `pg_constraint`).
- La columna **ya se aplicó manualmente en producción desde el SQL Editor**
  de Supabase. La migración solo la documenta.

### Sin probar
- El archivo no se ejecutó contra ninguna base de datos (ni local ni
  producción) desde este repositorio.
- No se confirmó si en producción la restricción existe con ese nombre
  exacto. Si se creó con otro nombre, la migración agregaría una segunda
  restricción equivalente (inofensiva, pero duplicada).

### Riesgos
- El proyecto no usa todavía Supabase CLI (`supabase/config.toml` no existe).
  Si más adelante se adopta y se corre `supabase db push`, esta migración
  aparecerá como pendiente porque producción no la tiene registrada en su
  historial; habrá que marcarla como aplicada
  (`supabase migration repair --status applied 20261018000000`).

## 2026-10-18 · Cierre del arreglo de temas

### Qué se hizo
- `fix/theme-estandar` fusionada en `main` (fast-forward).
- El arreglo de temas queda **CERRADO**: probado manualmente en navegador
  (claro, oscuro y sistema en `/admin`; la vitrina respeta su tema). Esto
  cubre lo que quedó "sin probar" en la primera entrada.

### Mejora opcional (no urgente)
- En producción, `stores.default_theme` es **nullable** y probablemente **sin
  CHECK**: se creó a mano antes de la migración. La migración
  `20261018000000_stores_default_theme.sql` no lo corrige si se vuelve a
  ejecutar, porque `ADD COLUMN IF NOT EXISTS` no altera una columna que ya
  existe (sí agregaría el CHECK si falta). La app no se rompe: trata `null`
  y cualquier valor desconocido como `system`. Para dejarlo como documenta la
  migración: rellenar nulos con `'system'`, luego `SET NOT NULL` y
  `SET DEFAULT 'system'`, y agregar el CHECK si no existe.

### Riesgos
- Siguen vigentes los riesgos 1 a 3 de la primera entrada (rutas sin
  proveedor y navegación con `<Link>` entre zonas).

## 2026-10-18 · Vitrina, fase 1: lo que se veía roto

**Estado: CERRADO.** Probada en celular y funciona. Fusionada en `main`.

Rama `feat/vitrina-fase-1`.

### Qué se hizo
- **Metadatos:** `generateMetadata` en `/[storeId]` con el nombre de la tienda
  como título, descripción y Open Graph/Twitter con el logo. El layout raíz
  pasa de "Create Next App" a "LocalStore". La tienda se lee una sola vez por
  request (`getPublicStore` con `cache()` en `src/lib/store-data.ts`).
- **Imágenes:** `ImageWithFallback` evita el ícono roto del navegador (también
  si la imagen falla antes de hidratar). Sin foto o con foto rota, el producto
  muestra su inicial sobre un tono suave del color de la tienda
  (`ProductImage`, en tarjeta y carrito). Nueva variable `text-brand-ink`
  (color de marca oscurecido en claro / aclarado en oscuro) para que la inicial
  se lea con cualquier color.
- **Logo:** `StoreLogo` con respaldo (inicial sobre el color de marca) en el
  encabezado y en "fuera de servicio".
- **Páginas propias en español:** `[storeId]/not-found.tsx` (tienda
  inexistente), `app/not-found.tsx` (cualquier otra URL) y
  `[storeId]/error.tsx` (con "Intentar de nuevo" vía `retry()`).
- **Carga:** esqueleto que imita encabezado, buscador, categorías y grilla
  (`StorefrontSkeleton`), con `animate-pulse` desactivado si el usuario pide
  menos movimiento.
- **Fuera de servicio:** muestra logo y nombre, con la fuente, el color y el
  tema de la tienda.
- `allowedDevOrigins` en `next.config.ts` (IPs `192.168.*.*` y `10.*.*.*`) para
  abrir el servidor de desarrollo desde el celular.

### Verificado
- `tsc`, `eslint` y `next build` sin errores.
- Build de producción: con user agent de WhatsApp, el `<head>` de
  `/electro-demo` trae título, descripción, `og:image` (logo) y `twitter:*`.
  En navegador, el HTML inicial trae el esqueleto y luego el catálogo.
- `/no-existe-xyz` muestra "No encontramos esta tienda" con título "Tienda no
  encontrada"; `/a/b/c` responde 404 con "Página no encontrada".

### Sin probar
- Nada se vio en un navegador real ni en celular (sin Chromium en WSL).
- La vista previa real en WhatsApp: requiere una URL pública (no funciona con
  localhost ni con la IP local).
- La pantalla de error (no se forzó un fallo de Supabase) y el respaldo de
  imagen rota con una URL realmente rota.

### Riesgos
- Las pantallas de carga, no encontrada y error siguen el tema del celular
  (`SystemThemeScope`), no el `default_theme` de la tienda: todavía no se
  conoce la tienda. Si la tienda fuerza un tema distinto, el esqueleto puede
  verse en el otro tema un instante.
- Una tienda inexistente responde HTTP 200 (el `notFound()` ocurre después de
  empezar el streaming); Next agrega `noindex`, así que no afecta a buscadores.
- Logos muy anchos o muy altos se recortan en la vista previa de WhatsApp
  (usa la imagen tal cual, sin recuadro).

## 2026-10-18 · Servidor de desarrollo público (test-n8n.autobotsdev.dev)

Rama `feat/vitrina-fase-1`.

### Qué se hizo
- `allowedDevOrigins` en `next.config.ts` incluye `test-n8n.autobotsdev.dev`
  (se conservan `192.168.*.*` y `10.*.*.*`). Sin esto la página cargaba pero
  no hidrataba: Next bloqueaba los recursos de desarrollo desde ese dominio.
- Script `npm run dev:public` (`next dev -p 5678`).

### Procedimiento
1. Apagar n8n: el dominio `test-n8n.autobotsdev.dev` apunta al puerto 5678
   de este PC, el mismo que usa n8n.
2. Correr `npm run dev:public`.
3. Abrir `https://test-n8n.autobotsdev.dev/<storeId>` (sirve, por ejemplo,
   para probar la vista previa de WhatsApp, que necesita una URL pública).
4. Al terminar, detener el servidor (Ctrl+C) y volver a levantar n8n si hace
   falta.

### Sin probar
- No se probó desde el dominio público después del cambio (debe hacerlo el
  usuario con el servidor corriendo).
- Server Actions desde ese dominio: si el túnel/proxy no reenvía el host
  público en `x-forwarded-host`, Next las rechazaría por CSRF y habría que
  agregar el dominio también en `experimental.serverActions.allowedOrigins`.

### Riesgos
- **Mientras `dev:public` corre, el servidor de desarrollo queda expuesto a
  internet:** cualquiera con la URL ve la app en modo desarrollo (mensajes de
  error con trazas y código fuente, recarga en caliente) y usa la misma
  configuración de Supabase que el `.env` local. No dejarlo encendido sin
  supervisión.
- No pueden correr n8n y `dev:public` a la vez (mismo puerto 5678).

## 2026-10-18 · Vitrina, fase 2A: tarjeta de producto y botón del carrito

**Estado: CERRADO.** Probada y funciona. Fusionada en `main`.

Rama `feat/vitrina-fase-2a` (sale de `main` con la fase 1 ya fusionada).

### Qué se hizo
- **Botón del carrito** (`Cart.tsx`): círculo de 56px color de marca con el
  ícono de la bolsa y un badge con la cantidad (conserva el "pop" al
  agregar). Sin texto ni total. No aparece con el carrito vacío (queda
  montado, invisible e `inert`, y entra con una escala corta). Margen
  inferior y derecho sumando `env(safe-area-inset-*)`.
- **Selector en la tarjeta** (`ProductCard.tsx`): con el producto en el
  carrito, "Agregar" se vuelve "− cantidad +" en el mismo lugar y alto (44px),
  en un tono suave de la marca para distinguirlo del botón sólido. "+" usa
  `addItem` (refresca stock y precio) y se desactiva al llegar al stock; "−"
  en 1 quita el producto. Se quitó el círculo con la cantidad sobre la foto.
- **Poco stock:** "Últimas N unidades" / "Última unidad" en texto pequeño
  ámbar sobre el precio, con 5 o menos (`LOW_STOCK_THRESHOLD`). Si el
  comprador ya tiene todas las unidades: "No hay más unidades". Va arriba del
  precio para que precio y botón sigan alineados entre tarjetas de la misma
  fila.
- **Buscador:** placeholder "Buscar productos". `Storefront` ya no recibe
  `store` (solo lo usaba el placeholder).
- **Centrado en escritorio:** medido en Chromium a 1500px, el contenedor sí
  estaba centrado (174px a cada lado). La sensación de "cargado a la
  izquierda" venía de dos cosas: la última fila incompleta de la grilla (con
  6 productos y 4 columnas, 2 tarjetas pegadas a la izquierda) y la sombra del
  panel del carrito cerrado, que se asomaba como una franja gris en el borde
  derecho. Arreglos: la grilla pasa a flex con `flex-wrap` y centra la última
  fila desde 3 columnas (en celular, 2 columnas alineadas a la izquierda como
  antes); la sombra del panel solo se aplica abierto.
- Padding inferior de la grilla: `6rem + área segura` para que el botón no
  tape la última fila en iPhone.

### Verificado
- `tsc`, `eslint` y `next build` sin errores.
- Capturas con Chromium headless (librerías bajadas sin `sudo` al
  scratchpad de la sesión) a 375px claro y oscuro y a 1500px, con stock
  forzado temporalmente en el servidor de desarrollo (parche quitado antes
  del commit): botón oculto con carrito vacío y visible con badge; selector
  "− 1 +" con "+" desactivado y "No hay más unidades" en un producto de
  stock 1; avisos "Últimas 2 unidades" / "Última unidad"; "Agotado" sin
  cambios; última fila centrada y sin franja gris a 1500px.

### Sin probar
- Celular real: área segura del iPhone, toque en "−"/"+" y animación de
  entrada del botón.
- Tiendas con datos reales de stock bajo (la demo tiene todo ilimitado).
- Fuentes de tienda más anchas en el selector a 375px.

### Riesgos
- El "+" de la tarjeta compara con el stock que llegó con la página; el del
  carrito, con el guardado al agregar. Si el stock cambia sin recargar,
  pueden diferir por un momento (igual que antes).
- La grilla ya no es CSS grid: los anchos de tarjeta se calculan con
  `calc()` y dependen de que los `gap` (`gap-3` / `sm:gap-5`) coincidan con
  los valores restados. Si se cambia un gap, hay que actualizar los anchos.
- `next dev` agregó a `AGENTS.md` un bloque `nextjs-agent-feedback` (por
  `experimental.agentFeedback: true` en `next.config.ts`) que pide a los
  agentes enviar reportes a Next.js. No se incluyó en el commit ni se envió
  nada; decidir si se mantiene esa opción.

## 2026-10-18 · Error "reading 'name'" en la vitrina por el dominio público

**Estado: RESUELTO.** El usuario confirmó que era la caché de Cloudflare.

Rama `feat/vitrina-fase-2a`.

### Qué pasó
- Con `npm run dev:public`, la primera carga de `/electro-demo` (~1 min tras
  arrancar el servidor, 15:32) cayó en `error.tsx` con `TypeError: Cannot
  read properties of undefined (reading 'name')` en `Storefront`. Una carga
  limpia 3 minutos después (desde localhost) funcionó.

### Causa
- **Establecido:** el navegador ejecutó el `Storefront` **anterior a la 2A**
  con las props **nuevas** del servidor. El anterior leía `store.name` (para
  el placeholder); la 2A dejó de pasarle `store`, así que `store` llegó
  `undefined`. El código 2A no lee `.name` de nada que pueda ser `undefined`,
  y la línea del error (47) cae en un comentario: el mapa de fuentes es de
  una versión distinta del código que corrió. Los datos de Supabase están
  completos (6 productos con nombre, precio y descripción) y no son la causa.
- **Mecanismo probable, no reproducido de punta a punta:** Cloudflare
  reescribe la caché de los chunks de desarrollo. El origen manda
  `Cache-Control: no-cache, must-revalidate`; por el dominio público llegan
  con `max-age=14400, must-revalidate` (4 horas) y `cf-cache-status`
  REVALIDATED/EXPIRED. Además, en desarrollo el chunk que contiene
  `Storefront` conserva **la misma URL** aunque cambie su código (verificado
  con dos versiones). Un navegador que abrió la vitrina por el dominio antes
  de la 2A puede usar su copia vieja hasta 4 horas. En la simulación (proxy
  local que imita a Cloudflare), el navegador sí tomó el chunk viejo de su
  caché, pero el runtime de desarrollo de Turbopack terminó cargando el
  código nuevo y no falló; tampoco falló al cambiar el código con la página
  abierta (HMR) ni al reiniciar el servidor (recarga completa).

### Qué se hizo
- No se cambió código de la vitrina: no hay un error en la 2A que corregir,
  y un `?.` solo escondería un desfase de versiones.
- Datos incompletos: la vitrina ya tolera `category`, `description`,
  `image_url` y `stock` nulos. `name` y `price` son obligatorios en el
  formulario y en la importación CSV; solo una fila insertada a mano por SQL
  podría traer `name` nulo.
- `experimental.agentFeedback` quitado de `next.config.ts` y revertido el
  bloque que `next dev` agregaba a `AGENTS.md`. Tras reiniciarse, el servidor
  ya no lo vuelve a escribir.

### "Encountered a script tag while rendering React component"
- Viene de `next-themes` 0.4.6: su `ThemeProvider` renderiza un `<script>`
  en línea (el que aplica el tema antes de pintar). En el render del
  servidor funciona; si React renderiza el proveedor **en el cliente**, avisa
  porque ese script no se ejecuta. En el log apareció justo antes del
  `TypeError`: al fallar, React volvió a renderizar en el cliente. También
  aparece al entrar a una zona con `<Link>` (riesgo 3 de la primera entrada).
- Para el comprador: nada. Es un aviso solo de desarrollo y el tema se aplica
  igual (el `useEffect` de next-themes pone la clase). En una carga normal no
  aparece.

### Sin probar
- No se confirmó en el navegador que falló que el chunk viniera de su caché.
  Para confirmarlo: DevTools → Network → recargar y ver si el chunk
  `src_…_.js` dice "(disk cache)"/"(memory cache)"; o abrir la vitrina en
  ventana privada (si ahí funciona, era caché).

### Riesgos y recomendación
- Mientras Cloudflare reescriba la caché, cualquier cambio de código probado
  por `test-n8n.autobotsdev.dev` puede mezclar versiones. Arreglo en
  Cloudflare (fuera del repo): una Cache Rule para ese hostname con "Bypass
  cache" y "Browser TTL: respetar las cabeceras del origen". Mientras tanto,
  recarga forzada (Ctrl+Shift+R) o ventana privada después de cada cambio.

## 2026-10-18 · Vitrina, fase 2B: rediseño visible

**Estado: CERRADO** a pedido del usuario y fusionada en `main`. Lo que
figura en "Sin probar" no se confirmó desde esta sesión.

Rama `feat/vitrina-fase-2b` (sale de `main` con la 2A fusionada).

### Idea de diseño
"La vitrina iluminada": cada producto se apoya en un fondo neutro (`bg-stage`,
`#F2F2F4` en claro, `#D4D4D8` en oscuro) con la foto completa
(`object-contain`) y `mix-blend-multiply`, que funde el fondo blanco de la
mayoría de fotos de comerciantes con la vitrina. En oscuro la vitrina sigue
clara pero atenuada: un fondo oscuro dejaría esas fotos como recuadros
blancos. Fuera de eso todo es neutro (página blanca / negra); el color lo
ponen la marca (encabezado, botones) y el verde de WhatsApp en las acciones
de WhatsApp.

### Qué se hizo
- **Encabezado:** color de marca sólido sin brillo, logo de 44px, nombre en
  hasta 2 líneas con tamaño adaptativo (`clamp`), sin subtítulo. A 360px
  "Electro Parque Central" cabe completo en una línea.
- **Tarjetas** (`ProductCard.tsx`): sin borde, sombra ni caja; foto completa
  sobre la vitrina (`rounded-3xl`), nombre 15px, precio 16px semibold, botón
  en píldora. Sin categoría ni descripción (pasan al detalle). Más aire
  vertical entre filas (`gap-y-8`).
- **Detalle** (`ProductDetailSheet.tsx`): al tocar la foto o el nombre. Hoja
  inferior en celular (tirador que se arrastra para cerrar, `max-h-92dvh`,
  área segura) y ventana centrada desde `sm`. Foto grande, nombre, precio,
  aviso de stock, descripción completa (respeta saltos de línea) y el mismo
  control Agregar / − cantidad +, fijo abajo. Escape y el fondo la cierran;
  el foco va a "Cerrar" al abrir y vuelve a la tarjeta al cerrar.
- `AddToCartControl.tsx`: control y hook `useProductCart` compartidos por la
  tarjeta y el detalle (stock, tope y avisos en un solo lugar).
- **Pie** (`StoreFooter.tsx`): nombre de la tienda, "Escribir por WhatsApp"
  (`wa.me/<número>`, se oculta sin número) y "Hecho con LocalStore" (enlace
  a `/`). Su padding inferior deja libre el botón del carrito.
- **Textos pequeños:** los de 11–12px pasan a 13px (aviso de stock,
  "Agotado" ahora en minúsculas, textos del carrito). Ya no hay textos de
  11–12px en la vitrina.
- Buscador y categorías en estilo relleno (sin borde ni sombra); carrito y
  vitrina pasan de la paleta `slate` a `zinc` en oscuro; miniaturas del
  carrito sobre la vitrina; esqueleto de carga actualizado al nuevo diseño.

### Capturas
`/home/evargas/dev/app_local_store/capturas/fase-2b/` (fuera del repo):
`antes/` (grilla a 360px, claro y oscuro, pantalla y página completa; el
detalle no existía) y `despues/` (grilla y detalle a 360px en claro y
oscuro, detalle con producto en el carrito y detalle en escritorio a
1280px).

### Verificado
- `tsc`, `eslint` y `next build` sin errores.
- En Chromium: la hoja abre desde la foto y desde el nombre, agregar y "+"
  funcionan dentro de la hoja; en escritorio abre centrada; Escape la cierra
  y el foco vuelve al nombre del producto.

### Sin probar
- Celular real: arrastre del tirador, área segura, rendimiento de
  `backdrop-blur` en equipos de gama baja.
- Tiendas con logo ausente, nombres muy largos (3+ líneas se cortan con
  "…" en la segunda) y fuentes anchas (Oswald, Playfair) en el encabezado.
- Fotos con fondo de color o transparentes sobre la vitrina (multiply las
  oscurece un poco, sobre todo en oscuro).

### Riesgos
- `mix-blend-multiply` oscurece las fotos sobre la vitrina oscura
  (`#D4D4D8`), alrededor de un 17 %. Si se ve apagado en celulares reales,
  subir el tono de `--stage` en `.dark` (globals.css).
- La hoja de detalle y el carrito no se pueden abrir a la vez (el fondo de
  la hoja tapa el botón del carrito); es intencional.

## 2026-10-18 · SuperAdmin: renovación rápida y pestaña de métricas

Rama `feat/superadmin-renovacion-y-metricas` (sale de `main` con la fase 2B
fusionada).

### Qué se hizo
- **`extendSubscription(storeId, daysToAdd = 31)`** en
  `src/app/superadmin/actions.ts` (fecha de Bogotá):
  - Vigente (vence hoy o después): suma a la fecha de corte actual (2 días
    restantes + 31 = 33).
  - Vencida o `subscription_end` null: suma desde hoy.
  - **Renovar = pago recibido:** deja `is_active = true` aunque la tienda
    estuviera suspendida a mano; el resultado trae `reactivated` y el toast
    lo dice ("(tienda reactivada)").
  - Escritura condicional (`eq`/`is` sobre el `subscription_end` leído): un
    doble clic o dos pestañas no suman los días dos veces; el segundo intento
    devuelve un error claro.
  - `daysToAdd` entero entre 1 y 366.
  - Nuevas utilidades en `store-utils.ts`: `getTodayDate` y `addDaysToDate`.
- **Botones** (`RenewSubscriptionButton.tsx`): "+31 d" compacto en la fila y
  "+1 Mes (+31 días)" destacado dentro del modal de vencimiento. Toast con la
  nueva fecha de corte.
- **`/superadmin` (Tiendas y Clientes)** queda operativo: Tienda, WhatsApp,
  Vencimiento (fecha, aviso, +31 d y editar), Estado y Acciones (Administrar
  / Ver tienda). Sin "Creada", "Pedidos" ni "Volumen". Orden: menos días
  para el vencimiento primero (vencidas arriba, las más atrasadas primero),
  ilimitadas al final, empates por nombre. Bajo el título: total de tiendas,
  vencidas y por vencer (≤ 5 días).
- **`/superadmin/metrics` (Métricas y Ventas)**, nueva pestaña entre
  Tiendas y Tickets: tarjetas globales (tiendas, pedidos, intención, total
  pagado, tickets pendientes), `SalesChart` global de 7 días y tabla por
  tienda (pendientes, pagados, total intención, total pagado) ordenada por
  intención, con `<tfoot>` "TOTAL GLOBAL".
  - Definiciones (las mismas del panel de cada tienda): intención = todos
    los pedidos enviados a WhatsApp, cancelados incluidos; pagado = solo
    `PAID`. El gráfico excluye cancelados (sin cambios).

### Verificado
- `tsc`, `eslint` y `next build` con código 0; `/superadmin/metrics` aparece
  en el build.
- La regla de fechas, con las funciones reales compiladas: 2 días restantes
  (columna `date` y `timestamptz`) → +31 = 33; vence hoy; vencida; null;
  cambio de año; febrero; y a las 10 p. m. de Bogotá (ya otro día en UTC).

### Sin probar
- Nada se probó en el navegador ni contra Supabase: no hay sesión de
  SuperAdmin en esta sesión. Falta ver el toast, la reactivación, el orden
  de la tabla y la pestaña nueva.
- Que el filtro condicional `eq("subscription_end", valor leído)` coincida
  con el formato que devuelve PostgREST para `timestamptz` (debería: es el
  mismo texto que se leyó). Si no coincide, la renovación respondería "El
  vencimiento cambió mientras tanto" siempre.

### Riesgos
- **null = "Ilimitado":** renovar una tienda sin fecha la pasa a vencer en
  31 días (así lo pidió el usuario; las tiendas nuevas se crean sin fecha).
  Una tienda ilimitada a propósito pierde esa condición si se pulsa "+31 d".
- Las métricas siguen sumando en JS con el límite de 1000 filas de Supabase
  por consulta (igual que antes).
- El total global del `<tfoot>` incluye pedidos de tiendas que ya no
  existan; en ese caso no sería igual a la suma de las filas.

## 2026-10-18 · Hoja de detalle en celular y métricas del comerciante

Rama `fix/vitrina-hoja-movil-y-admin-metricas` (sale de
`feat/superadmin-renovacion-y-metricas`, que aún no está en `main`: incluye
ese trabajo).

### Bug: en celular el fondo se oscurece pero la hoja no aparece
- **Reproducción:** no se logró. En Chromium la hoja entra y queda en
  pantalla con toque real en Pixel 7, "iPhone 13" vertical y horizontal y
  Galaxy S9+ (320px); los perfiles "iPhone" de Playwright usan Chromium, no
  WebKit. WebKit no se pudo instalar sin `sudo` (pide ICU 74, libvpx 9, etc.
  que este Ubuntu no trae). El CSS compilado está bien formado
  (`translate-y-full`/`translate-y-0`, respaldo de `@property` para Safari
  antiguo, `92dvh`).
- **Diagnóstico (por análisis, no confirmado en Safari):** la hoja dependía
  de varias piezas que fallan en WebKit y no en Chromium:
  1. Fondo y hoja con el mismo `z-index: 50`, separados; la hoja quedaba
     encima solo por el orden en el DOM. Con el fondo con `backdrop-filter`,
     Safari lo pinta en su propia capa y el orden entre hermanos con igual
     `z-index` no está garantizado.
  2. Posición por la propiedad CSS `translate` (Tailwind v4) con transición
     entre estados, sobre un elemento siempre montado: si la transición no se
     completa, la hoja queda en `translate-y-full`, fuera de pantalla.
  3. Zona con scroll con `flex-1` (base 0%) en una columna con altura
     automática y `max-height`: Safari puede colapsarla a altura 0.
- **Arreglo** (`ProductDetailSheet.tsx` reescrito):
  - Solo se monta abierta. La posición la da el layout: un contenedor
    `fixed inset-0 z-[60]` con flex que alinea la hoja abajo (celular) o al
    centro (`sm`); el fondo es un hijo y la hoja va después con `z-10`
    propio.
  - Entrada con `@keyframes` y `transform` clásico, sin
    `animation-fill-mode`: si la animación no corre, la hoja igual queda
    visible (`animate-sheet-in` / `animate-fade-in` en `globals.css`,
    desactivadas con movimiento reducido).
  - Sin `backdrop-filter`, sin arrastre del tirador (se quitó), sin
    transform en línea.
  - `max-height: 90vh`, con `90dvh` solo donde `@supports (height: 100dvh)`.
  - Zona con scroll `flex-auto min-h-0`; pie con `shrink-0`.
  - Se pierde la animación de salida (se desmonta al cerrar).

### Métricas del comerciante en su propia pestaña
- Nueva `/admin/metrics`: "Resumen de Actividad" (pedidos generados,
  volumen de intención) y `SalesChart` de 7 días, movidos tal cual desde
  `/admin`. Mismo acceso que antes (`getCurrentStore`: dueño y empleados);
  `proxy.ts` ya cubre `/admin/:path*` (sin sesión responde 307 al login).
- `/admin` empieza directo en "Productos" (ahora el `h1`) con "Importar
  Excel/CSV" y "Nuevo Producto". Se quitó el título "Panel de
  Administración - {tienda}".
- Pestaña "Métricas" en `AdminTabs`, justo después de Productos.
- `NoStoreNotice.tsx`: el aviso "Aún no tienes una tienda asignada", ahora
  compartido por las dos páginas.

### Verificado
- `tsc`, `eslint` y `next build` con código 0.
- Hoja nueva en Chromium con toque real en los cuatro perfiles: entra con
  la animación y termina en pantalla; en horizontal se centra y hace scroll
  interno.

### Sin probar
- **El arreglo en un iPhone real** (el diagnóstico no se pudo confirmar).
- `/admin` y `/admin/metrics` con sesión (no hay sesión de comerciante en
  esta sesión).

### Riesgos
- Si en Safari la hoja sigue sin verse, el siguiente paso es inspeccionarla
  con Web Inspector (Mac + iPhone por cable) para ver su posición y capa.

## 2026-10-18 · Errores de hidratación en la vitrina (código viejo en caché)

Rama `fix/vitrina-hoja-movil-y-admin-metricas`.

### Qué se reportó
- `Hydration failed`: en el servidor, tras `ProductDetailSheet` venía el
  `<footer>`; en el cliente, el fondo `<div aria-hidden className="fixed
  inset-0 z-50 bg-black/40 …">` de la hoja.
- `Encountered a script tag while rendering React component` (next-themes).
- Ambos en el log de desarrollo a los 5–6 s de arrancar el servidor.

### Diagnóstico
- **El código actual no puede producir ese HTML en el cliente.** Ese fondo
  (`z-50 bg-black/40`, siempre montado) era el de la hoja de la fase 2B
  (`0e9d8d7`). Desde `65e8951` la hoja hace `if (!product) return null` y su
  fondo es `bg-black/50` dentro de un contenedor `z-[60]`. Servidor nuevo
  (sin hoja) + cliente viejo (con fondo) = el desajuste reportado.
- **Canal: la caché de Cloudflare**, igual que el error de "name". El chunk
  de la hoja (`src_…_.js`) sigue llegando por `test-n8n.autobotsdev.dev`
  con `Cache-Control: max-age=14400` (el origen manda `no-cache`) y con la
  misma URL aunque cambie su código. La regla de Cloudflare recomendada
  antes no está aplicada.
- **El aviso del `<script>` es una consecuencia:** al fallar la hidratación,
  React vuelve a renderizar el árbol en el cliente, y el `ThemeProvider` de
  next-themes renderiza su `<script>` en el cliente. No lo evita
  `suppressHydrationWarning` (que ya estaba en `<html>`, `app/layout.tsx`, y
  solo cubre el atributo `class` que next-themes cambia antes de hidratar).
- **Verificado:** carga limpia en Chromium (perfil Pixel 7), por localhost y
  por el dominio público: sin errores ni avisos de consola y sin el fondo
  viejo en el DOM.

### Qué se hizo
- Ningún cambio de código: lo pedido ya estaba (`suppressHydrationWarning`
  en `<html>`; la hoja devuelve `null` sin producto en servidor y cliente,
  sin `typeof window`, portal ni estado de montaje). Un `isMounted` no
  cambiaría nada porque no hay nada que renderizar solo en el cliente.
- `tsc`, `eslint` y `next build` con código 0.

### Pendiente (fuera del repo)
- Regla de caché en Cloudflare para `test-n8n.autobotsdev.dev`: "Bypass
  cache" y "Browser TTL: respetar las cabeceras del origen". Sin ella, cada
  cambio de componentes cliente probado por el dominio puede repetir errores
  de este tipo durante hasta 4 horas. Mientras tanto: Ctrl+Shift+R o ventana
  privada tras cada cambio, y en el celular borrar los datos del sitio.

## 2026-10-21 · Plantillas de vitrina y portada (base)

Rama `feat/templates-y-hero` (sale de
`fix/vitrina-hoja-movil-y-admin-metricas`, que aún no está en `main`:
incluye ese trabajo y el del SuperAdmin).

### Qué se hizo
- **Datos:** `Store` suma `template` ('minimal' | 'gamer' | 'grid'),
  `hero_image_url`, `hero_title` y `hero_subtitle`. `src/lib/templates.ts`
  centraliza las plantillas (`STORE_TEMPLATES`, etiquetas,
  `resolveTemplate`: ausente o desconocida = 'minimal'), los límites de
  texto (título 60, subtítulo 140) y `getStoreHero` (la portada existe solo
  con título o imagen; un subtítulo suelto no basta).
- **Supabase:** las cuatro columnas **ya existían en producción** (creadas a
  mano; comprobado consultando la API: `template = 'minimal'`, hero en
  null). Se documentan en `supabase/migrations/20261021000000_stores_template_and_hero.sql`
  (idempotente, con CHECK `stores_template_check`). No se ejecutó.
- **Ajustes:** `updateStoreSettings` valida y guarda la plantilla, el título,
  el subtítulo (vacíos = null) y la imagen de portada; si la portada cambia,
  borra la anterior del Storage (igual que el logo). El formulario tiene la
  sección "Diseño y Apariencia": plantilla como botones de radio
  ("Minimalista (Actual)", "Gamer (Oscuro/Impactante)", "Catálogo
  (Denso)"), "Título Principal", "Subtítulo" y "Imagen de Portada (Hero
  Banner)" con `ImagePicker`. Si falla una subida o el guardado, se
  descartan los archivos ya subidos.
- **`ImagePicker` y `resolveImageField`** aceptan un nombre de campo
  (`fieldName` / `field`, por defecto "image"), para tener logo y portada en
  el mismo formulario. Productos y logo siguen igual (usan el valor por
  defecto).
- **Vitrina:** `StorefrontTemplate.tsx` elige el catálogo según
  `store.template`. Por ahora las tres plantillas renderizan el
  `Storefront` actual; `gamer` y `grid` caen ahí hasta tener su componente.
  La portada llega como prop `hero` a `Storefront`, todavía sin mostrarse.

### Verificado
- `tsc`, `eslint` y `next build` con código 0.
- Servidor de desarrollo: la vitrina `/electro-demo` muestra el catálogo, el
  buscador y el pie como antes; `/admin/settings` sin sesión responde 307
  al login.

### Sin probar
- Guardar Ajustes con sesión de dueño (no hay sesión en esta sesión de
  trabajo): plantilla, textos, subir/pegar/quitar la portada y que el logo
  siga funcionando con dos selectores en el formulario.
- Si producción tiene un CHECK o un default distinto para `template`; si
  rechazara alguno de los tres valores, guardar Ajustes fallaría con "No se
  pudieron guardar los cambios".

### Riesgos
- Elegir "Gamer" o "Catálogo" hoy no cambia nada visible en la vitrina; el
  comerciante podría pensar que no se guardó.
- Las imágenes de portada van al mismo bucket que productos y logo, con
  prefijo `hero-`.

## 2026-10-21 · Plantilla "gamer" de la vitrina

Rama `feat/templates-y-hero`.

### Qué se hizo
- **`templates/GamerTheme.tsx`:** tienda de hardware, siempre oscura
  (`dark` + `bg-zinc-950` + `color-scheme: dark` en su contenedor, aunque el
  comprador o `default_theme` estén en claro).
  - Portada: imagen de portada con `bg-cover bg-center` sobre un degradado
    radial del color de marca (si la imagen no carga queda el degradado);
    con imagen, velo `from-zinc-950 via-black/60 to-black/40`; sin imagen,
    solo el fundido inferior. `min-h-[300px]`, `sm:min-h-[40vh]`. Centro:
    logo, nombre de la tienda (si hay título de portada), título
    `text-4xl md:text-6xl font-black uppercase` en color de marca (sin
    título de portada, el nombre de la tienda) y subtítulo `text-zinc-300`.
  - Buscador y categorías oscuros (`bg-zinc-900`, `border-zinc-800`,
    esquinas `rounded-md`); categoría activa en color de marca.
  - Grilla igual a la minimalista (2 / 3 / 4 columnas, última fila
    centrada) con `GamerProductCard`; hoja de detalle, pie y carrito dentro
    del contenedor oscuro.
- **`templates/GamerProductCard.tsx`:** `bg-zinc-900`, borde `zinc-800`,
  `rounded-lg`; al pasar el cursor, borde y brillo del color de marca
  (`shadow-[0_0_18px_…] shadow-brand/35`); foto sobre `bg-black/50` sin
  `mix-blend-multiply`; precio en color de marca; control de carrito con
  contorno (`AddToCartControl tone="outline"`).
- **Enrutador:** `StorefrontTemplate` ahora arma la página completa por
  plantilla (cabecera, catálogo, pie y carrito): `gamer` → `GamerTheme`;
  `minimal` y `grid` → `StoreHeader` (encabezado extraído de `page.tsx`) +
  `Storefront` + pie + carrito. `page.tsx` solo elige el fondo del
  contenedor (oscuro para gamer, para que no asome blanco).
- **Compartido:** `useCatalogFilters` (búsqueda, categorías, orden de
  agotados, texto de "sin resultados") y `CARD_WIDTH_CLASS`, usados por
  ambas plantillas. `ProductImage` acepta `blend={false}`; `AddToCartControl`
  y `ProductDetailSheet` aceptan `tone="outline"`.
- **Paleta de marca oscura dentro de la vitrina:** nueva regla
  `.brand-scope .dark` (además de `.dark .brand-scope`) para que un
  contenedor `.dark` interno use `--brand-dark`.

### Verificado
- `tsc`, `eslint` y `next build` con código 0. En el CSS compilado:
  `.brand-scope .dark` y el brillo al 35 % con `color-mix`.
- Capturas en Chromium (Pixel 7 con el sistema en claro, y 1280px), con la
  plantilla y una portada forzadas temporalmente en el servidor (parche
  quitado antes del commit): portada con imagen y sin ella, grilla, "− 2 +"
  con contorno, detalle, carrito en color de marca y brillo al pasar el
  cursor; sin errores de consola. En
  `/home/evargas/dev/app_local_store/capturas/plantilla-gamer/` (fuera del
  repo).
- **Ojo:** el parche temporal corrió en el servidor del usuario (5678, ya
  levantado sobre este árbol) durante las capturas, unos segundos; si el
  dominio público estaba expuesto, alguien pudo ver la tienda en "gamer".

### Sin probar
- Elegir "Gamer" desde Ajustes y verlo en la tienda real (requiere sesión).
- El fundido de la portada sin imagen después del último ajuste (no se
  volvió a capturar para no exponer otro parche en el servidor público).
- Celular real y Safari.

### Riesgos
- Fotos con fondo blanco (la mayoría en la tienda demo) se ven como
  recuadros blancos sobre la tarjeta oscura: la plantilla está pensada para
  fotos con fondo removido.
- Colores de marca muy oscuros: se aclaran con `--brand-dark` (calculado
  contra `slate-900`), pero el título y el precio pueden verse apagados
  sobre `zinc-950`.
- La plantilla "grid" sigue usando la minimalista.

## 2026-10-21 · Plantilla "grid" (Catálogo Denso)

Rama `feat/templates-y-hero`.

### Qué se hizo
- **`templates/GridTheme.tsx`:** para inventarios grandes; no usa la
  portada. Sigue el tema claro/oscuro de la tienda y del comprador.
  - Encabezado de una línea: franja superior de 3px en color de marca, logo
    de 32px, nombre (truncado) y `ThemeToggle`.
  - Buscador (36px) y categorías (32px) pegajosos con padding mínimo.
  - `max-w-[1600px]`, `px-2`; grilla `grid-cols-2 min-[480px]:grid-cols-3
    md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3` (CSS grid:
    aquí la última fila queda a la izquierda, como en un catálogo).
  - Hoja de detalle (para ver categoría y descripción), pie y carrito
    incluidos; contenedor `min-h-screen` para que no quede una franja
    blanca bajo el pie con pocos productos.
- **`templates/GridProductCard.tsx`:** `rounded-lg`, borde sutil,
  `bg-white dark:bg-zinc-900`, `p-2`. Foto cuadrada con `ProductImage`
  tamaño "thumb" (usa `ImageWithFallback` y conserva la inicial de
  respaldo). Sin categoría ni descripción. Nombre `text-xs sm:text-sm` en
  hasta 2 líneas (con alto mínimo de 2 líneas para alinear precio y botón en
  cada fila); precio `font-bold text-sm sm:text-base`; aviso de stock.
- **`AddToCartControl size="compact"`:** 32px de alto visibles (`h-8`,
  `rounded-md`, texto 13px) con el área táctil ampliada 6px arriba y abajo
  (`before:-inset-y-1.5`): 44px efectivos en celular. El selector reparte
  "−" y "+" a lo ancho.
- **Enrutador:** `grid` → `GridTheme`. Las tres plantillas ya tienen
  componente propio.

### Verificado
- `tsc`, `eslint` y `next build` con código 0.
- Capturas en Chromium sin errores de consola, con la plantilla forzada
  **en una copia aparte del repo** (worktree en otro puerto, borrada al
  terminar; no se tocó el servidor del usuario): 360px claro y oscuro (2
  columnas, "− 2 +", carrito), 480px (3 columnas), detalle y 1440px (6
  columnas). Botón compacto: 32px visibles, área táctil −6px/−6px. Pie hasta
  el borde inferior a 1440px. En
  `/home/evargas/dev/app_local_store/capturas/plantilla-grid/`.

### Sin probar
- Elegir "Catálogo (Denso)" desde Ajustes y verlo en la tienda real.
- Celular real (toques en el botón compacto) y catálogos realmente grandes
  (cientos de productos: no hay paginación ni carga diferida de la grilla;
  las imágenes sí son `loading="lazy"`).

### Riesgos
- Nombres de 12px en celular: dentro del rango acordado en la fase 2B
  (12–13px), pero en el límite inferior.
- El área táctil ampliada del botón compacto se superpone 6px con el precio
  de arriba; un toque justo encima del botón cuenta como "Agregar".

## 2026-10-21 · Plantilla gamer: fondo blanco y texto oscuro (blindaje)

Rama `feat/templates-y-hero`. El pedido indicaba hacer el commit en
`feat/superadmin-renovacion-y-metricas`, pero esa rama no contiene las
plantillas (`GamerTheme.tsx` no existe allí); se hizo en la rama donde vive
el código.

### Reporte
- Con la plantilla gamer, fondo de página blanco y textos de las tarjetas
  oscuros sobre fondo oscuro.

### Diagnóstico
- **No se reprodujo con el código actual.** La tienda real ya está en
  `gamer` (`default_theme = dark`); medido en Chromium contra el servidor
  del usuario, por localhost y por el dominio, con el sistema en claro y en
  oscuro: contenedor `zinc-950`, tarjeta `zinc-900`, título `zinc-100`, sin
  errores de consola. Tailwind incluye respaldo hexadecimal de los colores
  `lab()`, así que tampoco es un navegador sin soporte de `lab`/`oklch`.
- **Lo que sí se encontró:** si el comprador eligió antes el tema claro con
  el botón (queda en `localStorage`), `<html>` queda en `light` y el `body`
  blanco con texto oscuro. El contenedor gamer lo tapaba, pero cualquier
  zona que no cubriera (rebote del scroll en iPhone, o el CSS en un estado
  desfasado) mostraba ese blanco y ese texto oscuro heredado.
- **Probable en el navegador del usuario:** desfase de versiones por la
  caché de Cloudflare (también reescribe el CSS de desarrollo a
  `max-age=14400`), como en los errores anteriores. No se pudo confirmar.

### Qué se hizo
- **El tema oscuro se fuerza de raíz:** `ThemeProvider` y `StoreThemeScope`
  aceptan `forcedTheme`; la página pasa `forcedTheme="dark"` cuando la
  plantilla es gamer. Con eso `<html>`, `<body>` y `color-scheme` quedan
  oscuros aunque el comprador haya guardado el claro (verificado: con
  "light" guardado, `html.dark` y `body` `#0a0a0a`).
- **Cada plantilla controla su fondo:** el envoltorio de `page.tsx`
  (`StoreThemeScope`) ya no pone fondo ni color de texto (solo `flex
  min-h-full flex-col`, fuente y paleta). La minimalista tiene su propio
  contenedor (`bg-white text-zinc-900`, oscuro con `dark:`); la de catálogo
  suma `text-zinc-900 dark:text-zinc-100` y `color-scheme`.
- **Colores explícitos en gamer:** contenedor `min-h-screen w-full
  bg-zinc-950 text-zinc-100 flex flex-col` (más `.dark`); tarjeta
  `bg-zinc-900 text-zinc-100`; título del producto `text-zinc-100` en el
  `h2` y en el botón. La tarjeta no muestra descripción (está en el
  detalle).

### Verificado
- `tsc`, `eslint` y `next build` con código 0.
- Gamer (tienda real, servidor del usuario) con tema claro guardado:
  `html.dark`, `body` oscuro, colores correctos.
- Minimalista y catálogo, en una copia aparte del repo (worktree, borrada):
  claro y oscuro con colores correctos; envoltorio transparente.

### Sin probar
- El navegador o celular donde se vio el fallo. Si persiste: recarga
  forzada o ventana privada (caché de Cloudflare), y si aun así se ve,
  captura con la URL y el navegador.

## 2026-10-21 · Caché de Cloudflare cortada desde el repo (desarrollo)

Rama `feat/templates-y-hero`.

### Reporte
- Plantilla gamer con fondo blanco, nombres de producto invisibles, título
  diminuto y el aviso "A tree hydrated but some attributes … didn't match".

### Causa (confirmada)
- En el diff de hidratación, `+` es el cliente y `-` el servidor: el
  servidor mandó las clases de `a908246` (`w-full`, `text-zinc-100`) y el
  cliente tenía las de antes de ese commit. El navegador ejecutó JS viejo
  con HTML nuevo, y el CSS viejo no tenía `bg-zinc-950`, `text-zinc-100`
  ni `text-4xl` (de ahí el fondo blanco, los nombres oscuros y el título
  pequeño). Es la caché de Cloudflare de los errores anteriores: en
  desarrollo los JS/CSS de `/_next/static` conservan su URL aunque cambie
  el contenido, el origen manda `no-cache` y Cloudflare lo reescribía a
  `max-age=14400` (4 horas en el navegador).

### Qué se hizo
- `next.config.ts`, **solo en desarrollo** (`NODE_ENV === "development"`):
  `headers()` para `/_next/static/:path*` con `Cache-Control`,
  `CDN-Cache-Control` y `Cloudflare-CDN-Cache-Control` en `no-store`.
- Verificado por el dominio público: los 21 JS/CSS de la vitrina llegan con
  `cache-control: no-store` y `cf-cache-status: BYPASS` (antes
  `max-age=14400` y `REVALIDATED`). La vitrina gamer por el dominio, sin
  caché: colores correctos (captura
  `capturas/plantilla-gamer/gamer-dominio-1140-sin-cache.png`).
- En producción no cambia nada (`headers()` devuelve `[]`; los archivos
  con hash siguen con su caché inmutable).
- `tsc`, `eslint` y `next build` con código 0.

### Pendiente
- **Una sola vez:** los navegadores que ya guardaron copias viejas (hasta 4
  horas) las siguen usando hasta que expiren: recarga forzada
  (Ctrl+Shift+R) o borrar los datos del sitio en el celular. Desde ahí no
  debería repetirse.
- La regla de Cloudflare ya no es necesaria para esto.

### Diseño de la plantilla gamer (observaciones, sin cambios)
- Las fotos con fondo blanco se ven como recuadros blancos sobre las
  tarjetas oscuras y la portada sin imagen queda sobria (solo logo y
  nombre). Mejoran con fotos de fondo removido y una imagen de portada en
  Ajustes.
