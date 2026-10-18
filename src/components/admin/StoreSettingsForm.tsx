"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  Moon,
  ShoppingCart,
  Sun,
  SunMoon,
} from "lucide-react";
import { updateStoreSettings } from "@/app/admin/settings/actions";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  DEFAULT_STORE_FONT,
  isStoreFontName,
  STORE_FONT_NAMES,
} from "@/lib/font-names";
import { STORE_FONTS } from "@/lib/fonts";
import {
  isThemeOption,
  THEME_LABELS,
  THEME_OPTIONS,
  type ThemeOption,
} from "@/lib/theme";
import { discardUpload, resolveImageField } from "@/lib/upload-image";
import type { Store } from "@/types";

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 font-normal text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300";

const THEME_ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: SunMoon,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const FALLBACK_COLOR = "#18181B";

interface StoreSettingsFormProps {
  store: Store;
}

export default function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const initialColor = HEX_COLOR.test(store.theme_color)
    ? store.theme_color.toUpperCase()
    : FALLBACK_COLOR;

  const [color, setColor] = useState(initialColor);
  const [colorText, setColorText] = useState(initialColor);
  const [font, setFont] = useState(
    isStoreFontName(store.font_family) ? store.font_family : DEFAULT_STORE_FONT,
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Cambiar la key remonta ImagePicker tras guardar, limpiando archivo y URL.
  const [pickerKey, setPickerKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleColorText = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    if (value && !value.startsWith("#")) value = `#${value}`;
    setColorText(value);
    if (HEX_COLOR.test(value)) setColor(value.toUpperCase());
  };

  const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setColor(value);
    setColorText(value);
  };

  // onSubmit en vez de action={...}: React 19 resetea el formulario al
  // terminar una form action, incluso si falló, y se perderían los datos.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);

    if (!HEX_COLOR.test(colorText)) {
      setError("El color debe ser un código hexadecimal, ej: #E11D48.");
      return;
    }

    startTransition(async () => {
      const image = await resolveImageField(formData, store.id, "logo-");
      if (image.error) {
        setError(image.error);
        return;
      }

      const result = await updateStoreSettings(formData);

      if (result.error) {
        await discardUpload(image.uploadedPath);
        setError(result.error);
        return;
      }

      setSaved(true);
      setPickerKey((key) => key + 1);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => setSaved(false)}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <fieldset
        disabled={isPending}
        className="flex flex-col gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        <label className="flex flex-col gap-1">
          Nombre de la Tienda *
          <input
            name="name"
            required
            defaultValue={store.name}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          Número de WhatsApp para pedidos *
          <input
            name="whatsapp_number"
            type="tel"
            inputMode="tel"
            required
            defaultValue={store.whatsapp_number}
            placeholder="573001234567"
            className={inputClass}
          />
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Ingresa tu número con indicativo, ej: 573001234567. Si escribes un
            celular colombiano de 10 dígitos, agregamos el 57 automáticamente.
          </span>
        </label>

        <div className="flex flex-col gap-2">
          Color de Marca *
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={handleColorPicker}
              aria-label="Selector de color"
              className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              name="theme_color"
              value={colorText}
              onChange={handleColorText}
              maxLength={7}
              spellCheck={false}
              aria-label="Código HEX del color"
              className={`${inputClass} w-32 font-mono uppercase`}
            />
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                Vista previa:
              </span>
              <span
                style={{ backgroundColor: color }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
              >
                <ShoppingCart size={14} />
                Agregar al Carrito
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="font_family">Tipografía de la vitrina</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              id="font_family"
              name="font_family"
              value={font}
              onChange={(e) =>
                isStoreFontName(e.target.value) && setFont(e.target.value)
              }
              className={`${inputClass} w-56`}
            >
              {STORE_FONT_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <p
              className={`rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-lg font-normal text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 ${STORE_FONTS[font].className}`}
            >
              {store.name} · Aa Bb 123
            </p>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">Tema por defecto de la vitrina</legend>
          <div className="grid max-w-md grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            {THEME_OPTIONS.map((option) => {
              const Icon = THEME_ICONS[option];
              return (
                <label key={option} className="cursor-pointer">
                  <input
                    type="radio"
                    name="default_theme"
                    value={option}
                    defaultChecked={
                      (isThemeOption(store.default_theme)
                        ? store.default_theme
                        : "system") === option
                    }
                    className="peer sr-only"
                  />
                  <span className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-zinc-600 transition-all duration-200 peer-checked:bg-white peer-checked:font-semibold peer-checked:text-zinc-900 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-400 dark:text-zinc-400 dark:peer-checked:bg-zinc-700 dark:peer-checked:text-zinc-100">
                    <Icon size={16} />
                    {option === "system" ? "Sistema" : THEME_LABELS[option]}
                  </span>
                </label>
              );
            })}
          </div>
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Cómo ven la tienda tus clientes al entrar. &quot;Sistema&quot; sigue
            la configuración de su celular; ellos pueden cambiarlo con el
            botón de la cabecera.
          </span>
        </fieldset>

        <div className="flex flex-col gap-2">
          Logo de la Tienda
          <div className="max-w-xs">
            <ImagePicker
              key={pickerKey}
              currentImage={store.logo_url ?? null}
              aspectClass="aspect-square"
              removeLabel="Quitar logo"
              onError={setError}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
        )}
        {saved && (
          <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-700 dark:bg-green-950/40 dark:text-green-300">
            <CheckCircle2 size={16} />
            Cambios guardados.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
