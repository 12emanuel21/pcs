"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { isHttpUrl, isStorageImage, MAX_IMAGE_BYTES } from "@/lib/images";

type ImageMode = "file" | "url";

interface ImagePickerProps {
  currentImage: string | null;
  // Clase de proporción del área de imagen (ej: "aspect-video", "aspect-square").
  aspectClass?: string;
  removeLabel?: string;
  onError?: (message: string | null) => void;
}

// Selector "Subir archivo" / "Pegar enlace". No sube nada por sí mismo: deja
// en el formulario los campos image_mode, image, image_url_input e
// image_remove, que resolveImageField (lib/upload-image.ts) procesa al enviar.
export default function ImagePicker({
  currentImage,
  aspectClass = "aspect-video",
  removeLabel = "Quitar imagen",
  onError,
}: ImagePickerProps) {
  const hasExternalImage = currentImage !== null && !isStorageImage(currentImage);

  const [mode, setMode] = useState<ImageMode>(hasExternalImage ? "url" : "file");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState(hasExternalImage ? currentImage : "");
  const [urlImageFailed, setUrlImageFailed] = useState(false);
  const [removed, setRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Libera la URL temporal de la previsualización cuando cambia o se desmonta.
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onError?.(null);

    if (file && file.size > MAX_IMAGE_BYTES) {
      onError?.("La imagen no puede superar 5 MB.");
      e.target.value = "";
      setFilePreview(null);
      return;
    }

    setFilePreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlValue(e.target.value);
    setUrlImageFailed(false);
    if (e.target.value) setRemoved(false);
  };

  // En "Subir archivo" se muestra el archivo nuevo o, si no hay, la imagen
  // actual de Storage. Las externas se gestionan desde la pestaña de enlace.
  const fileTabImage =
    filePreview ?? (removed || hasExternalImage ? null : currentImage);
  const trimmedUrl = urlValue.trim();
  const urlIsValid = isHttpUrl(trimmedUrl);
  const hasNewImage = Boolean(filePreview) || trimmedUrl !== "";
  const canRemove = currentImage !== null && !removed;

  const tabClass = (tab: ImageMode) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      mode === tab
        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="image_mode" value={mode} />
      {removed && !hasNewImage && (
        <input type="hidden" name="image_remove" value="1" />
      )}

      <div role="tablist" className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "file"}
          onClick={() => setMode("file")}
          className={tabClass("file")}
        >
          <Upload size={14} />
          Subir archivo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "url"}
          onClick={() => setMode("url")}
          className={tabClass("url")}
        >
          <Link2 size={14} />
          Pegar enlace (URL)
        </button>
      </div>

      {/* Ambas pestañas quedan montadas (solo se ocultan) para no perder el
          archivo elegido o la URL escrita al alternar. */}
      <label
        className={`group relative flex ${aspectClass} cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500 ${
          mode === "file" ? "" : "hidden"
        }`}
      >
        {fileTabImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileTabImage}
              alt="Previsualización"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white group-hover:bg-black/75">
              <ImagePlus size={14} />
              Cambiar imagen
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 px-4 text-center font-normal text-zinc-500 dark:text-zinc-400">
            <ImagePlus size={28} />
            Toca para elegir una imagen
            <span className="text-xs">JPG, PNG o WebP · máx. 5 MB</span>
          </span>
        )}
        <input
          ref={fileInputRef}
          name="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      <div className={`flex flex-col gap-2 ${mode === "url" ? "" : "hidden"}`}>
        <input
          name="image_url_input"
          // type="text": con type="url", un valor inválido en la pestaña
          // oculta bloquearía el submit sin mostrar el error.
          type="text"
          inputMode="url"
          value={urlValue}
          onChange={handleUrlChange}
          placeholder="https://ejemplo.com/foto.jpg"
          className="rounded-lg border border-zinc-300 px-3 py-2 font-normal text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
        />
        <div
          className={`flex ${aspectClass} items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950`}
        >
          {urlIsValid && !urlImageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={trimmedUrl}
              src={trimmedUrl}
              alt="Previsualización"
              onError={() => setUrlImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex flex-col items-center gap-1 px-4 text-center text-xs font-normal text-zinc-500 dark:text-zinc-400">
              <ImageOff size={24} />
              {urlImageFailed
                ? "No se pudo cargar la imagen desde ese enlace."
                : trimmedUrl
                  ? "El enlace debe empezar por http:// o https://."
                  : "Pega un enlace para ver la previsualización."}
            </span>
          )}
        </div>
      </div>

      {currentImage !== null && (
        <div className="flex items-center justify-between gap-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
          <span>
            {removed && !hasNewImage
              ? "La imagen actual se quitará al guardar."
              : "Si no eliges una imagen nueva, se conserva la actual."}
          </span>
          {canRemove ? (
            <button
              type="button"
              onClick={() => {
                setRemoved(true);
                setUrlValue("");
                setUrlImageFailed(false);
                setFilePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 size={12} />
              {removeLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRemoved(false);
                if (hasExternalImage) setUrlValue(currentImage);
              }}
              className="shrink-0 rounded px-1.5 py-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Deshacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
