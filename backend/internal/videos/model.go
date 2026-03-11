package videos

import "time"

type Status string

const (
	StatusCreated          Status = "created"
	StatusUploaded         Status = "uploaded"
	StatusUploading        Status = "uploading"
	StatusUploadFailed     Status = "failed_upload"
	StatusReady            Status = "ready"
	StatusProcessing       Status = "processing"
	StatusProcessingFailed Status = "failed_processing"
)

type Video struct {
	ID          string
	Title       string
	Size        int64
	ContentType string
	Status      Status
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
