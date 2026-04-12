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

        // Wait a bit extra for dynamic content
        await page.waitForTimeout(2000);

        const html = await page.content();
        const finalUrl = page.url();
        const title = await page.title();

        // Use JSDOM and Readability to extract meaningful content
        const dom = new JSDOM(html, { url: finalUrl });
        
        // Extract meta tags
        const descriptionMatch = dom.window.document.querySelector('meta[name="description"]');
        const description = descriptionMatch ? descriptionMatch.getAttribute('content') : '';
        const canonicalMatch = dom.window.document.querySelector('link[rel="canonical"]');
        const canonical_url = canonicalMatch ? canonicalMatch.getAttribute('href') : finalUrl;
        
        const langMatch = dom.window.document.querySelector('html');
        const language = langMatch ? langMatch.getAttribute('lang') || 'en' : 'en';

        // Extract reader content
        const reader = new Readability(dom.window.document);
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
