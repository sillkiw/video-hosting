import { useMemo, useState } from "react";
import { humanizeError, isApiError } from "../api/errors";
import { createVideo, uploadVideo } from "../api/videos";
import type { UploadState } from "../types/upload";

type OnUploaded = (item: { id: string; title: string; status: string }) => void;

export function useVideoUpload(onUploaded?: OnUploaded) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ kind: "idle" });

  const inferredContentType = useMemo(() => {
    if (!file) return "video/mp4";
    return file.type || "video/mp4";
  }, [file]);

  function reset() {
    setTitle("");
    setFile(null);
    setState({ kind: "idle" });
  }

  function onFileChosen(f: File | null) {
    setFile(f);

    if (f && !title.trim()) {
      const base = f.name.replace(/\.[^/.]+$/, "");
      setTitle(base);
    }
  }

  async function submit() {
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

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
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

      const created = await createVideo({
        title: trimmedTitle,
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

      onUploaded?.({
        id: created.id,
        title: trimmedTitle,
        status: "uploaded",
      });
    } catch (err: unknown) {
      const uiErr = isApiError(err)
        ? humanizeError(err)
        : {
            title: "Ошибка сети",
            description: "Не удалось выполнить запрос.",
          };

      setState({ kind: "error", err: uiErr });
    }
  }

  return {
    title,
    setTitle,
    file,
    state,
    inferredContentType,
    reset,
    onFileChosen,
    submit,
  };
}