import { FiPlayCircle, FiUser } from "react-icons/fi";
import type { VideoCardItem } from "../types/video";
import { classNames } from "../utils/classNames";
import { formatViews } from "../utils/formatViews";

type Props = {
  video: VideoCardItem;
  isDark: boolean;
};

export function VideoCard({ video, isDark }: Props) {
  return (
    <article
      className={classNames(
        "group overflow-hidden rounded-lg ring-1 transition-[background-color,transform,box-shadow,border-color] duration-500 ease-in-out",
        isDark
          ? "bg-[#14171F] ring-white/6 hover:-translate-y-0.5 hover:ring-[#2563EB]/60"
          : "bg-white ring-black/6 shadow-sm hover:-translate-y-0.5 hover:ring-[#2563EB]/60 hover:shadow-lg"
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB]">
        <div className="absolute inset-0 bg-black/20 transition duration-300 group-hover:bg-black/10" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition duration-300 group-hover:scale-105 group-hover:bg-[#2563EB]">
            <FiPlayCircle className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {video.duration}
        </div>
      </div>

      <div className="p-3">
        <div
          className={classNames(
            "text-sm font-bold leading-5 transition-colors duration-500",
            isDark ? "text-white" : "text-[#111827]"
          )}
        >
          {video.title}
        </div>

        <div
          className={classNames(
            "mt-2 flex items-center gap-2 text-xs transition-colors duration-500",
            isDark ? "text-white/55" : "text-slate-500"
          )}
        >
          <span
            className={classNames(
              "inline-flex h-7 w-7 items-center justify-center rounded-full transition-[background-color,color] duration-500",
              isDark ? "bg-[#1F2430]" : "bg-slate-100"
            )}
          >
            <FiUser className={isDark ? "text-white/80" : "text-slate-700"} />
          </span>
          <span>{video.author}</span>
        </div>

        <div
          className={classNames(
            "mt-2 text-xs transition-colors duration-500",
            isDark ? "text-white/40" : "text-slate-400"
          )}
        >
          {formatViews(video.views)}
        </div>
      </div>
    </article>
  );
}