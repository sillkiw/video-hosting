import { useEffect, useMemo, useState } from "react";
import { getVideoDetail } from "../api/videos";
import type { QueueItem } from "../types/queue";

const FINAL_STATUSES = new Set(["ready", "failed_upload", "failed_processing"]);
const STORAGE_KEY = "upload_queue_v1";

function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is QueueItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.status === "string"
    );
  } catch {
    return [];
  }
}

export function useUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>(() => loadQueue());
  const [isOpen, setIsOpen] = useState(false);

  function addItem(item: QueueItem) {
    setItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [item, ...prev];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function toggleOpen() {
    setIsOpen((v) => !v);
  }

  useEffect(() => {
    const persisted = items.filter((x) => !FINAL_STATUSES.has(x.status));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [items]);

  useEffect(() => {
    const active = items.filter((x) => !FINAL_STATUSES.has(x.status));
    if (active.length === 0) return;

    const timer = window.setInterval(async () => {
      const updates = await Promise.allSettled(
        active.map((item) => getVideoDetail(item.id))
      );

      setItems((prev) =>
        prev.map((item) => {
          const idx = active.findIndex((x) => x.id === item.id);
          if (idx === -1) return item;

          const result = updates[idx];
          if (result.status !== "fulfilled") return item;

          return {
            ...item,
            title: result.value.title ?? item.title,
            status: result.value.status,
          };
        })
      );
    }, 3000);

    return () => window.clearInterval(timer);
  }, [items]);

  const activeCount = useMemo(
    () => items.filter((x) => !FINAL_STATUSES.has(x.status)).length,
    [items]
  );

  return {
    items,
    isOpen,
    activeCount,
    addItem,
    removeItem,
    toggleOpen,
    setIsOpen,
  };
}