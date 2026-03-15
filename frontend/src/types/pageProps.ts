import type { Dispatch, SetStateAction } from "react";
import type { useUploadQueue } from "../hooks/useUploadQueue";
import type { useVideoUpload } from "../hooks/useVideoUpload";

export type AppPageProps = {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  queue: ReturnType<typeof useUploadQueue>;
  upload: ReturnType<typeof useVideoUpload>;
};