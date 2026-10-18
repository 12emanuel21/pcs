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
