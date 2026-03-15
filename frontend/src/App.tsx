import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { VideoPage } from "./pages/VideoPage";
import { useUploadQueue } from "./hooks/useUploadQueue";
import { useVideoUpload } from "./hooks/useVideoUpload";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const queue = useUploadQueue();
  const upload = useVideoUpload((item) => {
    queue.addItem(item);
  });

  function openModal() {
    upload.reset();
    setIsModalOpen(true);
  }

  function closeModal() {
    if (upload.state.kind === "creating" || upload.state.kind === "uploading") {
      return;
    }
    setIsModalOpen(false);
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            isDark={isDark}
            setIsDark={setIsDark}
            isModalOpen={isModalOpen}
            openModal={openModal}
            closeModal={closeModal}
            queue={queue}
            upload={upload}
          />
        }
      />
      <Route
        path="/videos/:id"
        element={
          <VideoPage
            isDark={isDark}
            setIsDark={setIsDark}
            isModalOpen={isModalOpen}
            openModal={openModal}
            closeModal={closeModal}
            queue={queue}
            upload={upload}
          />
        }
      />
    </Routes>
  );
}