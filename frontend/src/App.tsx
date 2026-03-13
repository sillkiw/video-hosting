import { useMemo, useRef, useState } from "react";
import { FiUpload, FiUser, FiPlayCircle, FiX } from "react-icons/fi";
import { createVideo, uploadVideo, humanizeError } from "./api";
import type { ApiError, CreateResponse, UiError } from "./api";

type UploadState =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "uploading"; id: string }
  | { kind: "done"; id: string }
  | { kind: "error"; err: UiError };

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Logo() {
  return (
    <div className="flex items-center select-none">
      <span className="text-lg font-extrabold tracking-tight">
        <span className="bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] bg-clip-text text-transparent">
          go
        </span>
        <span className="text-[#1F2937]">watch</span>
      </span>
      <span
        className="ml-2 inline-flex items-center rounded-[10px] bg-[#2563EB] px-2.5 py-1 text-[12px] font-extrabold leading-none tracking-[0.14em] text-white
                   shadow-[0_10px_25px_-10px_rgba(37,99,235,0.55)] transition
                   hover:bg-[#1D4ED8] hover:shadow-[0_14px_30px_-12px_rgba(37,99,235,0.65)] active:scale-[0.98]"
      >
        HUB
      </span>
    </div>
  );
}

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // upload form state
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ kind: "idle" });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const inferredContentType = useMemo(() => {
    if (!file) return "video/mp4";
    return file.type || "video/mp4";
  }, [file]);

  function openModal() {
    setIsModalOpen(true);
    setState({ kind: "idle" });
  }

  function closeModal() {
    if (state.kind === "creating" || state.kind === "uploading") return;
    setIsModalOpen(false);
  }

  function onPickFileClick() {
    inputRef.current?.click();
  }

  function onFileChosen(f: File | null) {
    setFile(f);
    if (f && !title.trim()) {
      const base = f.name.replace(/\.[^/.]+$/, "");
      setTitle(base);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) onFileChosen(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // локальные проверки (без code, только человеческий текст)
    if (!file) {
      setState({
        kind: "error",
        err: { title: "Файл не выбран", description: "Выберите MP4-файл для загрузки." },
      });
      return;
    }
    if (!title.trim()) {
      setState({
        kind: "error",
        err: { title: "Название не задано", description: "Введите название видео." },
      });
      return;
    }

    try {
      setState({ kind: "creating" });

      const created: CreateResponse = await createVideo({
        title: title.trim(),
        content_type: inferredContentType,
        size: file.size,
      });

      setState({ kind: "uploading", id: created.id });
      await uploadVideo(created.upload.url, created.upload.method, file, created.upload.headers);

      setState({ kind: "done", id: created.id });
    } catch (err: any) {
      const apiErr = err as ApiError;
      setState({ kind: "error", err: humanizeError(apiErr) });
    }
  }

  const gridPlaceholders = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2937]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />

            <button
              onClick={openModal}
              className="group inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm transition
                         hover:bg-[#1D4ED8] hover:shadow-md active:scale-[0.99]"
            >
              <FiUpload className="text-white/95 transition group-hover:translate-y-[-1px]" />
              Загрузить
            </button>
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E5E7EB] text-[#1F2937] transition hover:bg-[#D1D5DB]"
            aria-label="Account"
            title="Account"
          >
            <FiUser />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Галерея</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Пока это заглушки. Позже добавим реальный список, статус и воспроизведение.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gridPlaceholders.map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.08)]"
            >
              {/* Preview */}
              <div className="relative aspect-video bg-gradient-to-br from-[#E0E7FF] to-[#C7D2FE]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiPlayCircle className="h-12 w-12 text-[#2563EB] opacity-70" />
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="mb-2 line-clamp-1 font-semibold text-[#374151]">
                  Название видео
                </div>
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E5E7EB]">
                      <FiUser className="text-[#1F2937]" />
                    </span>
                    Автор
                  </div>
                  <div>1.2K просмотров</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_18px_45px_-15px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div className="text-base font-semibold">Загрузить новое видео</div>
              <button
                onClick={closeModal}
                className={classNames(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                  state.kind === "creating" || state.kind === "uploading"
                    ? "cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF]"
                    : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                )}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={classNames(
                  "rounded-2xl border-2 border-dashed p-6 text-center transition",
                  file ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#2563EB] bg-[#F3F4F6]"
                )}
              >
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <FiUpload className="text-[#2563EB]" />
                </div>

                <div className="text-sm text-[#374151]">
                  Перетащите файл сюда или{" "}
                  <button
                    type="button"
                    onClick={onPickFileClick}
                    className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                  >
                    выберите файл
                  </button>
                </div>

                <div className="mt-2 text-xs text-[#6B7280]">
                  Поддерживается MP4. {file ? `Выбрано: ${file.name}` : "Файл не выбран"}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4"
                  className="hidden"
                  onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
                  disabled={state.kind === "creating" || state.kind === "uploading"}
                />
              </div>

              {/* Title */}
              <div className="mt-4">
                <label className="text-sm font-medium text-[#374151]">Название</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название видео"
                  className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]"
                  disabled={state.kind === "creating" || state.kind === "uploading"}
                />
              </div>

              {/* State / Error */}
              <div className="mt-4 min-h-[22px] text-sm">
                {state.kind === "creating" && (
                  <span className="text-[#6B7280]">Создаю запись…</span>
                )}
                {state.kind === "uploading" && (
                  <span className="text-[#6B7280]">Загружаю файл…</span>
                )}
                {state.kind === "done" && (
                  <span className="text-emerald-700">
                    Готово. Video ID: <code className="text-emerald-800">{state.id}</code>
                  </span>
                )}
                {state.kind === "error" && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
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

              {/* Submit */}
              <button
                type="submit"
                className={classNames(
                  "mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition",
                  state.kind === "creating" || state.kind === "uploading"
                    ? "cursor-not-allowed bg-[#93C5FD]"
                    : "bg-[#2563EB] hover:bg-[#1D4ED8] hover:shadow-md active:scale-[0.99]"
                )}
                disabled={state.kind === "creating" || state.kind === "uploading"}
              >
                Опубликовать
              </button>

              <div className="mt-3 text-xs text-[#6B7280]">
                После загрузки появится ID. Следующий шаг — статус видео и проигрывание DASH.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}