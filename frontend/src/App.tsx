import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { VideoPage } from "./pages/VideoPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

import { useUploadQueue } from "./hooks/useUploadQueue";
import { useVideoUpload } from "./hooks/useVideoUpload";
import { useAuth } from "./auth/useAuth";

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const queue = useUploadQueue();
  const upload = useVideoUpload((item) => {
    queue.addItem(item);
  });

  function openModal() {
    if (!auth.isAuthenticated) {
      navigate("/login");
      return;
    }

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

       <Route
        path="/login"
        element={<LoginPage isDark={isDark} setIsDark={setIsDark} />}
      />

      <Route
        path="/register"
        element={<RegisterPage isDark={isDark} setIsDark={setIsDark} />}
      />
    </Routes>
  );
}