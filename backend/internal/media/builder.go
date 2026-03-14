package media

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func (p *FFmpegProcessor) buildFFmpegCmd(ctx context.Context, t task) *exec.Cmd {
	args := []string{"-i", t.videoPath, "-map_metadata", t.metadataFlag, "-threads", p.cfg.Video.FFmpeg.Threads}
	switch {
	case t.withAudio:
		args = append(args,
			"-c:v", "libvpx-vp9",
			"-b:v", t.bitrate,
			"-vf", "scale="+t.resolution,
			t.outputPath,
		)
	case t.createThumb:
		args = append(args,
			"-ss", "00:00:01",
			"-vframes", "1",
			"-s", "640x480",
			"-f", "image2",
			t.outputPath,
		)
	case t.processAudio:
		args = append(args,
			"-c:a", "aac",
			"-b:a", t.audioQuality,
			"-vn",
			"-f", "mp4",
			t.outputPath,
		)
	default:
		args = append(args,
			"-c:v", "libx264",
			"-level", "4.1",
			"-b:v", t.bitrate,
			"-g", "60",
			"-vf", "scale="+t.resolution,
			"-preset", p.cfg.Video.FFmpeg.Preset,
			"-keyint_min", "60",
			"-sc_threshold", "0",
			"-an",
			"-f", "mp4",
			t.outputPath,
		)
	}

	return exec.CommandContext(ctx, "/usr/bin/ffmpeg", args...)
}

func (p *FFmpegProcessor) buildMPDCommand(ctx context.Context, t task) *exec.Cmd {
	dir := filepath.Dir(t.outputPath)
	base := t.baseName

	args := []string{
		"-dash", "2000",
		"-frag", "2000",
		"-rap",
		"-profile", "onDemand",
		"-out", t.outputPath,
	}

	for _, quality := range []string{"high", "med", "low"} {
		seg := fmt.Sprintf("%s/%s_%s.mp4#video", dir, quality, base)
		args = append(args, seg)
	}

	flagFile := filepath.Join(dir, base+"noaudio.txt")
	if _, err := os.Stat(flagFile); os.IsNotExist(err) {
		audioSeg := fmt.Sprintf("%s/audio_%s.mp4#audio", dir, base)
		args = append(args, audioSeg)
	}

	cmdLine := "MP4Box " + strings.Join(args, " ")
	return exec.CommandContext(ctx, "/bin/sh", "-c", cmdLine)
}
