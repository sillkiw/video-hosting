CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    video_size BIGINT NOT NULL DEFAULT 0,
    content_type TEXT NOT NULL DEFAULT 'video/mp4',
    video_status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT videos_video_size_nonnegative CHECK (video_size >= 0),
    CONSTRAINT videos_status_check CHECK (
        video_status IN (
            'created',
            'uploading',
            'uploaded',
            'processing',
            'ready',
            'failed_upload',
            'failed_processing'
        )
    )
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_set_updated_at
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,

    CONSTRAINT video_jobs_attempts_nonnegative CHECK (attempts >= 0),
    CONSTRAINT video_jobs_type_check CHECK (job_type IN ('transcode')),
    CONSTRAINT video_jobs_status_check CHECK (
        status IN ('pending', 'processing', 'done', 'failed')
    )
);

CREATE UNIQUE INDEX ux_video_jobs_active
ON video_jobs(video_id, job_type)
WHERE status IN ('pending', 'processing');

CREATE INDEX idx_video_jobs_claim
ON video_jobs(status, created_at)
WHERE status = 'pending';

CREATE INDEX idx_video_jobs_video_id
ON video_jobs(video_id);
