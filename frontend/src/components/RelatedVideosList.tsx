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
    <div className="space-y-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          to={`/videos/${video.id}`}
          className={classNames(
            "flex gap-4 rounded-2xl p-3 transition-all duration-300",
            isDark ? "hover:bg-white/5" : "hover:bg-slate-100"
          )}
        >
          <div className="w-52 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB] lg:w-56">
            <div className="aspect-video w-full">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="block h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={classNames(
                "line-clamp-2 text-[15px] font-bold leading-6",
                isDark ? "text-white" : "text-[#111827]"
              )}
            >
              {video.title}
            </div>

            <div
              className={classNames(
                "mt-3 text-sm",
                isDark ? "text-white/45" : "text-slate-500"
              )}
            >
              {video.owner_display_name ?? "Unknown creator"}
            </div>

            <div
              className={classNames(
                "mt-1.5 text-sm",
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