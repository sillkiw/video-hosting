package dto

type StatusResponse struct {
	ID     string  `json:"id"`
	Status string  `json:"status"`
	Links  LinksSt `json:"links,omitempty"`
}

type LinksSt struct {
	DashManifest string `json:"dash_manifest,omitempty"`
}
