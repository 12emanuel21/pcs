-- Plantilla visual de la vitrina y portada (hero) opcional.
--
-- Estas columnas YA EXISTEN en producción (se crearon a mano desde el SQL
-- Editor antes de esta migración, comprobado el 2026-10-21 consultando la
-- API: template = 'minimal' y los campos hero en null). Este archivo las
-- documenta. Es idempotente: no falla ni duplica si ya existen.
--
-- No se ha ejecutado desde el repositorio. ADD COLUMN IF NOT EXISTS no altera
-- columnas que ya existen: si en producción "template" es nullable o tiene
-- otro default, esta migración no lo cambia.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;

-- Valores permitidos (los de src/lib/templates.ts). Se agrega solo si no
-- existe una restricción con este nombre.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stores_template_check'
      AND conrelid = 'public.stores'::regclass
  ) THEN
    ALTER TABLE public.stores
      ADD CONSTRAINT stores_template_check
      CHECK (template IN ('minimal', 'gamer', 'grid'));
  END IF;
END $$;
