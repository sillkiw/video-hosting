import { useMemo, useRef, useState } from "react";
import {
  FiUpload,
  FiUser,
  FiPlayCircle,
  FiX,
  FiSun,
  FiMoon,
} from "react-icons/fi";
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

function Logo({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center select-none">
      <span className="flex items-center text-xl font-black tracking-tight">
        <span className="text-[#2563EB]">Go</span>
        <span
          className={classNames(
            "transition-colors duration-500",
            isDark ? "text-white" : "text-[#111827]"
          )}
        >
          Watch
        </span>
        <span className="ml-1 rounded-md bg-[#2563EB] px-2 py-0.5 text-white shadow-sm">
          HUB
        </span>
      </span>
    </div>
  );
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M просмотров`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K просмотров`;
  return `${n} просмотров`;
}

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

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

    if (!file) {
      setState({
        kind: "error",
        err: {
          title: "Файл не выбран",
          description: "Выберите MP4-файл для загрузки.",
        },
      });
      return;
    }

    if (!title.trim()) {
      setState({
        kind: "error",
        err: {
          title: "Название не задано",
          description: "Введите название видео.",
        },
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
      await uploadVideo(
        created.upload.url,
        created.upload.method,
        file,
        created.upload.headers
      );

      setState({ kind: "done", id: created.id });
    } catch (err: any) {
      const apiErr = err as ApiError;
      setState({ kind: "error", err: humanizeError(apiErr) });
    }
  }

  const mockVideos = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    title: `Demo video ${i + 1}`,
    author: "Creator",
    views: 1200 * (i + 1),
    duration: ["12:43", "08:19", "21:04", "04:58"][i % 4],
  }));

  return (
    <div
      className={classNames(
        "min-h-screen transition-[background-color,color] duration-500 ease-in-out",
        isDark ? "bg-[#0B0B0F] text-white" : "bg-[#F8FAFC] text-[#111827]"
      )}
    >
      {/* Header */}
      <header
        className={classNames(
          "sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,border-color,color] duration-500 ease-in-out",
          isDark
            ? "border-white/10 bg-[#111318]/95"
            : "border-black/5 bg-white/90"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Logo isDark={isDark} />
          </div>

          <div className="hidden flex-1 px-6 md:block">
            <div className="mx-auto max-w-xl">
              <input
                placeholder="Поиск видео..."
                className={classNames(
                  "h-10 w-full rounded-md border px-4 text-sm outline-none transition-[background-color,border-color,color,box-shadow] duration-500 ease-in-out",
                  isDark
                    ? "border-white/10 bg-[#1A1D24] text-white placeholder:text-white/35 focus:border-[#2563EB]"
                    : "border-slate-200 bg-white text-[#111827] placeholder:text-slate-400 focus:border-[#2563EB]"
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark((v) => !v)}
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-in-out",
                isDark
                  ? "border-white/10 bg-[#1A1D24] text-white hover:border-[#2563EB]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
              )}
              aria-label="Toggle theme"
              title="Сменить тему"
            >
              <span className="transition-transform duration-500 ease-in-out hover:rotate-12">
                {isDark ? <FiSun /> : <FiMoon />}
              </span>
            </button>

            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-lg"
            >
              <FiUpload />
              Загрузить
            </button>

            <button
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-in-out",
                isDark
                  ? "border-white/10 bg-[#1A1D24] text-white hover:border-[#2563EB] hover:text-[#60A5FA]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
              )}
              aria-label="Account"
              title="Account"
            >
              <FiUser />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className={classNames(
          "border-b transition-[background-color,border-color] duration-500 ease-in-out",
          isDark
            ? "border-white/5 bg-gradient-to-b from-[#111318] to-[#0B0B0F]"
            : "border-black/5 bg-gradient-to-b from-[#EFF6FF] to-[#F8FAFC]"
        )}
      >
      
      </section>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Trending</h2>
            <p
              className={classNames(
                "mt-1 text-sm transition-colors duration-500",
                isDark ? "text-white/45" : "text-slate-500"
              )}
            >
              Пока это моковые карточки. Дальше можно подключить реальный список.
            </p>
          </div>

          <div className="hidden gap-2 md:flex">
            {["All", "New", "Popular", "HD"].map((x) => (
              <button
                key={x}
                className={classNames(
                  "rounded-md border px-3 py-1.5 text-sm font-semibold transition-all duration-500 ease-in-out",
                  x === "All"
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : isDark
                    ? "border-white/10 bg-[#151821] text-white/75 hover:border-[#2563EB] hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
                )}
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockVideos.map((video) => (
            <article
              key={video.id}
              className={classNames(
                "group overflow-hidden rounded-lg ring-1 transition-[background-color,transform,box-shadow,border-color] duration-500 ease-in-out",
                isDark
                  ? "bg-[#14171F] ring-white/6 hover:-translate-y-0.5 hover:ring-[#2563EB]/60"
                  : "bg-white ring-black/6 shadow-sm hover:-translate-y-0.5 hover:ring-[#2563EB]/60 hover:shadow-lg"
              )}
            >
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB]">
                <div className="absolute inset-0 bg-black/20 transition duration-300 group-hover:bg-black/10" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:bg-[#2563EB]">
                    <FiPlayCircle className="h-7 w-7 text-white" />
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {video.duration}
                </div>
              </div>

              <div className="p-3">
                <div
                  className={classNames(
                    "text-sm font-bold leading-5 transition-colors duration-500",
                    isDark ? "text-white" : "text-[#111827]"
                  )}
                >
                  {video.title}
                </div>

                <div
                  className={classNames(
                    "mt-2 flex items-center gap-2 text-xs transition-colors duration-500",
                    isDark ? "text-white/55" : "text-slate-500"
                  )}
                >
                  <span
                    className={classNames(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full transition-[background-color,color] duration-500",
                      isDark ? "bg-[#1F2430]" : "bg-slate-100"
                    )}
                  >
                    <FiUser className={isDark ? "text-white/80" : "text-slate-700"} />
                  </span>
                  <span>{video.author}</span>
                </div>

                <div
                  className={classNames(
                    "mt-2 text-xs transition-colors duration-500",
                    isDark ? "text-white/40" : "text-slate-400"
                  )}
                >
                  {formatViews(video.views)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-opacity duration-300"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={classNames(
              "w-full max-w-lg overflow-hidden rounded-xl border shadow-[0_25px_80px_-20px_rgba(0,0,0,0.45)] transition-[background-color,border-color,color] duration-500 ease-in-out",
              isDark
                ? "border-white/10 bg-[#14171F]"
                : "border-slate-200 bg-white"
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
                onClick={closeModal}
                className={classNames(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ease-in-out",
                  state.kind === "creating" || state.kind === "uploading"
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

            <form onSubmit={onSubmit} className="px-6 py-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={classNames(
                  "rounded-xl border-2 border-dashed p-6 text-center transition-[background-color,border-color] duration-500 ease-in-out",
                  file
                    ? "border-[#2563EB]"
                    : isDark
                    ? "border-white/15"
                    : "border-slate-300",
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
                  disabled={state.kind === "creating" || state.kind === "uploading"}
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
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название видео"
                  className={classNames(
                    "mt-2 w-full rounded-lg border px-4 py-3 text-sm outline-none transition-[background-color,border-color,color,box-shadow] duration-500 ease-in-out",
                    isDark
                      ? "border-white/10 bg-[#0F1117] text-white placeholder:text-white/30 focus:border-[#2563EB]"
                      : "border-slate-200 bg-white text-[#111827] placeholder:text-slate-400 focus:border-[#2563EB]"
                  )}
                  disabled={state.kind === "creating" || state.kind === "uploading"}
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
                    {state.err.description && (
                      <div className="mt-1">{state.err.description}</div>
                    )}
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
                  state.kind === "creating" || state.kind === "uploading"
                    ? "cursor-not-allowed bg-[#93C5FD] text-white/80"
                    : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-lg"
                )}
                disabled={state.kind === "creating" || state.kind === "uploading"}
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
      )}
    </div>
  );
}