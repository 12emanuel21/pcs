"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createMerchantAndStore } from "@/app/superadmin/actions";
import { slugify } from "@/lib/slug";

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

export default function CreateStoreModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <Plus size={16} />
        Nueva Tienda / Cliente
      </button>

      {/* El formulario se monta al abrir: su estado se reinicia en cada apertura. */}
      {isOpen && <CreateStoreForm onClose={() => setIsOpen(false)} />}
    </>
  );
}

function CreateStoreForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // Mientras el usuario no edite el slug a mano, se deriva del nombre.
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (!isPending) onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!slugTouched) setSlug(slugify(e.target.value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  // onSubmit en vez de action={...}: React 19 resetea el formulario al
  // terminar una form action, incluso si falló, y se perderían los datos.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createMerchantAndStore(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(`Tienda "${name}" creada. Ya puedes compartir el acceso con el dueño.`);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-left"
      onClick={close}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Nueva tienda / cliente
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <fieldset
          disabled={isPending}
          className="mt-4 flex flex-col gap-4 text-sm font-medium text-slate-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tienda
          </p>
          <label className="flex flex-col gap-1">
            Nombre de la tienda *
            <input
              name="name"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="CompuParque Local 104"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            Slug / ID de la URL *
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="bg-slate-50 px-3 py-2 font-normal text-slate-400">
                /
              </span>
              <input
                name="slug"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="compuparque-104"
                className="flex-1 px-2 py-2 font-mono font-normal text-slate-900 outline-none"
              />
            </div>
            <span className="text-xs font-normal text-slate-500">
              Es la URL pública del catálogo. No se puede cambiar después.
            </span>
          </label>

          <label className="flex flex-col gap-1">
            WhatsApp del negocio *
            <input
              name="whatsapp_number"
              type="tel"
              inputMode="tel"
              required
              placeholder="573001234567"
              className={inputClass}
            />
          </label>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Acceso del dueño
          </p>
          <label className="flex flex-col gap-1">
            Email del dueño *
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="dueno@ejemplo.com"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            Contraseña inicial *
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                className={`${inputClass} w-full pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="text-xs font-normal text-slate-500">
              Mínimo 8 caracteres. Pídele al dueño que la cambie al ingresar.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isPending ? "Creando..." : "Crear tienda y usuario"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
