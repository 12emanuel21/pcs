@AGENTS.md

# LocalStore

Micro-SaaS multitenant: el cliente escanea un QR, ve el catálogo de la tienda
en `/{storeId}`, arma su carrito y envía el pedido por WhatsApp. Las tiendas
se gestionan en `/admin` y la plataforma en `/superadmin`.

## Stack
- Next.js 16 (App Router, `cacheComponents`, `proxy.ts`). Antes de escribir
  código, revisar la guía correspondiente en `node_modules/next/dist/docs/`.
- Tailwind CSS v4 (configuración en `src/app/globals.css`, sin `tailwind.config`).
- next-themes: clase `.dark` en `<html>`, un `ThemeProvider` por zona
  (`/admin`, `/superadmin`, vitrina).
- Supabase (`@supabase/ssr` para sesión; cliente service role solo tras
  verificar el rol). Cambios de esquema en `supabase/migrations/`.

## Reglas de trabajo
- Al iniciar cada sesión, leer `BITACORA.md`.
- Al terminar cada tarea, agregar una entrada a `BITACORA.md` con: fecha, qué
  se hizo, qué quedó sin probar y riesgos.
- Nunca trabajar directo en `main`: cada cambio va en su propia rama.

## Riesgos conocidos
- Navegar con `<Link>` entre `/admin` y `/[storeId]` deja en `<html>` el tema
  de la zona anterior (next-themes no limpia la clase al desmontarse). Detalle
  en `BITACORA.md`, entrada del 2026-10-18.
