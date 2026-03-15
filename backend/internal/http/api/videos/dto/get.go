package dto

import "time"

type GetResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	ManifestURL string    `json:"manifest_url,omitempty"`
}
