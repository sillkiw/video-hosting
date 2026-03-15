import { FiUploadCloud, FiX } from "react-icons/fi";
import type { QueueItem } from "../types/queue";
import { classNames } from "../utils/classNames";

type Props = {
  isDark: boolean;
  isOpen: boolean;
  activeCount: number;
  items: QueueItem[];
  onToggle: () => void;
  onRemove: (id: string) => void;
};

function prettyStatus(status: string) {
  switch (status) {
    case "created":
      return "Создано";
    case "uploading":
      return "Загрузка";
    case "uploaded":
      return "В очереди";
    case "processing":
      return "Обработка";
    case "ready":
      return "Готово";
    case "failed_upload":
      return "Ошибка загрузки";
    case "failed_processing":
      return "Ошибка обработки";
    default:
      return status;
  }
}

export function UploadQueuePopover({
  isDark,
  isOpen,
  activeCount,
  items,
  onToggle,
  onRemove,
}: Props) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={classNames(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
          isDark
            ? "border-white/10 bg-[#1A1D24] text-white hover:border-[#2563EB]"
            : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]"
        )}
        title="Очередь загрузок"
      >
        <FiUploadCloud />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-[#2563EB] px-1.5 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={classNames(
            "absolute right-0 mt-2 w-96 rounded-xl border shadow-xl",
            isDark
              ? "border-white/10 bg-[#14171F] text-white"
              : "border-slate-200 bg-white text-[#111827]"
          )}
        >
          <div className="border-b px-4 py-3 font-bold">Очередь задач</div>

          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div
                className={classNames(
                  "px-4 py-6 text-sm",
                  isDark ? "text-white/50" : "text-slate-500"
                )}
              >
                Пока задач нет.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={classNames(
                    "flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0",
                    isDark ? "border-white/10" : "border-slate-200"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{item.title}</div>
                    <div
                      className={classNames(
                        "mt-1 text-xs",
                        isDark ? "text-white/50" : "text-slate-500"
                      )}
                    >
                      ID: {item.id}
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#2563EB]">
                      {prettyStatus(item.status)}
                    </div>
                  </div>

                  <button
                    onClick={() => onRemove(item.id)}
                    className={classNames(
                      "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full",
                      isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                    )}
                  >
                    <FiX />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}