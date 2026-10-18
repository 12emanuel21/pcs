# Bitácora

## 2026-10-18 · Tema: next-themes estándar, un proveedor por zona

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
