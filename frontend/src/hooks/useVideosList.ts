import { useCallback, useEffect, useState } from "react";
import { humanizeError, isApiError } from "../api/errors";
import { listVideos } from "../api/videos";
import type { UiError } from "../api/errors";
import type { VideoListItem } from "../api/videos";

export function useVideosList() {
  const [items, setItems] = useState<VideoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UiError | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const videos = await listVideos();
      setItems(videos);
    } catch (err: unknown) {
      const uiErr = isApiError(err)
        ? humanizeError(err)
        : {
            title: "Ошибка загрузки",
            description: "Не удалось получить список видео.",
          };

      setError(uiErr);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    loading,
    error,
    reload: load,
  };
}