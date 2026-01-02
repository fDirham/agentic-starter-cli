import { logError } from "../../utils/logger";
import { type SearchProvider, type SearchResult } from "./provider";

/**
 * NOTE: Does not really work
 */
export class GoogleSearchProvider implements SearchProvider {
  private readonly baseUrl = "https://www.google.com/search";
  private readonly userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  async search(query: string): Promise<SearchResult[]> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("q", query);
      url.searchParams.set("hl", "en");

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": this.userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Google search failed: ${response.status} ${response.statusText}`
        );
      }

      const html = await response.text();
      return this.parseSearchResults(html);
    } catch (error) {
      console.error("Error fetching Google search results:", error);
      return [];
    }
  }

  private parseSearchResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];

    // Google search results are contained in divs with class "g"
    // This regex attempts to extract title, URL, and snippet from the HTML
    // Note: This is fragile and may break if Google changes their HTML structure

    // Match search result blocks - looking for the main result containers
    const resultBlockRegex =
      /<div class="[^"]*g[^"]*"[^>]*>(.*?)<\/div>\s*<\/div>\s*<\/div>/gs;
    const blocks = html.match(resultBlockRegex) || [];

    for (const block of blocks.slice(0, 10)) {
      // Limit to first 10 results
      try {
        // Extract title and URL from <a> tag with <h3>
        const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/s);
        const urlMatch = block.match(/<a[^>]*href="\/url\?q=([^&"]*)/);

        // Extract snippet from description div
        const snippetMatch =
          block.match(/<div class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)<\/div>/s) ||
          block.match(/<span class="[^"]*st[^"]*"[^>]*>(.*?)<\/span>/s);

        if (titleMatch && urlMatch) {
          const title = this.cleanHtml(titleMatch[1] ?? "");
          const url = decodeURIComponent(urlMatch[1] ?? "");
          const snippet = snippetMatch
            ? this.cleanHtml(snippetMatch[1] ?? "")
            : "";

          // Skip if URL is not a valid http/https URL
          if (url && url.startsWith("http") && title) {
            results.push({
              title,
              url,
              snippet: snippet || "No description available",
            });
          }
        }
      } catch (err) {
        logError(
          "Error parsing a Google search result: " + (err as Error).message
        );
        // Skip malformed results
        continue;
      }
    }

    return results;
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }
}
