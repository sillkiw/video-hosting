import { useState } from "react";
import { Header } from "./components/Header";
import { UploadModal } from "./components/UploadModal";
import { VideoGrid } from "./components/VideoGrid";
import { mockVideos } from "./data/mockVideos";
import { useVideoUpload } from "./hooks/useVideoUpload";
import { classNames } from "./utils/classNames";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const upload = useVideoUpload();

  function openModal() {
    upload.reset();
    setIsModalOpen(true);
  }

  function closeModal() {
    if (upload.state.kind === "creating" || upload.state.kind === "uploading") return;
    setIsModalOpen(false);
  }

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
        <VideoGrid videos={mockVideos} isDark={isDark} />
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