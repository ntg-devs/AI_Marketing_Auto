const express = require("express");
const { CheerioCrawler, PlaywrightCrawler } = require("crawlee");
const { chromium } = require("playwright");

const app = express();
app.use(express.json({ limit: "2mb" }));

const port = Number(process.env.PORT || 3100);

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.post("/crawl", async (req, res) => {
  try {
    const input = normalizeRequest(req.body || {});
    const result = await crawlURL(input);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "crawl failed",
    });
  }
});

app.listen(port, () => {
  console.log(`crawler-service listening on ${port}`);
});

function normalizeRequest(body) {
  const url = String(body.url || "").trim();
  if (!url) {
    throw new Error("url is required");
  }

  return {
    url,
    strategy: normalizeStrategy(body.strategy),
    maxPages: clampInt(body.max_pages, 1, 10, 1),
    useStealth: Boolean(body.use_stealth),
    proxyRegion: String(body.proxy_region || "").trim(),
  };
}

function normalizeStrategy(strategy) {
  const value = String(strategy || "auto").trim().toLowerCase();
  if (["http", "browser", "browserless", "auto"].includes(value)) {
    return value;
  }
  return "auto";
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

async function crawlURL(input) {
  if (input.strategy === "http") {
    return crawlWithHTTP(input);
  }

  if (input.strategy === "browserless") {
    return crawlWithBrowserless(input);
  }

  if (input.strategy === "browser") {
    return crawlWithBrowser(input);
  }

  try {
    const httpResult = await crawlWithHTTP(input);
    if (isStrongHTTPResult(httpResult)) {
      return httpResult;
    }
  } catch (_error) {
  }

  if (process.env.BROWSERLESS_WS_ENDPOINT) {
    return crawlWithBrowserless(input);
  }

  return crawlWithBrowser(input);
}

async function crawlWithHTTP(input) {
  let finalResult = null;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: Math.max(1, input.maxPages),
    requestHandlerTimeoutSecs: 45,
    async requestHandler({ $, request, response }) {
      const html = $.html();
      const extraction = extractFromCheerio($, html);

      finalResult = {
        final_url: request.loadedUrl || request.url,
        strategy_used: "http",
        provider_used: "crawlee-cheerio",
        http_status: response?.statusCode || 200,
        title: extraction.title,
        description: extraction.description,
        language: extraction.language,
        canonical_url: extraction.canonicalUrl,
        content_type: response?.headers?.["content-type"] || "text/html",
        html,
        extracted_text: extraction.extractedText,
        markdown: extraction.extractedText,
        metadata: {
          headings: extraction.headings,
          links_count: extraction.linksCount,
          images_count: extraction.imagesCount,
        },
        pages: [
          {
            url: request.loadedUrl || request.url,
            title: extraction.title,
            depth: 0,
            content_type: response?.headers?.["content-type"] || "text/html",
            status: "processed",
            raw_html: html,
            extracted_text: extraction.extractedText,
            markdown_text: extraction.extractedText,
            metadata: {
              headings: extraction.headings,
            },
          },
        ],
      };
    },
    failedRequestHandler({ request, error }) {
      throw new Error(`http crawl failed for ${request.url}: ${error.message}`);
    },
  });

  await crawler.run([input.url]);

  if (!finalResult) {
    throw new Error("http crawler returned no result");
  }

  return finalResult;
}

async function crawlWithBrowser(input) {
  let finalResult = null;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: Math.max(1, input.maxPages),
    requestHandlerTimeoutSecs: 90,
    launchContext: {
      launchOptions: {
        headless: true,
        proxy: buildPlaywrightProxy(),
      },
    },
    async requestHandler({ page, request, response }) {
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          setTimeout(resolve, 1200);
        });
      }).catch(() => {});

      const html = await page.content();
      const extraction = await page.evaluate(runExtractionInBrowser);

      finalResult = {
        final_url: page.url(),
        strategy_used: "browser",
        provider_used: input.useStealth ? "playwright-local-stealth-ready" : "playwright-local",
        http_status: response?.status() || 200,
        title: extraction.title,
        description: extraction.description,
        language: extraction.language,
        canonical_url: extraction.canonicalUrl,
        content_type: "text/html",
        html,
        extracted_text: extraction.extractedText,
        markdown: extraction.extractedText,
        metadata: {
          headings: extraction.headings,
          links_count: extraction.linksCount,
          images_count: extraction.imagesCount,
        },
        pages: [
          {
            url: page.url(),
            title: extraction.title,
            depth: 0,
            content_type: "text/html",
            status: "processed",
            raw_html: html,
            extracted_text: extraction.extractedText,
            markdown_text: extraction.extractedText,
            metadata: {
              headings: extraction.headings,
            },
          },
        ],
      };
    },
    failedRequestHandler({ request, error }) {
      throw new Error(`browser crawl failed for ${request.url}: ${error.message}`);
    },
  });

  await crawler.run([input.url]);

  if (!finalResult) {
    throw new Error("browser crawler returned no result");
  }

  return finalResult;
}

