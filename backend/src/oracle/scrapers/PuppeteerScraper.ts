import { BaseScraper, ScraperConfig, ScraperResult } from './BaseScraper';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Puppeteer Scraper
 * Headless browser scraper for JavaScript-heavy websites
 * Use this for SPAs, dynamic content, or sites that require JavaScript
 */
export class PuppeteerScraper extends BaseScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(config: ScraperConfig) {
    super(config);
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.log('Launching headless browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
      
      // Set user agent
      await this.page.setUserAgent(this.getRandomUserAgent());
      
      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Set extra headers
      if (this.config.headers) {
        await this.page.setExtraHTTPHeaders(this.config.headers);
      }
    }
  }

  /**
   * Scrape the configured URL
   */
  async scrape(options?: {
    waitForSelector?: string;
    waitForTimeout?: number;
    screenshot?: boolean;
  }): Promise<ScraperResult> {
    try {
      await this.initBrowser();
      
      if (!this.page) {
        throw new Error('Failed to initialize browser page');
      }

      this.log(`Navigating to ${this.config.url}...`);
      
      await this.page.goto(this.config.url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout
      });

      // Wait for specific selector if provided
      if (options?.waitForSelector) {
        this.log(`Waiting for selector: ${options.waitForSelector}`);
        await this.page.waitForSelector(options.waitForSelector, {
          timeout: this.config.timeout
        });
      }

      // Wait for additional timeout if provided
      if (options?.waitForTimeout) {
        this.log(`Waiting ${options.waitForTimeout}ms...`);
        await this.sleep(options.waitForTimeout);
      }

      // Get HTML content
      const html = await this.page.content();

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (options?.screenshot) {
        this.log('Capturing screenshot...');
        const screenshotBuffer = await this.page.screenshot({
          fullPage: true,
          type: 'png'
        });
        screenshot = Buffer.from(screenshotBuffer).toString('base64');
      }

      this.log(`Successfully scraped ${this.config.url} (${html.length} bytes)`);

      return {
        success: true,
        html,
        screenshot,
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
   * Scrape with custom JavaScript execution
   */
  async scrapeWithScript<T>(script: string): Promise<ScraperResult & { data?: T }> {
    const result = await this.scrape();
    
    if (!result.success || !this.page) {
      return result;
    }

    try {
      this.log('Executing custom script...');
      const data = await this.page.evaluate(script) as T;

      return {
        ...result,
        data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Script execution error';
      this.log(`Failed to execute script: ${errorMessage}`, 'error');
      
      return {
        ...result,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.log('Browser closed');
    }
  }
}

