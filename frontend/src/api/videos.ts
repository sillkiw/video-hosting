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

export type ApiError = {
  code: string;
  message?: string;
  fields?: Record<string, string>;
};

async function parseApiError(res: Response): Promise<ApiError> {
  try {
    return (await res.json()) as ApiError;
  } catch {
    return { code: "unknown_error", message: `HTTP ${res.status}` };
  }
}

export async function createVideo(req: CreateRequest): Promise<CreateResponse> {
  const res = await fetch("/api/videos/create", {
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
  const res = await fetch(uploadUrl, {
    method,
    headers: headers ?? {},
    body: file,
  });

  if (!res.ok) throw await parseApiError(res);
}

export type VideoStatusResponse = {
  id: string;
  title: string;
  status: string;
};

export async function getVideo(id: string): Promise<VideoStatusResponse> {
  const res = await fetch(`/api/videos/${id}`);
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as VideoStatusResponse;
}

export type VideoListItem = {
  id: string;
  title: string;
  created_at: string;
};

export type VideosListResponse = {
  items: VideoListItem[];
};

export async function listVideos(): Promise<VideoListItem[]> {
  const res = await fetch("/api/videos");
  if (!res.ok) throw await parseApiError(res);

  const data = (await res.json()) as VideosListResponse;
  return data.items;
}