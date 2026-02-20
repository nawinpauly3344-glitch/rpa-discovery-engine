-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS jobs (
  job_hash TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  work_mode TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  date_found TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable full-text search on title and description if needed later
CREATE INDEX idx_jobs_title ON jobs (title);
CREATE INDEX idx_jobs_company ON jobs (company);
