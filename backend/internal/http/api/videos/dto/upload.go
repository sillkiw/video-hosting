package dto

type UploadRequest struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	ContentType string `json:"content_type"`
	Size        int64  `json:"size"`
}
