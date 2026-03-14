package media

import (
	"fmt"
	"os"
	"path/filepath"
)

// buildConversionTasks returns a slice of conversion tasks for the given video.
// It creates tasks for multiple profiles: WebM+audio, thumbnails, MP4 at various
// qualities, audio-only, and the final DASH manifest.
func (p *FFmpegProcessor) buildConversionTasks(filePath, baseName, outDir string) []task {
	// helper for quickly assembling a task
	mk := func(filename string, withAudio, processAudio, createThumb, createMPD bool, bitrate, resolution string) task {
		return task{
			videoPath:    filePath,
			outputPath:   filepath.Join(outDir, filename),
			bitrate:      bitrate,
			resolution:   resolution,
			metadataFlag: "-2",
			withAudio:    withAudio,
			processAudio: processAudio,
			audioQuality: "64k",
			createThumb:  createThumb,
			createMPD:    createMPD,
			baseName:     baseName,
		}
	}

	return []task{
		// WebM with audio (low resolution)
		mk(
			fmt.Sprintf("low_%s_audio.webm", baseName),
			true,  /* withAudio */
			false, /* processAudio */
			false, /* createThumb */
			false, /* createMPD */
			p.cfg.Video.Bitrates.Low,
			p.cfg.Video.Resolutions.Low,
		),
		// Thumbnail extraction
		mk(
			fmt.Sprintf("thumb_%s.jpeg", baseName),
			false, /* withAudio */
			false, /* processAudio */
			true,  /* createThumb */
			false, /* createMPD */
			"",    /* bitrate unused */
			"",    /* resolution unused */
		),
		// MP4 low quality (video only)
		mk(
			fmt.Sprintf("low_%s.mp4", baseName),
			false,
			false,
			false,
			false,
			p.cfg.Video.Bitrates.Low,
			p.cfg.Video.Resolutions.Low,
		),
		// MP4 medium quality (video only)
		mk(
			fmt.Sprintf("med_%s.mp4", baseName),
			false,
			false,
			false,
			false,
			p.cfg.Video.Bitrates.Med,
			p.cfg.Video.Resolutions.Med,
		),
		// MP4 high quality (video only)
		mk(
			fmt.Sprintf("high_%s.mp4", baseName),
			false,
			false,
			false,
			false,
			p.cfg.Video.Bitrates.High,
			p.cfg.Video.Resolutions.High,
		),
		// Audio-only MP4
		mk(
			fmt.Sprintf("audio_%s.mp4", baseName),
			false,
			true,
			false,
			false,
			p.cfg.Video.Bitrates.High,
			"", /* resolution unused */
		),
		// Final DASH manifest
		mk(
			"output.mpd",
			false,
			false,
			false,
			true,
			"", /* bitrate unused */
			"", /* resolution unused */
		),
	}
}

func (p *FFmpegProcessor) create_noaudio_file(task task) error {
	flagPath := filepath.Join(filepath.Dir(task.outputPath), task.baseName+"noaudio.txt")
	if ferr := os.WriteFile(flagPath, nil, 0o644); ferr != nil {
		return ferr
	}
	return nil
}
