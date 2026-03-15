import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { RelatedVideosList } from "../components/RelatedVideosList";
import { UploadModal } from "../components/UploadModal";
import { UploadQueuePopover } from "../components/UploadQueuePopover";
import { VideoPlayer } from "../components/VideoPlayer";
import { useVideosList } from "../hooks/useVideosList";
import type { AppPageProps } from "../types/pageProps";
import { classNames } from "../utils/classNames";

type VideoDetail = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  manifest_url?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusText(status: string) {
  switch (status) {
    case "processing":
      return "Видео ещё обрабатывается.";
    case "uploaded":
      return "Видео ожидает обработки.";
    case "uploading":
      return "Видео ещё загружается.";
    case "failed_upload":
      return "Не удалось загрузить видео.";
    case "failed_processing":
      return "Не удалось подготовить видео.";
    default:
      return "Видео пока недоступно.";
  }
}

export function VideoPage({
  isDark,
  setIsDark,
  isModalOpen,
  openModal,
  closeModal,
  queue,
  upload,
}: AppPageProps) {
  const { id } = useParams<{ id: string }>();

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videosList = useVideosList();

  useEffect(() => {
    if (!id) return;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/videos/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as VideoDetail;
        setVideo(data);
      } catch {
        setError("Не удалось загрузить видео.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [id]);

  const relatedVideos = videosList.items
    .filter((item) => item.id !== id)
    .slice(0, 8);

  return (
    <div
      className={classNames(
        "min-h-screen transition-[background-color,color] duration-500 ease-in-out",
        isDark ? "bg-[#0B0B0F] text-white" : "bg-[#F8FAFC] text-[#111827]"
      )}
    >
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((v) => !v)}
        onOpenUpload={openModal}
        queueButton={
          <UploadQueuePopover
            isDark={isDark}
            isOpen={queue.isOpen}
            activeCount={queue.activeCount}
            items={queue.items}
            onToggle={queue.toggleOpen}
            onRemove={queue.removeItem}
          />
        }
      />

      <section
        className={classNames(
          "border-b transition-[background-color,border-color] duration-500 ease-in-out",
          isDark
            ? "border-white/5 bg-gradient-to-b from-[#111318] to-[#0B0B0F]"
            : "border-black/5 bg-gradient-to-b from-[#EFF6FF] to-[#F8FAFC]"
        )}
      />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading && (
          <div className={isDark ? "text-white/60" : "text-slate-500"}>
            Загружаю видео…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && video && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="mb-4">
                <Link
                  to="/"
                  className={classNames(
                    "text-sm font-semibold transition-colors",
                    isDark ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-[#111827]"
                  )}
                >
                  ← Назад к списку
                </Link>
              </div>

              {video.status === "ready" && video.manifest_url ? (
                <VideoPlayer manifestUrl={video.manifest_url} isDark={isDark} />
              ) : (
                <div
                  className={classNames(
                    "flex aspect-video items-center justify-center rounded-2xl border text-sm",
                    isDark
                      ? "border-white/10 bg-[#111318] text-white/60"
                      : "border-slate-200 bg-white text-slate-500"
                  )}
                >
                  {getStatusText(video.status)}
                </div>
              )}

              <div className="mt-5">
                <h1
                  className={classNames(
                    "text-2xl font-black tracking-tight",
                    isDark ? "text-white" : "text-[#111827]"
                  )}
                >
                  {video.title}
                </h1>

                <div
                  className={classNames(
                    "mt-3 flex flex-wrap items-center gap-4 text-sm",
                    isDark ? "text-white/45" : "text-slate-500"
                  )}
                >
                  <span>Создано: {formatDate(video.created_at)}</span>
                  <span>Обновлено: {formatDate(video.updated_at)}</span>
                  <span>ID: {video.id}</span>
                </div>

                {video.manifest_url && (
                  <div
                    className={classNames(
                      "mt-4 break-all text-sm",
                      isDark ? "text-white/35" : "text-slate-400"
                    )}
                  >
                    Manifest URL: {video.manifest_url}
                  </div>
                )}
              </div>
            </div>

            <aside>
              <div className="mb-4">
                <h2
                  className={classNames(
                    "text-lg font-bold tracking-tight",
                    isDark ? "text-white" : "text-[#111827]"
                  )}
                >
                  Другие видео
                </h2>
                <p
                  className={classNames(
                    "mt-1 text-sm",
                    isDark ? "text-white/45" : "text-slate-500"
                  )}
                >
                  Готовые видео из текущего списка.
                </p>
              </div>

              {videosList.loading && (
                <div className={isDark ? "text-white/60" : "text-slate-500"}>
                  Загружаю список…
                </div>
              )}

              {!videosList.loading && relatedVideos.length > 0 && (
                <RelatedVideosList videos={relatedVideos} isDark={isDark} />
              )}

              {!videosList.loading && relatedVideos.length === 0 && (
                <div
                  className={classNames(
                    "text-sm",
                    isDark ? "text-white/50" : "text-slate-500"
                  )}
                >
                  Пока нет других видео.
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      <UploadModal
        isOpen={isModalOpen}
        isDark={isDark}
        title={upload.title}
        file={upload.file}
        state={upload.state}
        onClose={closeModal}
        onTitleChange={upload.setTitle}
        onFileChosen={upload.onFileChosen}
        onSubmit={upload.submit}
      />
    </div>
  );
}