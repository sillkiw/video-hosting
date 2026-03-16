package storage

import "errors"

// videos
var (
	ErrVideoIDNotFound = errors.New("video id is not found")
	ErrConflict        = errors.New("status conflict")
)

// users
var (
	ErrEmailNotFound  = errors.New("email not found")
	ErrUserIDNotFound = errors.New("user id is not found")
)

// videos_jobs
var (
	ErrNoJobs = errors.New("no jobs")
)
