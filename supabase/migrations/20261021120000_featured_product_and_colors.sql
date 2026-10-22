-- Producto estrella de la portada (tienda) y colores disponibles (producto).
--
-- Estas columnas YA EXISTEN en producción (comprobado el 2026-10-21
-- consultando la API: stores.featured_product_id = null y products.colors =
-- []). La API no expone su tipo exacto; este archivo documenta el esperado.
-- Es idempotente: ADD COLUMN IF NOT EXISTS no altera columnas existentes.
--
-- No se ha ejecutado desde el repositorio.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS featured_product_id UUID
    REFERENCES public.products (id) ON DELETE SET NULL;

-- Arreglo de códigos #RRGGBB (los valida src/lib/colors.ts).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS colors TEXT[] NOT NULL DEFAULT '{}';
