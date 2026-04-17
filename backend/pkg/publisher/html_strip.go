package publisher

import (
	"regexp"
	"strings"
)

// htmlToPlainText strips HTML tags and converts common elements to readable plain text.
// Used for platforms that don't support HTML (Facebook, LinkedIn).
func htmlToPlainText(html string) string {
	if html == "" {
		return ""
	}

	text := html

	// Replace common block elements with newlines
	blockTags := regexp.MustCompile(`(?i)</(h[1-6]|p|div|blockquote|li)>`)
	text = blockTags.ReplaceAllString(text, "\n")

	// Replace <br> and <br/> with newlines
	brTag := regexp.MustCompile(`(?i)<br\s*/?>`)
	text = brTag.ReplaceAllString(text, "\n")

	// Replace <li> with bullet point
	liTag := regexp.MustCompile(`(?i)<li[^>]*>`)
	text = liTag.ReplaceAllString(text, "• ")

	// Replace <hr> with separator
	hrTag := regexp.MustCompile(`(?i)<hr\s*/?>`)
	text = hrTag.ReplaceAllString(text, "\n───\n")

	// Strip remaining HTML tags
	stripTags := regexp.MustCompile(`<[^>]*>`)
	text = stripTags.ReplaceAllString(text, "")

	// Decode common HTML entities
	text = strings.ReplaceAll(text, "&amp;", "&")
	text = strings.ReplaceAll(text, "&lt;", "<")
	text = strings.ReplaceAll(text, "&gt;", ">")
	text = strings.ReplaceAll(text, "&quot;", `"`)
	text = strings.ReplaceAll(text, "&#39;", "'")
	text = strings.ReplaceAll(text, "&nbsp;", " ")

	// Collapse multiple blank lines into at most two
	multiNewlines := regexp.MustCompile(`\n{3,}`)
	text = multiNewlines.ReplaceAllString(text, "\n\n")

	// Trim leading/trailing whitespace
	text = strings.TrimSpace(text)

	return text
}
