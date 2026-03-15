import type { VideoListItem } from "../api/videos";
import { classNames } from "../utils/classNames";
import { VideoCard } from "./VideoCard";

type Props = {
  videos: VideoListItem[];
  isDark: boolean;
};

export function VideoGrid({ videos, isDark }: Props) {
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          
          <p
            className={classNames(
              "mt-1 text-sm transition-colors duration-500",
              isDark ? "text-white/45" : "text-slate-500"
            )}
          >
           
          </p>
        </div>

        <div className="hidden gap-2 md:flex">
          {["All", "New"].map((x) => (
            <button
              key={x}
              className={classNames(
                "rounded-md border px-3 py-1.5 text-sm font-semibold transition-all duration-500 ease-in-out",
                x === "All"
                  ? "border-[#2563EB] bg-[#2563EB] text-white"
                  : isDark
                  ? "border-white/10 bg-[#151821] text-white/75 hover:border-[#2563EB] hover:text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} isDark={isDark} />
        ))}
      </div>
    </>
  );
}