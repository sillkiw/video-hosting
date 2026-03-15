import { useEffect, useMemo, useRef, useState } from "react";
import * as dashjs from "dashjs";
import {
  FiMaximize,
  FiMinimize,
  FiPause,
  FiPlay,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import { classNames } from "../utils/classNames";

type Props = {
  manifestUrl: string;
  isDark: boolean;
};

type DashRepresentation = {
  id?: number | string;
  absoluteIndex?: number;
  bandwidth?: number;
  width?: number;
  height?: number;
};

type QualityOption = {
  index: number;
  label: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${minutes}:${ss}`;
}

function qualityLabel(rep: DashRepresentation) {
  if (rep.height) return `${rep.height}p`;
  if (rep.width && rep.bandwidth) return `${rep.width}px • ${Math.round(rep.bandwidth / 1000)} kbps`;
  if (rep.bandwidth) return `${Math.round(rep.bandwidth / 1000)} kbps`;
  return "Quality";
}

export function VideoPlayer({ manifestUrl, isDark }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);

  const [qualities, setQualities] = useState<QualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");

  const progressStyle = useMemo(() => ({ width: `${progress}%` }), [progress]);

  function clearHideTimer() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function scheduleHideControls() {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2200);
  }

  function revealControls() {
    setShowControls(true);
    scheduleHideControls();
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !manifestUrl) return;

    const player: any = dashjs.MediaPlayer().create();
    playerRef.current = player;

    player.initialize(video, manifestUrl, false);

    const updateQualities = () => {
      try {
        const reps = (player.getRepresentationsByType?.("video") || []) as DashRepresentation[];
        const mapped: QualityOption[] = reps.map((rep, index) => ({
          index,
          label: qualityLabel(rep),
        }));

        setQualities(mapped);

        const auto = player.getSettings?.().streaming?.abr?.autoSwitchBitrate?.video;
        if (auto) {
          setSelectedQuality("auto");
        } else {
          const currentRep = player.getCurrentRepresentationForType?.("video");
          if (!currentRep) return;

          const currentId = currentRep.id;
          const currentIndex = reps.findIndex((rep) => rep.id === currentId);
          if (currentIndex >= 0) {
            setSelectedQuality(String(currentIndex));
          }
        }
      } catch (err) {
        console.error("quality update error", err);
      }
    };

    player.on?.("streamInitialized", () => {
      updateQualities();
    });

    player.on?.("qualityChangeRendered", () => {
      updateQualities();
    });

    player.on?.("error", (e: unknown) => {
      console.error("dash error", e);
    });

    return () => {
      clearHideTimer();
      player.destroy?.();
      playerRef.current = null;
    };
  }, [manifestUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsReady(true);
    };

    const onTimeUpdate = () => {
      const current = video.currentTime || 0;
      const dur = video.duration || 0;

      setCurrentTime(current);
      setDuration(dur);
      setProgress(dur > 0 ? (current / dur) * 100 : 0);
    };

    const onPlay = () => {
      setIsPlaying(true);
      scheduleHideControls();
    };

    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
      clearHideTimer();
    };

    const onVolumeChange = () => {
      setIsMuted(video.muted || video.volume === 0);
      setVolume(video.volume);
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onCanPlay = () => setIsBuffering(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [isPlaying]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch (err) {
        console.error("play failed", err);
      }
    } else {
      video.pause();
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
    revealControls();
  }

  function onVolumeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;

    const next = Number(e.target.value);
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
    setIsMuted(video.muted);
    revealControls();
  }

  async function toggleFullscreen() {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement) {
      await wrapper.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }

    revealControls();
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video || !duration) return;

    const next = Number(e.target.value);
    const nextTime = (next / 100) * duration;

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    setProgress(next);
    revealControls();
  }

  function onQualityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const player = playerRef.current;
    if (!player) return;

    const value = e.target.value;
    setSelectedQuality(value);

    if (value === "auto") {
      player.updateSettings?.({
        streaming: {
          abr: {
            autoSwitchBitrate: {
              video: true,
            },
          },
        },
      });
      revealControls();
      return;
    }

    player.updateSettings?.({
      streaming: {
        abr: {
          autoSwitchBitrate: {
            video: false,
          },
        },
      },
    });

    player.setRepresentationForTypeByIndex?.("video", Number(value), true);
    revealControls();
  }

  return (
    <div
      ref={wrapperRef}
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      onDoubleClick={toggleFullscreen}
      className={classNames(
        "group relative overflow-hidden rounded-2xl border shadow-[0_25px_80px_-20px_rgba(0,0,0,0.45)]",
        isDark
          ? "border-white/10 bg-black"
          : "border-slate-200 bg-white"
      )}
    >
      <video
        ref={videoRef}
        className={classNames(
          "aspect-video w-full",
          isDark ? "bg-black" : "bg-slate-200"
        )}
        playsInline
        preload="metadata"
      />

      {!isPlaying && (
        <div
          className={classNames(
            "pointer-events-none absolute inset-0",
            isDark ? "bg-black/20" : "bg-white/10"
          )}
        />
      )}

      {isBuffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={classNames(
              "flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-sm",
              isDark ? "bg-black/50" : "bg-white/70"
            )}
          >
            <div
              className={classNames(
                "h-6 w-6 animate-spin rounded-full border-2",
                isDark
                  ? "border-white/30 border-t-white"
                  : "border-slate-300 border-t-slate-700"
              )}
            />
          </div>
        </div>
      )}

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className={classNames(
            "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105",
            isDark
              ? "bg-black/45 text-white hover:bg-[#2563EB]"
              : "bg-white/80 text-[#111827] hover:bg-[#2563EB] hover:text-white"
          )}
          aria-label="Play"
        >
          <FiPlay className="ml-1 h-8 w-8" />
        </button>
      )}

      {!isReady && (
        <div className="absolute inset-x-0 top-0 flex justify-center p-4">
          <div
            className={classNames(
              "rounded-full px-3 py-1 text-xs font-medium backdrop-blur",
              isDark
                ? "bg-black/45 text-white/80"
                : "bg-white/80 text-slate-700"
            )}
          >
            Подготавливаю поток…
          </div>
        </div>
      )}

      <div
        className={classNames(
          "absolute inset-x-0 bottom-0 px-4 pb-4 pt-14 transition-opacity duration-300",
          isDark
            ? "bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            : "bg-gradient-to-t from-white/95 via-white/40 to-transparent",
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="relative mb-4">
          <div
            className={classNames(
              "h-1.5 w-full overflow-hidden rounded-full",
              isDark ? "bg-white/20" : "bg-slate-300"
            )}
          >
            <div
              className="h-full rounded-full bg-[#2563EB] transition-[width] duration-150"
              style={progressStyle}
            />
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={onSeek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-all",
                isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FiPause /> : <FiPlay className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-all",
                isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={onVolumeInput}
              className="w-24 accent-[#2563EB]"
              aria-label="Volume"
            />

            <div
              className={classNames(
                "ml-1 text-sm font-medium",
                isDark ? "text-white/85" : "text-slate-700"
              )}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {qualities.length > 1 && (
              <select
                value={selectedQuality}
                onChange={onQualityChange}
                className={classNames(
                  "rounded-full border px-3 py-2 text-sm outline-none backdrop-blur transition",
                  isDark
                    ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                    : "border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
                )}
                aria-label="Quality"
              >
                <option value="auto" className="text-black">
                  Auto
                </option>
                {qualities.map((q) => (
                  <option
                    key={q.index}
                    value={String(q.index)}
                    className="text-black"
                  >
                    {q.label}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-all",
                isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}