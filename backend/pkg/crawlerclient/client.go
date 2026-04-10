package crawlerclient

import (
	"bityagi/internal/domain"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Client interface {
	Crawl(ctx context.Context, req *CrawlRequest) (*domain.CrawlExtractionResult, error)
}

type CrawlRequest struct {
	URL         string `json:"url"`
	Strategy    string `json:"strategy"`
	MaxPages    int    `json:"max_pages"`
	UseStealth  bool   `json:"use_stealth,omitempty"`
	ProxyRegion string `json:"proxy_region,omitempty"`
}

type crawlResponseEnvelope struct {
	Success bool                          `json:"success"`
	Result  *domain.CrawlExtractionResult `json:"result"`
	Error   string                        `json:"error"`
}

type HTTPClient struct {
	baseURL    string
	httpClient *http.Client
}

func New(baseURL string) Client {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		return nil
	}

	return &HTTPClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 2 * time.Minute,
		},
	}
}

func (c *HTTPClient) Crawl(ctx context.Context, req *CrawlRequest) (*domain.CrawlExtractionResult, error) {
	if c == nil {
		return nil, errors.New("crawler client is not configured")
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/crawl", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var envelope crawlResponseEnvelope
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return nil, err
	}

	if resp.StatusCode >= http.StatusBadRequest {
		if envelope.Error != "" {
			return nil, errors.New(envelope.Error)
		}
		return nil, fmt.Errorf("crawler service returned status %d", resp.StatusCode)
	}

	if envelope.Result == nil {
		if envelope.Error != "" {
			return nil, errors.New(envelope.Error)
		}
		return nil, errors.New("crawler service returned empty result")
	}

	return envelope.Result, nil
}
