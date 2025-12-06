import { CheerioScraper } from '../CheerioScraper';
import { ScraperResult } from '../BaseScraper';

/**
 * BBC News Scraper
 * Example scraper for BBC News articles
 */
export class BBCNewsScraper extends CheerioScraper {
  constructor(articleUrl: string) {
    super({
      url: articleUrl,
      timeout: 15000
    });
  }

  /**
   * Scrape BBC News article
   */
  async scrapeArticle(): Promise<ScraperResult> {
    const result = await this.scrape();

    if (!result.success || !result.html) {
      return result;
    }

    try {
      const $ = this.parseHTML(result.html);

      // Extract article data using BBC's HTML structure
      const data = {
        headline: this.extractText($, 'h1[id="main-heading"]') || 
                  this.extractText($, 'h1.story-body__h1'),
        
        summary: this.extractText($, 'p.story-body__introduction') ||
                 this.extractText($, 'div[data-component="text-block"] p:first'),
        
        publishedDate: this.extractAttribute($, 'time', 'datetime') ||
                       this.extractText($, 'time'),
        
        author: this.extractText($, 'span.byline__name') ||
                this.extractText($, 'div.byline span'),
        
        body: this.extractMultiple($, 'div[data-component="text-block"] p').join('\n'),
        
        category: this.extractText($, 'a.tag') ||
                  this.extractAttribute($, 'meta[property="article:section"]', 'content'),
        
        imageUrl: this.extractAttribute($, 'meta[property="og:image"]', 'content')
      };

      return {
        ...result,
        data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parsing error';
      this.log(`Failed to parse BBC article: ${errorMessage}`, 'error');

      return {
        ...result,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Search BBC News for articles about a topic
   */
  async searchNews(query: string, limit: number = 5): Promise<ScraperResult> {
    // Update URL to BBC search
    this.config.url = `https://www.bbc.com/search?q=${encodeURIComponent(query)}`;

    const result = await this.scrape();

    if (!result.success || !result.html) {
      return result;
    }

    try {
      const $ = this.parseHTML(result.html);
      const articles: any[] = [];

      // Extract search results
      $('div[data-testid="search-result"]').each((index, element) => {
        if (index >= limit) return;

        const article = {
          title: this.cleanText($(element).find('h2').text()),
          url: $(element).find('a').attr('href'),
          description: this.cleanText($(element).find('p').text()),
          date: $(element).find('time').attr('datetime')
        };

        if (article.title && article.url) {
          articles.push(article);
        }
      });

      return {
        ...result,
        data: articles
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parsing error';
      this.log(`Failed to parse BBC search results: ${errorMessage}`, 'error');

      return {
        ...result,
        success: false,
        error: errorMessage
      };
    }
  }
}

