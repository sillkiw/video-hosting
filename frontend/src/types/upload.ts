import type { UiError } from "../api/errors";

export type UploadState =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "uploading"; id: string }
  | { kind: "done"; id: string }
  | { kind: "error"; err: UiError };