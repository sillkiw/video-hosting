package storage

import "errors"

var (
	ErrTitleExists = errors.New("title exists")
	ErrIdNotFound  = errors.New("id is not found")
	ErrConflict    = errors.New("status conflict")
)
