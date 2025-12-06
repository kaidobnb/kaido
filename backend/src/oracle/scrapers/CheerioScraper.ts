import { BaseScraper, ScraperConfig, ScraperResult } from './BaseScraper';

/**
 * Cheerio Scraper
 * Fast scraper for static HTML pages (no JavaScript execution)
 * Use this for simple websites that don't require JavaScript
 */
export class CheerioScraper extends BaseScraper {
  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Scrape the configured URL
   */
  async scrape(options?: { screenshot?: boolean }): Promise<ScraperResult> {
    try {
      this.log(`Scraping ${this.config.url}...`);
      
      const html = await this.fetchHTML(this.config.url);
      
      this.log(`Successfully scraped ${this.config.url} (${html.length} bytes)`);
      
      return {
        success: true,
        html,
        timestamp: new Date(),
        url: this.config.url
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Failed to scrape ${this.config.url}: ${errorMessage}`, 'error');
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        url: this.config.url
      };
    }
  }

  /**
   * Scrape and extract specific data using CSS selectors
   */
  async scrapeWithSelectors(selectors: Record<string, string>): Promise<ScraperResult> {
    const result = await this.scrape();
    
    if (!result.success || !result.html) {
      return result;
    }

    try {
      const $ = this.parseHTML(result.html);
      const data: Record<string, any> = {};

      for (const [key, selector] of Object.entries(selectors)) {
        data[key] = this.extractText($, selector);
      }

      return {
        ...result,
        data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parsing error';
      this.log(`Failed to parse selectors: ${errorMessage}`, 'error');
      
      return {
        ...result,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Scrape structured data (e.g., list of items)
   */
  async scrapeStructured(config: {
    containerSelector: string;
    itemSelector: string;
    fields: Record<string, string>;
  }): Promise<ScraperResult> {
    const result = await this.scrape();
    
    if (!result.success || !result.html) {
      return result;
    }

    try {
      const $ = this.parseHTML(result.html);
      const items: any[] = [];

      $(config.containerSelector).find(config.itemSelector).each((_: any, element: any) => {
        const item: Record<string, any> = {};

        for (const [key, selector] of Object.entries(config.fields)) {
          const value = this.extractText($, selector);
          if (value) item[key] = value;
        }

        if (Object.keys(item).length > 0) {
          items.push(item);
        }
      });

      return {
        ...result,
        data: items
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parsing error';
      this.log(`Failed to parse structured data: ${errorMessage}`, 'error');
      
      return {
        ...result,
        success: false,
        error: errorMessage
      };
    }
  }
}

