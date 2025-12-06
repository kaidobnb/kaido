import mongoose from 'mongoose';
import OracleSource from '../models/OracleSource';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed Trusted Sources
 * Populates the database with trusted sources for oracle verification
 */

const trustedSources = [
  // Tier 1: News Sources (Reputation 90-100)
  {
    name: 'BBC News',
    domain: 'bbc.com',
    category: 'news',
    reputation: 95,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'Reuters',
    domain: 'reuters.com',
    category: 'news',
    reputation: 95,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'Associated Press',
    domain: 'apnews.com',
    category: 'news',
    reputation: 95,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'CNN',
    domain: 'cnn.com',
    category: 'news',
    reputation: 85,
    scraperType: 'puppeteer', // JavaScript-heavy site
    isActive: true,
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 300 }
  },

  // Government Sources (Reputation 100)
  {
    name: 'USA.gov',
    domain: 'usa.gov',
    category: 'government',
    reputation: 100,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 1000 }
  },
  {
    name: 'Federal Election Commission',
    domain: 'fec.gov',
    category: 'government',
    reputation: 100,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 1000 }
  },

  // Entertainment Sources (Reputation 85-90)
  {
    name: 'The Hollywood Reporter',
    domain: 'hollywoodreporter.com',
    category: 'entertainment',
    reputation: 90,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'Variety',
    domain: 'variety.com',
    category: 'entertainment',
    reputation: 90,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'IMDb',
    domain: 'imdb.com',
    category: 'entertainment',
    reputation: 85,
    scraperType: 'puppeteer',
    isActive: true,
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 300 }
  },

  // Technology Sources (Reputation 85-90)
  {
    name: 'TechCrunch',
    domain: 'techcrunch.com',
    category: 'technology',
    reputation: 85,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'The Verge',
    domain: 'theverge.com',
    category: 'technology',
    reputation: 85,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },
  {
    name: 'Ars Technica',
    domain: 'arstechnica.com',
    category: 'technology',
    reputation: 90,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  },

  // Finance Sources (Reputation 90-95)
  {
    name: 'Bloomberg',
    domain: 'bloomberg.com',
    category: 'finance',
    reputation: 95,
    scraperType: 'puppeteer',
    isActive: true,
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 300 }
  },
  {
    name: 'Financial Times',
    domain: 'ft.com',
    category: 'finance',
    reputation: 95,
    scraperType: 'puppeteer',
    isActive: true,
    rateLimit: { requestsPerMinute: 5, requestsPerDay: 300 }
  },
  {
    name: 'CNBC',
    domain: 'cnbc.com',
    category: 'finance',
    reputation: 85,
    scraperType: 'cheerio',
    isActive: true,
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 500 }
  }
];

async function seedSources() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kaido';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing sources (optional)
    await OracleSource.deleteMany({});
    console.log('🗑️  Cleared existing sources');

    // Insert trusted sources
    const inserted = await OracleSource.insertMany(trustedSources);
    console.log(`✅ Inserted ${inserted.length} trusted sources`);

    // Display summary
    console.log('\n📊 Summary by Category:');
    const categories = await OracleSource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgReputation: { $avg: '$reputation' } } },
      { $sort: { count: -1 } }
    ]);

    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} sources (avg reputation: ${cat.avgReputation.toFixed(1)})`);
    });

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedSources();
}

export default seedSources;

