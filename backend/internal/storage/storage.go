package storage

import "errors"

var (
	ErrIdNotFound = errors.New("id is not found")
	ErrConflict   = errors.New("status conflict")
	ErrNoJobs     = errors.New("no jobs")
)
