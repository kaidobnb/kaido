import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

export interface ScraperConfig {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

export interface ScraperResult {
  success: boolean;
  html?: string;
  data?: any;
  error?: string;
  timestamp: Date;
  url: string;
  screenshot?: string; // Base64 encoded screenshot
}

/**
 * Base Scraper Class
 * Provides common functionality for all scrapers
 */
export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected userAgents: string[] = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  constructor(config: ScraperConfig) {
    this.config = {
      timeout: 15000,
      retries: 3,
      ...config
    };
  }

  /**
   * Abstract scrape method - must be implemented by subclasses
   */
  abstract scrape(options?: any): Promise<ScraperResult>;

  /**
   * Fetch HTML from URL with retry logic
   */
  protected async fetchHTML(url: string): Promise<string> {
    return this.retryWithBackoff(async () => {
      const config: AxiosRequestConfig = {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          ...this.config.headers
        }
      };

      const response = await axios.get(url, config);
      return response.data;
    }, this.config.retries || 3);
  }

  /**
   * Retry with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      this.log(`Retry failed, ${retries} attempts remaining. Waiting ${delay}ms...`, 'warn');
      await this.sleep(delay);
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Parse HTML with Cheerio
   */
  protected parseHTML(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Extract text from selector
   */
  protected extractText($: cheerio.CheerioAPI, selector: string): string | null {
    const element = $(selector).first();
    return element.length > 0 ? this.cleanText(element.text()) : null;
  }

  /**
   * Extract attribute from selector
   */
  protected extractAttribute($: cheerio.CheerioAPI, selector: string, attribute: string): string | null {
    const element = $(selector).first();
    return element.length > 0 ? element.attr(attribute) || null : null;
  }

  /**
   * Extract multiple elements
   */
  protected extractMultiple($: cheerio.CheerioAPI, selector: string): string[] {
    const results: string[] = [];
    $(selector).each((_, element) => {
      const text = this.cleanText($(element).text());
      if (text) results.push(text);
    });
    return results;
  }

  /**
   * Clean text (remove extra whitespace, newlines)
   */
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Get random user agent
   */
  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utility
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.constructor.name}]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  ${message}`);
        break;
      default:
        console.log(`${prefix} ℹ️  ${message}`);
    }
  }
}

