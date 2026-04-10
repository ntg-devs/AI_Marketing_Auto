CREATE TABLE IF NOT EXISTS crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    brief_id UUID REFERENCES content_briefs(id) ON DELETE SET NULL,
    knowledge_source_id UUID REFERENCES knowledge_sources(id) ON DELETE SET NULL,
    source_url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    final_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    strategy VARCHAR(20) NOT NULL DEFAULT 'auto',
    provider VARCHAR(50),
    http_status INT,
    pages_crawled INT DEFAULT 0,
    title TEXT,
    error_log TEXT,
    request_metadata JSONB,
    response_metadata JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crawl_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crawl_job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    depth INT DEFAULT 0,
    content_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'processed',
    raw_html TEXT,
    extracted_text TEXT,
    markdown_text TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_crawl_job_page UNIQUE (crawl_job_id, url)
);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_team_status ON crawl_jobs(team_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_source_url ON crawl_jobs(source_url);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_job ON crawl_pages(crawl_job_id, created_at);

DROP TRIGGER IF EXISTS trg_update_crawl_jobs ON crawl_jobs;
CREATE TRIGGER trg_update_crawl_jobs BEFORE UPDATE ON crawl_jobs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_crawl_pages ON crawl_pages;
CREATE TRIGGER trg_update_crawl_pages BEFORE UPDATE ON crawl_pages
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
