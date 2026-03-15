package dto

import "time"

type ListItem struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
	// Thumbnail   string `json:"thumbnail"`
	// DurationSec int64  `json:"duration_sec"`
}

type ListResponse struct {
	Items []ListItem `json:"items"`
}
