package publisher

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// PublishResult holds the outcome of a publish attempt.
type PublishResult struct {
	ExternalPostID  string `json:"external_post_id"`
	ExternalPostURL string `json:"external_post_url"`
	Platform        string `json:"platform"`
}

// SocialPublisher is the interface that each platform adapter implements.
type SocialPublisher interface {
	Publish(opts PublishOptions) (*PublishResult, error)
	ValidateToken(token string) error
	PlatformName() string
}

// PublishOptions contains all data required to push a post to a social platform.
type PublishOptions struct {
	AccessToken string
	PageID      string // Facebook Page ID, LinkedIn Org ID, or Blog endpoint
	Title       string
	ContentHTML string
	ContentText string // Plain-text fallback (for platforms that don't support HTML)
	ImageURL    string // Optional featured image
	Tags        []string
}

// ─── Facebook Publisher (Graph API v19.0) ────────────────────────

type facebookPublisher struct{}

func NewFacebookPublisher() SocialPublisher {
	return &facebookPublisher{}
}

func (f *facebookPublisher) PlatformName() string { return "facebook" }

// ValidateToken checks whether a Facebook Page Access Token is valid using a debug_token call.
func (f *facebookPublisher) ValidateToken(token string) error {
	resp, err := http.Get(fmt.Sprintf("https://graph.facebook.com/me?access_token=%s", url.QueryEscape(token)))
	if err != nil {
		return fmt.Errorf("facebook token validation failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("facebook token invalid (HTTP %d): %s", resp.StatusCode, string(body))
	}
	return nil
}

// Publish posts content to a Facebook Page using the Graph API.
// Requires a Page Access Token with `pages_manage_posts` permission.
//
// API: POST https://graph.facebook.com/v19.0/{page_id}/feed
// Params: message, link (optional)
func (f *facebookPublisher) Publish(opts PublishOptions) (*PublishResult, error) {
	if opts.PageID == "" {
		return nil, fmt.Errorf("facebook: page_id is required")
	}
	if opts.AccessToken == "" || opts.AccessToken == "placeholder_pending_oauth" {
		return nil, fmt.Errorf("facebook: valid access_token is required — configure it in Settings → Connections")
	}

	// Convert HTML to plain text for Facebook (it doesn't render HTML in feed posts)
	message := opts.ContentText
	if message == "" {
		message = htmlToPlainText(opts.ContentHTML)
	}

	apiURL := fmt.Sprintf("https://graph.facebook.com/v19.0/%s/feed", opts.PageID)
	data := url.Values{
		"message":      {message},
		"access_token": {opts.AccessToken},
	}

	log.Printf("[FB Publisher] Posting to page %s (%d chars)...", opts.PageID, len(message))

	resp, err := http.PostForm(apiURL, data)
	if err != nil {
		return nil, fmt.Errorf("facebook API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("facebook API error (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("facebook: failed to parse response: %w", err)
	}

	// The ID is in format "pageId_postId"
	postURL := fmt.Sprintf("https://www.facebook.com/%s", result.ID)
	log.Printf("[FB Publisher] ✅ Published successfully: %s", result.ID)

	return &PublishResult{
		ExternalPostID:  result.ID,
		ExternalPostURL: postURL,
		Platform:        "facebook",
	}, nil
}

// ─── LinkedIn Publisher (Community Management API) ───────────────

type linkedinPublisher struct{}

func NewLinkedInPublisher() SocialPublisher {
	return &linkedinPublisher{}
}

func (l *linkedinPublisher) PlatformName() string { return "linkedin" }

func (l *linkedinPublisher) ValidateToken(token string) error {
	req, _ := http.NewRequest("GET", "https://api.linkedin.com/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("linkedin token validation failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("linkedin token invalid (HTTP %d): %s", resp.StatusCode, string(body))
	}
	return nil
}

// Publish creates a post on LinkedIn using the Community Management API.
// Requires an OAuth2 access token with `w_member_social` scope.
//
// API: POST https://api.linkedin.com/v2/ugcPosts
func (l *linkedinPublisher) Publish(opts PublishOptions) (*PublishResult, error) {
	if opts.AccessToken == "" || opts.AccessToken == "placeholder_pending_oauth" {
		return nil, fmt.Errorf("linkedin: valid access_token is required — configure it in Settings → Connections")
	}

	// LinkedIn needs the member URN. PageID serves as author URN here.
	authorURN := opts.PageID
	if authorURN == "" {
		// If no page ID, try to get the user's person URN
		authorURN = "urn:li:person:UNKNOWN"
	}
	// Ensure proper URN format
	if !strings.HasPrefix(authorURN, "urn:li:") {
		authorURN = "urn:li:person:" + authorURN
	}

	message := opts.ContentText
	if message == "" {
		message = htmlToPlainText(opts.ContentHTML)
	}

	payload := map[string]interface{}{
		"author":         authorURN,
		"lifecycleState": "PUBLISHED",
		"specificContent": map[string]interface{}{
			"com.linkedin.ugc.ShareContent": map[string]interface{}{
				"shareCommentary": map[string]string{
					"text": message,
				},
				"shareMediaCategory": "NONE",
			},
		},
		"visibility": map[string]string{
			"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
		},
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("linkedin: failed to marshal request: %w", err)
	}

	log.Printf("[LI Publisher] Posting as %s (%d chars)...", authorURN, len(message))

	req, err := http.NewRequest("POST", "https://api.linkedin.com/v2/ugcPosts", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("linkedin: failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+opts.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Restli-Protocol-Version", "2.0.0")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("linkedin API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		return nil, fmt.Errorf("linkedin API error (HTTP %d): %s", resp.StatusCode, string(body))
	}

	// Extract post ID from response header or body
	postID := resp.Header.Get("X-RestLi-Id")
	if postID == "" {
		var respBody map[string]interface{}
		_ = json.Unmarshal(body, &respBody)
		if id, ok := respBody["id"].(string); ok {
			postID = id
		}
	}

	postURL := ""
	if postID != "" {
		// Convert URN to URL
		postURL = fmt.Sprintf("https://www.linkedin.com/feed/update/%s", postID)
	}

	log.Printf("[LI Publisher] ✅ Published successfully: %s", postID)

	return &PublishResult{
		ExternalPostID:  postID,
		ExternalPostURL: postURL,
		Platform:        "linkedin",
	}, nil
}

// ─── Blog/Webhook Publisher ─────────────────────────────────────

type blogPublisher struct{}

func NewBlogPublisher() SocialPublisher {
	return &blogPublisher{}
}

func (b *blogPublisher) PlatformName() string { return "blog" }

func (b *blogPublisher) ValidateToken(token string) error {
	// Blog tokens are either WordPress application passwords or custom webhook secrets.
	// We'll do a basic non-empty check.
	if token == "" || token == "placeholder_pending_oauth" {
		return fmt.Errorf("blog: valid access_token/webhook secret is required")
	}
	return nil
}

// Publish sends content to a blog platform.
// Supports two modes:
//   1. WordPress REST API (if PageID is a WordPress site URL)
//   2. Custom Webhook (if PageID is a webhook URL)
//
// For WordPress: POST {site}/wp-json/wp/v2/posts
// For Webhook:   POST {webhook_url} with JSON payload
func (b *blogPublisher) Publish(opts PublishOptions) (*PublishResult, error) {
	if opts.AccessToken == "" || opts.AccessToken == "placeholder_pending_oauth" {
		return nil, fmt.Errorf("blog: valid access_token is required — configure it in Settings → Connections")
	}

	endpoint := opts.PageID
	if endpoint == "" {
		return nil, fmt.Errorf("blog: endpoint URL (page_id) is required — set your WordPress URL or Webhook URL")
	}

	// Detect if it's a WordPress endpoint
	isWordPress := strings.Contains(endpoint, "wp-json") || !strings.Contains(endpoint, "webhook")

	if isWordPress {
		return b.publishToWordPress(opts, endpoint)
	}
	return b.publishToWebhook(opts, endpoint)
}

func (b *blogPublisher) publishToWordPress(opts PublishOptions, siteURL string) (*PublishResult, error) {
	// Normalize URL
	apiURL := strings.TrimRight(siteURL, "/")
	if !strings.Contains(apiURL, "wp-json") {
		apiURL += "/wp-json/wp/v2/posts"
	}

	payload := map[string]interface{}{
		"title":   opts.Title,
		"content": opts.ContentHTML,
		"status":  "publish",
	}

	jsonBody, _ := json.Marshal(payload)
	log.Printf("[Blog Publisher] Posting to WordPress: %s", apiURL)

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("blog: failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Basic "+opts.AccessToken) // WordPress Application Password

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("blog API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		return nil, fmt.Errorf("wordpress API error (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var wpResp struct {
		ID   int    `json:"id"`
		Link string `json:"link"`
	}
	_ = json.Unmarshal(body, &wpResp)

	log.Printf("[Blog Publisher] ✅ Published to WordPress: ID=%d", wpResp.ID)

	return &PublishResult{
		ExternalPostID:  fmt.Sprintf("wp_%d", wpResp.ID),
		ExternalPostURL: wpResp.Link,
		Platform:        "blog",
	}, nil
}

func (b *blogPublisher) publishToWebhook(opts PublishOptions, webhookURL string) (*PublishResult, error) {
	payload := map[string]interface{}{
		"title":        opts.Title,
		"content_html": opts.ContentHTML,
		"content_text": opts.ContentText,
		"tags":         opts.Tags,
		"published_at": time.Now().Format(time.RFC3339),
	}

	jsonBody, _ := json.Marshal(payload)
	log.Printf("[Blog Publisher] Posting to webhook: %s", webhookURL)

	req, err := http.NewRequest("POST", webhookURL, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("webhook: failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+opts.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("webhook call failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("webhook error (HTTP %d): %s", resp.StatusCode, string(body))
	}

	log.Printf("[Blog Publisher] ✅ Webhook delivered successfully")

	return &PublishResult{
		ExternalPostID:  fmt.Sprintf("webhook_%d", time.Now().UnixMilli()),
		ExternalPostURL: "",
		Platform:        "blog",
	}, nil
}

// ─── Registry: get publisher by platform name ───────────────────

// GetPublisher returns the appropriate SocialPublisher for a given platform name.
func GetPublisher(platform string) (SocialPublisher, error) {
	switch strings.ToLower(platform) {
	case "facebook":
		return NewFacebookPublisher(), nil
	case "linkedin":
		return NewLinkedInPublisher(), nil
	case "blog":
		return NewBlogPublisher(), nil
	default:
		return nil, fmt.Errorf("unsupported platform: %s", platform)
	}
}
