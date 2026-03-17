package dto

import "time"

type VideoListItem struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	CreatedAt        time.Time `json:"created_at"`
	ThumbnailURL     string    `json:"thumbnail_url,omitempty"`
	OwnerDisplayName string    `json:"owner_display_name"`
}

type VideosListResponse struct {
	Items []VideoListItem `json:"items"`
}
