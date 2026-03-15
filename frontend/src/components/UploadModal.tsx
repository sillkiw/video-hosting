import { useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import type { UploadState } from "../types/upload";
import { classNames } from "../utils/classNames";

type Props = {
  isOpen: boolean;
  isDark: boolean;
  title: string;
  file: File | null;
  state: UploadState;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onFileChosen: (file: File | null) => void;
  onSubmit: () => Promise<void>;
};

export function UploadModal({
  isOpen,
  isDark,
  title,
  file,
  state,
  onClose,
  onTitleChange,
  onFileChosen,
  onSubmit,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const disabled = state.kind === "creating" || state.kind === "uploading";

  function onPickFileClick() {
    inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) onFileChosen(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={classNames(
          "w-full max-w-lg overflow-hidden rounded-xl border shadow-[0_25px_80px_-20px_rgba(0,0,0,0.45)] transition-[background-color,border-color,color] duration-500 ease-in-out",
          isDark ? "border-white/10 bg-[#14171F]" : "border-slate-200 bg-white"
        )}
      >
        <div
          className={classNames(
            "flex items-center justify-between border-b px-6 py-4 transition-[border-color] duration-500",
            isDark ? "border-white/10" : "border-slate-200"
          )}
        >
          <div
            className={classNames(
              "text-base font-bold transition-colors duration-500",
              isDark ? "text-white" : "text-[#111827]"
            )}
          >
            Upload new video
          </div>

          <button
            onClick={onClose}
            className={classNames(
              "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ease-in-out",
              disabled
                ? isDark
                  ? "cursor-not-allowed bg-white/5 text-white/25"
                  : "cursor-not-allowed bg-slate-100 text-slate-300"
                : isDark
                ? "bg-white/5 text-white/80 hover:bg-white/10"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={classNames(
              "rounded-xl border-2 border-dashed p-6 text-center transition-[background-color,border-color] duration-500 ease-in-out",
              file ? "border-[#2563EB]" : isDark ? "border-white/15" : "border-slate-300",
              file
                ? isDark
                  ? "bg-[#0F172A]"
                  : "bg-[#EFF6FF]"
                : isDark
                ? "bg-[#10131A]"
                : "bg-slate-50"
            )}
          >
            <div
              className={classNames(
                "mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-[background-color,box-shadow] duration-500",
                isDark ? "bg-[#1B2230]" : "bg-white shadow-sm"
              )}
            >
              <FiUpload className="text-[#60A5FA]" />
            </div>

            <div
              className={classNames(
                "text-sm transition-colors duration-500",
                isDark ? "text-white/85" : "text-slate-700"
              )}
            >
              Перетащите файл сюда или{" "}
              <button
                type="button"
                onClick={onPickFileClick}
                className="font-bold text-[#2563EB] transition-colors duration-300 hover:text-[#1D4ED8]"
              >
                выберите файл
              </button>
            </div>

            <div
              className={classNames(
                "mt-2 text-xs transition-colors duration-500",
                isDark ? "text-white/45" : "text-slate-500"
              )}
            >
              Поддерживается MP4. {file ? `Выбрано: ${file.name}` : "Файл не выбран"}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="video/mp4"
              className="hidden"
              onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
              disabled={disabled}
            />
          </div>

          <div className="mt-4">
            <label
              className={classNames(
                "text-sm font-medium transition-colors duration-500",
                isDark ? "text-white/85" : "text-slate-700"
              )}
            >
              Название
            </label>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Введите название видео"
              className={classNames(
                "mt-2 w-full rounded-lg border px-4 py-3 text-sm outline-none transition-[background-color,border-color,color,box-shadow] duration-500 ease-in-out",
                isDark
                  ? "border-white/10 bg-[#0F1117] text-white placeholder:text-white/30 focus:border-[#2563EB]"
                  : "border-slate-200 bg-white text-[#111827] placeholder:text-slate-400 focus:border-[#2563EB]"
              )}
              disabled={disabled}
            />
          </div>

          <div className="mt-4 min-h-[22px] text-sm">
            {state.kind === "creating" && (
              <span className={isDark ? "text-white/55" : "text-slate-500"}>
                Создаю запись…
              </span>
            )}

            {state.kind === "uploading" && (
              <span className={isDark ? "text-white/55" : "text-slate-500"}>
                Загружаю файл…
              </span>
            )}

            {state.kind === "done" && (
              <span className="text-emerald-600">
                Готово. Video ID: <code>{state.id}</code>
              </span>
            )}

            {state.kind === "error" && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
                <div className="font-semibold">{state.err.title}</div>
                {state.err.description && <div className="mt-1">{state.err.description}</div>}
                {state.err.fieldErrors?.length ? (
                  <ul className="mt-2 list-disc pl-5">
                    {state.err.fieldErrors.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={classNames(
              "mt-4 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-black uppercase tracking-wide transition-all duration-300",
              disabled
                ? "cursor-not-allowed bg-[#93C5FD] text-white/80"
                : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-lg"
            )}
            disabled={disabled}
          >
            Опубликовать
          </button>

          <div
            className={classNames(
              "mt-3 text-xs transition-colors duration-500",
              isDark ? "text-white/40" : "text-slate-500"
            )}
          >
            После загрузки появится ID. Следующий шаг — статус видео и проигрывание DASH.
          </div>
        </form>
      </div>
    </div>
  );
}