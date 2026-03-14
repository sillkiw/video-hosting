package media

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"github.com/sillkiw/video-hosting/internal/config"
)

type Store interface {
	GetRawPath(videoID string) string
	GetDashPath(videoID string) string
}

type FFmpegProcessor struct {
	cfg   *config.Config
	store Store
}

func New(cfg *config.Config, store Store) *FFmpegProcessor {
	return &FFmpegProcessor{
		cfg:   cfg,
		store: store,
	}
}

func (p *FFmpegProcessor) Process(ctx context.Context, id string) error {
	outDir := p.store.GetDashPath(id)
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return fmt.Errorf("process video %s: create output dir: %w", id, err)
	}

	tasks := p.buildConversionTasks(
		p.store.GetRawPath(id),
		id,
		outDir,
	)

	for _, task := range tasks {
		var cmd *exec.Cmd
		if task.createMPD {
			cmd = p.buildMPDCommand(ctx, task)
		} else {
			cmd = p.buildFFmpegCmd(ctx, task)
		}

		out, err := cmd.CombinedOutput()
		if err != nil {
			if task.processAudio {
				_ = p.create_noaudio_file(task)
			}
			return fmt.Errorf(
				"process video %s: command %q failed: %w: %s",
				id,
				cmd.String(),
				err,
				string(out),
			)
		}
	}

	return nil
}