async function crawlWithBrowserless(input) {
  const endpoint = process.env.BROWSERLESS_WS_ENDPOINT;
  if (!endpoint) {
    throw new Error("BROWSERLESS_WS_ENDPOINT is not configured");
  }

  const browser = await chromium.connectOverCDP(endpoint);

  try {
    const context = browser.contexts()[0] || (await browser.newContext());
    const page = await context.newPage();
    const response = await page.goto(input.url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const html = await page.content();
    const extraction = await page.evaluate(runExtractionInBrowser);

    return {
      final_url: page.url(),
      strategy_used: "browserless",
      provider_used: "browserless",
      http_status: response?.status() || 200,
      title: extraction.title,
      description: extraction.description,
      language: extraction.language,
      canonical_url: extraction.canonicalUrl,
      content_type: "text/html",
      html,
      extracted_text: extraction.extractedText,
      markdown: extraction.extractedText,
      metadata: {
        headings: extraction.headings,
        links_count: extraction.linksCount,
        images_count: extraction.imagesCount,
      },
      pages: [
        {
          url: page.url(),
          title: extraction.title,
          depth: 0,
          content_type: "text/html",
          status: "processed",
          raw_html: html,
          extracted_text: extraction.extractedText,
          markdown_text: extraction.extractedText,
          metadata: {
            headings: extraction.headings,
          },
        },
      ],
    };
  } finally {
    await browser.close();
  }
}

function isStrongHTTPResult(result) {
  if (!result) {
    return false;
  }

  const textLength = String(result.extracted_text || "").trim().length;
  const titleLength = String(result.title || "").trim().length;
  return textLength >= 400 && titleLength >= 5;
}

function buildPlaywrightProxy() {
  const server = process.env.PLAYWRIGHT_PROXY_SERVER;
  if (!server) {
    return undefined;
  }

  return {
    server,
    username: process.env.PLAYWRIGHT_PROXY_USERNAME || undefined,
    password: process.env.PLAYWRIGHT_PROXY_PASSWORD || undefined,
  };
}

function extractFromCheerio($, html) {
  $("script, style, noscript, svg, canvas, iframe").remove();
  const root = $("article").first().length
    ? $("article").first()
    : $("main").first().length
      ? $("main").first()
      : $("body").first();

  const text = normalizeText(root.text());
  const headings = $("h1, h2, h3")
    .slice(0, 10)
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter(Boolean);

  return {
    title: normalizeText($("title").first().text()) || headings[0] || "",
    description: $('meta[name="description"]').attr("content") || "",
    language: $("html").attr("lang") || "",
    canonicalUrl: $('link[rel="canonical"]').attr("href") || "",
    extractedText: text,
    headings,
    linksCount: $("a").length,
    imagesCount: $("img").length,
    html,
  };
}

function runExtractionInBrowser() {
  const removeSelectors = [
    "script",
    "style",
    "noscript",
    "svg",
    "canvas",
    "iframe",
    "nav",
    "footer",
    "header",
  ];

  for (const selector of removeSelectors) {
    document.querySelectorAll(selector).forEach((node) => node.remove());
  }

  const root =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.body;

  const extractedText = (root?.innerText || document.body?.innerText || "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .slice(0, 10)
    .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return {
    title: document.title || headings[0] || "",
    description: document.querySelector('meta[name="description"]')?.content || "",
    language: document.documentElement.lang || "",
    canonicalUrl: document.querySelector('link[rel="canonical"]')?.href || "",
    extractedText,
    headings,
    linksCount: document.querySelectorAll("a").length,
    imagesCount: document.querySelectorAll("img").length,
  };
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}
