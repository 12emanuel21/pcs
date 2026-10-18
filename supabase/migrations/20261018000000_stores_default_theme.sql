-- Tema por defecto de la vitrina de cada tienda (claro, oscuro o sistema).
-- Ya aplicada manualmente en producción desde el SQL Editor de Supabase
-- (2026-10-18). Es idempotente: se puede volver a ejecutar sin error.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS default_theme TEXT NOT NULL DEFAULT 'system';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stores_default_theme_check'
      AND conrelid = 'public.stores'::regclass
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_default_theme_check
      CHECK (default_theme IN ('light', 'dark', 'system'));
  END IF;
END
$$;
