import { Link } from "react-router-dom";
import type { VideoListItem } from "../api/videos";
import { classNames } from "../utils/classNames";

type Props = {
  videos: VideoListItem[];
  isDark: boolean;
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function RelatedVideosList({ videos, isDark }: Props) {
  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <Link
          key={video.id}
          to={`/videos/${video.id}`}
          className={classNames(
            "flex gap-3 rounded-xl p-2 transition-all duration-300",
            isDark
              ? "hover:bg-white/5"
              : "hover:bg-slate-100"
          )}
        >
          <div className="w-44 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB]">
            <div className="aspect-video w-full" />
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={classNames(
                "line-clamp-2 text-sm font-bold leading-5",
                isDark ? "text-white" : "text-[#111827]"
              )}
            >
              {video.title}
            </div>

            <div
              className={classNames(
                "mt-2 text-xs",
                isDark ? "text-white/45" : "text-slate-500"
              )}
            >
              Unknown creator
            </div>

            <div
              className={classNames(
                "mt-1 text-xs",
                isDark ? "text-white/35" : "text-slate-400"
              )}
            >
              {formatCreatedAt(video.created_at)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}