import type { VideoListItem } from "../api/videos";
import { VideoCard } from "./VideoCard";

type Props = {
  videos: VideoListItem[];
  isDark: boolean;
};

export function VideoGrid({ videos, isDark }: Props) {
  return (
   <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} isDark={isDark} />
      ))}
    </div>
  );
}