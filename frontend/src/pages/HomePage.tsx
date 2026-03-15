import { Header } from "../components/Header";
import { UploadModal } from "../components/UploadModal";
import { UploadQueuePopover } from "../components/UploadQueuePopover";
import { VideoGrid } from "../components/VideoGrid";
import { useVideosList } from "../hooks/useVideosList";
import type { AppPageProps } from "../types/pageProps";
import { classNames } from "../utils/classNames";

export function HomePage({
  isDark,
  setIsDark,
  isModalOpen,
  openModal,
  closeModal,
  queue,
  upload,
}: AppPageProps) {
  const videosList = useVideosList();

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
        {videosList.loading && (
          <div className={isDark ? "text-white/60" : "text-slate-500"}>
            Загружаю список видео…
          </div>
        )}

        {!videosList.loading && videosList.error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <div className="font-semibold">{videosList.error.title}</div>
            {videosList.error.description && (
              <div className="mt-1">{videosList.error.description}</div>
            )}
          </div>
        )}

        {!videosList.loading && !videosList.error && videosList.items.length === 0 && (
          <div className={isDark ? "text-white/60" : "text-slate-500"}>
            Пока готовых видео нет.
          </div>
        )}

        {!videosList.loading && !videosList.error && videosList.items.length > 0 && (
          <VideoGrid videos={videosList.items} isDark={isDark} />
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