# URL Crawl Flow

## Muc tieu

Luồng này cho phép người dùng nhập một URL bất kỳ, tạo job crawl bất đồng bộ, trích xuất nội dung từ nguồn hiện tại và lưu kết quả vào cả `crawl_jobs`, `crawl_pages` và `knowledge_sources`.

## Thanh phan da duoc scaffold

- `backend/internal/domain/crawl.go`
  - Model cho `crawl_jobs`, `crawl_pages`, `knowledge_sources`
  - Request/response contract cho API ingest URL
- `backend/internal/repository/crawl_repository.go`
  - Tao job
  - Cap nhat running/failed
  - Luu ket qua crawl + knowledge source
- `backend/internal/service/crawl_service.go`
  - Chuan hoa URL
  - Tao job va enqueue task
- `backend/internal/transport/http/crawl_handler.go`
  - `POST /api/v1/research/url`
  - `GET /api/v1/research/jobs/{jobID}`
- `backend/internal/task/*`
  - Them task `task:crawl_source_url`
  - Worker goi crawler service qua HTTP
- `crawler/src/server.js`
  - Service crawl tach rieng su dung `Crawlee + Playwright`
  - Ho tro `auto`, `http`, `browser`, `browserless`

## API moi

### Tao crawl job

`POST /api/v1/research/url`

```json
{
  "team_id": "00000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-0000-0000-000000000002",
  "brief_id": "00000000-0000-0000-0000-000000000003",
  "url": "https://example.com/blog/post",
  "strategy": "auto",
  "max_pages": 1,
  "use_stealth": false,
  "proxy_region": "sg"
}
```

### Lay ket qua job

`GET /api/v1/research/jobs/{jobID}`

Response tra ve:

- `job`
- `pages`
- `knowledge_source`

## Flow xu ly

1. API tao `crawl_jobs` voi trang thai `pending`
2. Asynq enqueue task `task:crawl_source_url`
3. Worker mark job `running`
4. Worker goi `crawler-service /crawl`
5. Crawler service chon chien luoc:
   - `http`: `CheerioCrawler`
   - `browser`: `PlaywrightCrawler`
   - `browserless`: ket noi browser tu xa qua `BROWSERLESS_WS_ENDPOINT`
   - `auto`: thu `http` truoc, neu noi dung yeu thi fallback sang browser
6. Worker luu:
   - `crawl_pages`
   - `knowledge_sources`
   - update `crawl_jobs` sang `completed`

## Bien moi truong

### Worker

- `CRAWLER_API_URL=http://crawler:3100`

### Crawler

- `BROWSERLESS_WS_ENDPOINT`
- `PLAYWRIGHT_PROXY_SERVER`
- `PLAYWRIGHT_PROXY_USERNAME`
- `PLAYWRIGHT_PROXY_PASSWORD`

## Ghi chu production

- Ban migration SQL bo sung nam o `backend/db/init/001_crawl_pipeline.sql`
- File nay gia dinh schema goc cua ban da ton tai truoc do
- `AutoMigrate` duoc them de de bootstrap local nhanh, nhung production nen chay SQL migration co kiem soat
- `browserless`/proxy la lop mo rong thuc te cho anti-bot, con khung hien tai tap trung vao ingestion flow va contract backend
