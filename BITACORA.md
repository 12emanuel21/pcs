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
