import { parseApiError } from "./errors";
import { apiFetch } from "./http";

export type CreateRequest = {
  title: string;
  content_type: string;
  size: number;
};

export type CreateResponse = {
  id: string;
  status: string;
  upload: {
    method: "PUT" | "POST";
    url: string;
    headers?: Record<string, string>;
    max_bytes?: number;
  };
  links?: { self?: string };
};

export type VideoListItem = {
  id: string;
  title: string;
  created_at: string;
  thumbnail_url?: string;
  owner_display_name?: string;
};

export type VideosListResponse = {
  items: VideoListItem[];
};

export type VideoDetailResponse = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  manifest_url?: string;
  thumbnail_url?: string;
  owner_display_name?: string;
};

export async function createVideo(req: CreateRequest): Promise<CreateResponse> {
  const res = await apiFetch("/api/videos/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as CreateResponse;
}

export async function uploadVideo(
  uploadUrl: string,
  method: "PUT" | "POST",
  file: File,
  headers?: Record<string, string>
): Promise<void> {
  const res = await apiFetch(uploadUrl, {
    method,
    headers: headers ?? {},
    body: file,
  });

  if (!res.ok) throw await parseApiError(res);
}

export async function getVideoDetail(id: string): Promise<VideoDetailResponse> {
  const res = await apiFetch(`/api/videos/${id}`);
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as VideoDetailResponse;
}

export async function listVideos(): Promise<VideoListItem[]> {
  const res = await apiFetch("/api/videos");
  if (!res.ok) throw await parseApiError(res);

  const data = (await res.json()) as Partial<VideosListResponse>;
  return Array.isArray(data.items) ? data.items : [];
}