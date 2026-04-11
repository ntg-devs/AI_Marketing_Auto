export type CrawlStrategy = 'auto' | 'http' | 'browser' | 'browserless';

export interface StartResearchRequest {
  team_id: string;
  user_id?: string;
  brief_id?: string;
  url: string;
  strategy?: CrawlStrategy;
  max_pages?: number;
  use_stealth?: boolean;
  proxy_region?: string;
}

export interface StartResearchResponse {
  job_id: string;
  status: string;
  strategy: CrawlStrategy;
  queue: string;
  message?: string;
}

export interface CrawlJob {
  id: string;
  team_id: string;
  user_id?: string | null;
  brief_id?: string | null;
  knowledge_source_id?: string | null;
  source_url: string;
  normalized_url: string;
  final_url?: string;
  status: string;
  strategy: CrawlStrategy;
  provider?: string;
  http_status?: number;
  pages_crawled: number;
  title?: string;
  error_log?: string;
  request_metadata?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CrawlPage {
  id?: string;
  crawl_job_id?: string;
  url: string;
  title?: string;
  depth: number;
  content_type?: string;
  status?: string;
  raw_html?: string;
  extracted_text?: string;
  markdown_text?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeSource {
  id: string;
  team_id: string;
  title: string;
  source_type: string;
  content_text: string;
  metadata?: Record<string, unknown>;
  vector_id?: string;
  embedding_model?: string;
  token_count?: number;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrawlJobDetailResponse {
  job: CrawlJob;
  pages?: CrawlPage[];
  knowledge_source?: KnowledgeSource;
  message?: string;
}

export interface RecentResearchJob {
  jobId: string;
  url: string;
  teamId: string;
  status: string;
  title?: string;
  createdAt: string;
}
