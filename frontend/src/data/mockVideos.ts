import type { VideoCardItem } from "../types/video";

export const mockVideos: VideoCardItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  title: `Demo video ${i + 1}`,
  author: "Creator",
  views: 1200 * (i + 1),
  duration: ["12:43", "08:19", "21:04", "04:58"][i % 4],
}));