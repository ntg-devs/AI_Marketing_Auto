const express = require('express');
const { chromium } = require('playwright');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3100;

app.post('/crawl', async (req, res) => {
    const { url, strategy, max_pages, use_stealth, proxy_region } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required', result: null });
    }

    console.log(`Starting crawl for: ${url} (strategy: ${strategy})`);

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        });

        const page = await context.newPage();
        
        let http_status = 200;
        let content_type = 'text/html';
        
        let response = null;
        try {
            response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        } catch (e) {
            // Navigation might timeout but page is partially loaded
            console.log(`Navigation partial error: ${e.message}`);
        }

        if (response) {
            http_status = response.status();
            content_type = response.headers()['content-type'] || 'text/html';
        }

        // Auto-scroll to trigger IntersectionObserver based lazy loading
        try {
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 800;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight || totalHeight > 15000) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
                window.scrollTo(0, 0);
            });
        } catch(e) {
            console.log(`Auto-scroll failed: ${e.message}`);
        }

        // Wait a bit extra for dynamic content to finish loading after scroll
        await page.waitForTimeout(2500);

        const html = await page.content();
        const finalUrl = page.url();
        const title = await page.title();

        // Use JSDOM and Readability to extract meaningful content
        const dom = new JSDOM(html, { url: finalUrl });
        const document = dom.window.document;
        
        // Fix lazy-loaded, responsive (<picture>), and relative images before Readability
        document.querySelectorAll('picture').forEach(pic => {
            const img = pic.querySelector('img') || document.createElement('img');
            const source = pic.querySelector('source');
            if (source) {
                const srcset = source.getAttribute('srcset') || source.getAttribute('data-srcset');
                if (srcset) {
                    const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
                    img.setAttribute('src', firstUrl);
                }
            }
            if (!pic.querySelector('img')) pic.appendChild(img);
        });

        document.querySelectorAll('img').forEach(img => {
            const lazySrc = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || img.getAttribute('data-src-hq');
            if (lazySrc) {
                img.setAttribute('src', lazySrc);
            } else if (!img.getAttribute('src') && img.getAttribute('srcset')) {
                const srcset = img.getAttribute('srcset');
                const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
                img.setAttribute('src', firstUrl);
            }
            
            let src = img.getAttribute('src');
            // Ignore base64 placeholders if we couldn't find a real src
            if (src && src.startsWith('data:image/') && img.getAttribute('data-srcset')) {
                 const srcset = img.getAttribute('data-srcset');
                 const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
                 img.setAttribute('src', firstUrl);
                 src = firstUrl;
            }

            if (src && (src.startsWith('/') || src.startsWith('.'))) {
                try {
                    const urlObj = new URL(src, finalUrl);
                    img.setAttribute('src', urlObj.href);
                } catch(e) {}
            }
        });
        
        // Extract meta tags
        const descriptionMatch = document.querySelector('meta[name="description"]');
        const description = descriptionMatch ? descriptionMatch.getAttribute('content') : '';
        const canonicalMatch = document.querySelector('link[rel="canonical"]');
        const canonical_url = canonicalMatch ? canonicalMatch.getAttribute('href') : finalUrl;
        
        const langMatch = document.querySelector('html');
        const language = langMatch ? langMatch.getAttribute('lang') || 'en' : 'en';

        // Extract reader content
        const reader = new Readability(document);
        const article = reader.parse();
        
        const extracted_text = article ? article.textContent : '';
        const articleHtml = article ? article.content : html;

        // Convert to markdown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced'
        });
        const markdown = turndownService.turndown(articleHtml);

        const result = {
            final_url: finalUrl,
            canonical_url: canonical_url,
            strategy_used: strategy || 'browser',
            provider_used: 'playwright',
            http_status: http_status,
            content_type: content_type,
            title: title || (article ? article.title : ''),
            description: description || (article ? article.excerpt : ''),
            language: language,
            extracted_text: extracted_text.trim(),
            markdown: markdown.trim(),
            html: html,
            metadata: {},
            pages: [] // Used if max_pages > 1, currently single page
        };

        res.json({
            success: true,
            result: result,
            error: ""
        });
        
    } catch (error) {
        console.error(`Crawl failed for ${url}:`, error);
        res.status(500).json({
            success: false,
            result: null,
            error: error.message || 'Failed to crawl'
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Crawler service listening on port ${PORT}`);
});
