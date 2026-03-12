import { useMemo, useState } from "react";
import { createVideo, uploadVideo } from "./api";
import type { ApiError } from "./api";
export default function App() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const inferredContentType = useMemo(() => {
    if (!file) return "video/mp4";
    return file.type || "video/mp4";
  }, [file]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultId(null);

    if (!file) {
      setError({ code: "no_file", message: "Choose a file first" });
      return;
    }
    if (!title.trim()) {
      setError({ code: "no_title", message: "Title is required" });
      return;
    }

    setLoading(true);
    try {
      // 1) create
      const created = await createVideo({
        title: title.trim(),
        content_type: inferredContentType,
        size: file.size,
      });

      // 2) upload
      await uploadVideo(
        created.upload.url,
        created.upload.method,
        file,
        created.upload.headers
      );

      setResultId(created.id);
    } catch (e: any) {
      // e is ApiError (we throw it from api.ts)
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Video Hosting MVP</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="My video"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>MP4 file</span>
          <input
            type="file"
            accept="video/mp4"
            disabled={loading}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button disabled={loading} style={{ padding: 12 }}>
          {loading ? "Uploading..." : "Create & Upload"}
        </button>
      </form>

      {resultId && (
        <div style={{ marginTop: 16 }}>
          <b>Uploaded.</b> Video ID: <code>{resultId}</code>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <div>
            <b>Error:</b> <code>{error.code}</code>
          </div>
          {error.message && <div>{error.message}</div>}
          {error.fields && (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(error.fields, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}