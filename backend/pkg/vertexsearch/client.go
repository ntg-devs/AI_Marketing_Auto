package vertexsearch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"google.golang.org/api/option"
	"google.golang.org/api/transport"
)

type Config struct {
	ProjectID       string
	Location        string
	CollectionID    string
	DataStoreID     string
	ServingConfigID string
	CredentialsFile string
}

type SearchResult struct {
	Title   string `json:"title"`
	URL     string `json:"url"`
	Snippet string `json:"snippet"`
}

type Client interface {
	Search(ctx context.Context, query string) ([]SearchResult, error)
}

type vertexClient struct {
	config Config
	client *http.Client
}

func New(cfg Config) (Client, error) {
	if cfg.Location == "" {
		cfg.Location = "global"
	}
	if cfg.CollectionID == "" {
		cfg.CollectionID = "default_collection"
	}
	if cfg.ServingConfigID == "" {
		cfg.ServingConfigID = "default_config"
	}

	opts := []option.ClientOption{
		option.WithScopes("https://www.googleapis.com/auth/cloud-platform"),
	}

	if cfg.CredentialsFile != "" {
		opts = append(opts, option.WithCredentialsFile(cfg.CredentialsFile))
	} else if os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") != "" {
		opts = append(opts, option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")))
	}

	httpClient, _, err := transport.NewHTTPClient(context.Background(), opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create vertex search http client: %w", err)
	}

	return &vertexClient{
		config: cfg,
		client: httpClient,
	}, nil
}

type searchRequest struct {
	Query     string `json:"query"`
	PageSize  int    `json:"pageSize"`
}

type searchResponse struct {
	Results []struct {
		Document struct {
			DerivedStructData struct {
				Link    string `json:"link"`
				Title   string `json:"title"`
				Snippets []struct {
					Snippet string `json:"snippet"`
				} `json:"snippets"`
			} `json:"derivedStructData"`
		} `json:"document"`
	} `json:"results"`
}

func (v *vertexClient) Search(ctx context.Context, query string) ([]SearchResult, error) {
	url := fmt.Sprintf("https://discoveryengine.googleapis.com/v1/projects/%s/locations/%s/collections/%s/dataStores/%s/servingConfigs/%s:search",
		v.config.ProjectID, v.config.Location, v.config.CollectionID, v.config.DataStoreID, v.config.ServingConfigID)

	reqBody := searchRequest{
		Query:    query,
		PageSize: 10,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := v.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("vertex search api error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var searchResp searchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0, len(searchResp.Results))
	for _, r := range searchResp.Results {
		snippet := ""
		if len(r.Document.DerivedStructData.Snippets) > 0 {
			snippet = r.Document.DerivedStructData.Snippets[0].Snippet
		}

		results = append(results, SearchResult{
			Title:   r.Document.DerivedStructData.Title,
			URL:     r.Document.DerivedStructData.Link,
			Snippet: snippet,
		})
	}

	return results, nil
}
