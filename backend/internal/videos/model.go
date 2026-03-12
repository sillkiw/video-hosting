package videos

import "time"

const (
	StatusCreated          string = "created"
	StatusUploaded         string = "uploaded"
	StatusUploading        string = "uploading"
	StatusUploadFailed     string = "failed_upload"
	StatusReady            string = "ready"
	StatusProcessing       string = "processing"
	StatusProcessingFailed string = "failed_processing"
)

type Video struct {
	ID          string
	Title       string
	Size        int64
	ContentType string
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
