package media

import (
	"context"
	"log/slog"
	"os/exec"

	"github.com/sillkiw/video-hosting/internal/config"
)

type FFmpegProcessor struct {
	cfg *config.Config
}

func New(logger *slog.Logger, cfg *config.Config) *FFmpegProcessor {
	p := &FFmpegProcessor{
		cfg: cfg,
	}
	return p
}

// convertVideo reads conversion tasks from p.taskCh, executes the appropriate
// FFmpeg (or MP4Box) command for each, and decrements the queue counter when done.
func (p *FFmpegProcessor) Process(ctx context.Context, id string) error {
	// build and run ffmpeg or MP4Box based on t’s flags
	var cmd *exec.Cmd
	if task.createMPD {
		cmd = buildMPDCommand(task)
	} else {
		cmd = p.buildFFmpegCmd(task)
	}

	if err := cmd.Run(); err != nil {
		if task.processAudio {
			p.logger.Info("audio conversion failed, creating noaudio flag",
				slog.String("video", task.videoPath),
				slog.String("err", err.Error()),
			)
			p.create_noaudio_file(task)
		} else {
			p.logger.Error("convert: conversion failed",
				slog.String("video", task.videoPath),
				slog.String("err", err.Error()),
			)
		}
	} else {
		p.logger.Info("convert: conversion succeeded",
			slog.String("output", task.outputPath),
		)
	}
}
