package dto

import "time"

type VideoResponse struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	ManifestURL      string    `json:"manifest_url,omitempty"`
	ThumbnailURL     string    `json:"thumbnail_url,omitempty"`
	OwnerDisplayName string    `json:"owner_display_name"`
}
