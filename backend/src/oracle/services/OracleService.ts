import { CheerioScraper } from '../scrapers/CheerioScraper';
import { PuppeteerScraper } from '../scrapers/PuppeteerScraper';
import { AIParser, ParseResult } from '../parsers/AIParser';
import OracleSource, { IOracleSource } from '../models/OracleSource';
import VerificationProof, { IVerificationProof } from '../models/VerificationProof';
import mongoose from 'mongoose';

export interface VerificationRequest {
  predictionId: string;
  eventType: string;
  claim: string;
  schema: {
    description: string;
    fields: Record<string, { type: string; description: string }>;
  };
  minimumSources?: number;
  minimumConfidence?: number;
  minimumAgreement?: number; // Percentage
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  confidence: number;
  proofId?: string;
  error?: string;
}

/**
 * Main Oracle Service
 * Orchestrates web scraping, AI parsing, and multi-source verification
 */
export class OracleService {
  private aiParser: AIParser;
  private puppeteerScraper: PuppeteerScraper | null = null;

  constructor(openaiApiKey: string) {
    this.aiParser = new AIParser(openaiApiKey);
  }

  /**
   * Verify a real-world event using multi-source consensus
   */
  async verifyEvent(request: VerificationRequest): Promise<VerificationResult> {
    try {
      console.log(`🔮 Starting oracle verification for: ${request.claim}`);

      // Get trusted sources for this event type
      const sources = await this.getTrustedSources(request.eventType);

      if (sources.length === 0) {
        throw new Error(`No trusted sources found for event type: ${request.eventType}`);
      }

      const minimumSources = request.minimumSources || 3;
      if (sources.length < minimumSources) {
        throw new Error(`Insufficient sources. Found ${sources.length}, need ${minimumSources}`);
      }

      // Scrape and parse data from each source
      const sourceResults = await this.scrapeMultipleSources(sources, request);

      // Calculate consensus
      const consensus = this.calculateConsensus(
        sourceResults,
        request.minimumAgreement || 66,
        request.minimumConfidence || 70
      );

      // Create verification proof
      const proof = await this.createVerificationProof(
        request.predictionId,
        request.eventType,
        request.claim,
        sourceResults,
        consensus
      );

      console.log(`✅ Oracle verification complete. Verified: ${consensus.verified}, Confidence: ${consensus.confidence}%`);

      return {
        success: true,
        verified: consensus.verified,
        confidence: consensus.confidence,
        proofId: (proof._id as any).toString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Oracle verification failed:', errorMessage);

      return {
        success: false,
        verified: false,
        confidence: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Get trusted sources for event type
   */
  private async getTrustedSources(eventType: string): Promise<IOracleSource[]> {
    // Map event types to source categories
    const categoryMap: Record<string, string[]> = {
      election_result: ['news', 'government'],
      movie_award: ['news', 'entertainment'],
      product_launch: ['news', 'technology'],
      stock_price: ['finance'],
      weather: ['government', 'news']
    };

    const categories = categoryMap[eventType] || ['news'];

    const sources = await OracleSource.find({
      category: { $in: categories },
      isActive: true,
      reputation: { $gte: 60 } // Only use sources with reputation >= 60
    })
      .sort({ reputation: -1 }) // Highest reputation first
      .limit(5); // Max 5 sources

    return sources;
  }

  /**
   * Scrape data from multiple sources
   */
  private async scrapeMultipleSources(
    sources: IOracleSource[],
    request: VerificationRequest
  ): Promise<any[]> {
    const results = [];

    for (const source of sources) {
      try {
        console.log(`📡 Scraping ${source.name}...`);

        // Choose scraper based on source configuration
        const scraper = source.scraperType === 'puppeteer'
          ? await this.getPuppeteerScraper(source.domain)
          : new CheerioScraper({ url: `https://${source.domain}` });

        // Scrape the source
        const scrapeResult = await scraper.scrape({
          screenshot: source.scraperType === 'puppeteer'
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          console.warn(`⚠️  Failed to scrape ${source.name}`);
          continue;
        }

        // Parse with AI
        console.log(`🤖 Parsing data from ${source.name} with AI...`);
        const parseResult = await this.aiParser.parse(
          scrapeResult.html,
          request.schema,
          { screenshot: scrapeResult.screenshot, useVision: !!scrapeResult.screenshot }
        );

        results.push({
          sourceId: source._id,
          sourceName: source.name,
          url: `https://${source.domain}`,
          scrapedAt: scrapeResult.timestamp,
          html: scrapeResult.html.substring(0, 50000), // Store first 50KB
          screenshot: scrapeResult.screenshot,
          extractedData: parseResult.data,
          aiConfidence: parseResult.confidence || 0,
          aiReasoning: parseResult.reasoning,
          success: parseResult.success,
          error: parseResult.error
        });

        console.log(`✅ ${source.name}: Confidence ${parseResult.confidence}%`);
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Get or create Puppeteer scraper instance
   */
  private async getPuppeteerScraper(domain: string): Promise<PuppeteerScraper> {
    if (!this.puppeteerScraper) {
      this.puppeteerScraper = new PuppeteerScraper({ url: `https://${domain}` });
    }
    return this.puppeteerScraper;
  }

  /**
   * Calculate consensus from multiple source results
   */
  private calculateConsensus(
    sourceResults: any[],
    minimumAgreement: number,
    minimumConfidence: number
  ): {
    verified: boolean;
    confidence: number;
    agreementPercentage: number;
    method: string;
    finalValue: any;
  } {
    const successfulResults = sourceResults.filter(r => r.success && r.extractedData);

    if (successfulResults.length === 0) {
      return {
        verified: false,
        confidence: 0,
        agreementPercentage: 0,
        method: 'failed',
        finalValue: null
      };
    }

    // Extract values from each source
    const values = successfulResults.map(r => ({
      data: r.extractedData,
      confidence: r.aiConfidence,
      source: r.sourceName
    }));

    // Simple majority consensus (can be enhanced with weighted voting)
    const valueGroups = this.groupSimilarValues(values);
    const largestGroup = valueGroups[0]; // Already sorted by size

    const agreementPercentage = (largestGroup.count / successfulResults.length) * 100;
    const averageConfidence = largestGroup.avgConfidence;

    const verified =
      agreementPercentage >= minimumAgreement &&
      averageConfidence >= minimumConfidence;

    return {
      verified,
      confidence: Math.round(averageConfidence),
      agreementPercentage: Math.round(agreementPercentage),
      method: agreementPercentage === 100 ? 'unanimous' : 'majority',
      finalValue: largestGroup.value
    };
  }

  /**
   * Group similar values (handles slight variations in extracted data)
   */
  private groupSimilarValues(values: any[]): Array<{
    value: any;
    count: number;
    avgConfidence: number;
    sources: string[];
  }> {
    const groups: Map<string, any> = new Map();

    for (const item of values) {
      const key = JSON.stringify(item.data);

      if (groups.has(key)) {
        const group = groups.get(key);
        group.count++;
        group.confidences.push(item.confidence);
        group.sources.push(item.source);
      } else {
        groups.set(key, {
          value: item.data,
          count: 1,
          confidences: [item.confidence],
          sources: [item.source]
        });
      }
    }

    // Convert to array and calculate average confidence
    const result = Array.from(groups.values()).map(group => ({
      value: group.value,
      count: group.count,
      avgConfidence: group.confidences.reduce((a: number, b: number) => a + b, 0) / group.confidences.length,
      sources: group.sources
    }));

    // Sort by count (descending)
    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * Create verification proof in database
   */
  private async createVerificationProof(
    predictionId: string,
    eventType: string,
    claim: string,
    sourceResults: any[],
    consensus: any
  ): Promise<IVerificationProof> {
    const proof = await VerificationProof.create({
      predictionId: new mongoose.Types.ObjectId(predictionId),
      eventType,
      claim,
      sources: sourceResults,
      consensus,
      status: consensus.verified ? 'verified' : 'failed',
      resolvedAt: new Date(),
      resolvedBy: 'oracle'
    });

    return proof;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.puppeteerScraper) {
      await this.puppeteerScraper.closeBrowser();
      this.puppeteerScraper = null;
    }
  }
}

