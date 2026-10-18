"use client";

import { useRef, useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteStaff } from "@/app/admin/staff/actions";

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 font-normal text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300";

export default function InviteStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  // onSubmit en vez de action={...}: React 19 resetea el formulario al
  // terminar una form action, incluso si falló. Aquí solo se limpia al crear.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");

    startTransition(async () => {
      const result = await inviteStaff(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Empleado creado. Compártele su acceso: ${email} y la contraseña inicial.`,
      );
      formRef.current?.reset();
      setShowPassword(false);
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        <UserPlus size={20} />
        Invitar empleado
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Se crea una cuenta nueva para tu vendedor. Podrá gestionar productos,
        pedidos y soporte, pero no los ajustes ni los empleados.
      </p>

      <fieldset
        disabled={isPending}
        className="mt-4 grid grid-cols-1 gap-4 text-sm font-medium text-zinc-700 sm:grid-cols-2 dark:text-zinc-300"
      >
        <label className="flex flex-col gap-1">
          Email del empleado *
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            placeholder="vendedor@ejemplo.com"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          Rol
          <select name="role" defaultValue="STAFF" className={inputClass}>
            <option value="STAFF">Vendedor (STAFF)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
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
              className="absolute inset-y-0 right-2 flex items-center text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Mínimo 8 caracteres. El empleado entra en /admin/login con este
            email y contraseña.
          </span>
        </label>

        <div className="flex justify-end sm:col-span-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {isPending ? "Creando..." : "Crear empleado"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
