# KAIDO Custom Oracle System

## 🔮 Overview

The KAIDO Oracle is an intelligent, self-sovereign verification system that uses **web scraping + AI** to verify real-world events without relying on third-party APIs.

### Key Features

- ✅ **Multi-Source Verification** - Scrapes 3-5 trusted sources for consensus
- 🤖 **AI-Powered Parsing** - Uses GPT-4 to extract structured data from unstructured HTML
- 📸 **Visual Verification** - Captures screenshots as proof
- 🔍 **Audit Trail** - Stores all raw data for transparency
- ⚖️ **Dispute Resolution** - Allows users to challenge oracle decisions
- 🎯 **Confidence Scoring** - Provides 0-100% confidence for each verification

---

## 🏗️ Architecture

```
User Creates Prediction
         ↓
Oracle Verification Request
         ↓
    ┌────┴────┐
    │ Scraper │ → Fetch HTML from 3-5 trusted sources
    └────┬────┘
         ↓
    ┌────┴────┐
    │AI Parser│ → Extract structured data using GPT-4
    └────┬────┘
         ↓
    ┌────┴────┐
    │Consensus│ → Compare results, calculate agreement
    └────┬────┘
         ↓
  Verification Proof Stored
         ↓
  Prediction Resolved
```

---

## 📦 Components

### 1. **Scrapers** (`/scrapers`)

- **BaseScraper** - Abstract base class with retry logic, rate limiting
- **CheerioScraper** - Fast scraper for static HTML pages
- **PuppeteerScraper** - Headless browser for JavaScript-heavy sites

### 2. **Parsers** (`/parsers`)

- **AIParser** - Uses OpenAI GPT-4 to extract structured data
- Supports vision API for screenshot analysis
- Returns confidence scores and reasoning

### 3. **Models** (`/models`)

- **OracleSource** - Registry of trusted sources (BBC, Reuters, etc.)
- **VerificationProof** - Audit trail of all verifications

### 4. **Services** (`/services`)

- **OracleService** - Main orchestrator
- **ProofStorageService** - Manages verification proofs
- **SchedulerService** - Cron jobs for automated verification

---

## 🚀 Usage Example

### 1. Register Trusted Sources

```typescript
import OracleSource from './models/OracleSource';

// Add BBC News as a trusted source
await OracleSource.create({
  name: 'BBC News',
  domain: 'bbc.com',
  category: 'news',
  reputation: 95,
  scraperType: 'cheerio',
  isActive: true
});
```

### 2. Verify an Event

```typescript
import { OracleService } from './services/OracleService';

const oracle = new OracleService(process.env.OPENAI_API_KEY!);

const result = await oracle.verifyEvent({
  predictionId: '507f1f77bcf86cd799439011',
  eventType: 'election_result',
  claim: 'Candidate X won the 2026 election',
  schema: {
    description: 'Extract election winner information',
    fields: {
      winner: { type: 'string', description: 'Name of the winning candidate' },
      votes: { type: 'number', description: 'Number of votes received' },
      percentage: { type: 'number', description: 'Percentage of total votes' }
    }
  },
  minimumSources: 3,
  minimumConfidence: 70,
  minimumAgreement: 66
});

console.log(result);
// {
//   success: true,
//   verified: true,
//   confidence: 92,
//   proofId: '507f1f77bcf86cd799439012'
// }
```

### 3. View Verification Proof

```typescript
import VerificationProof from './models/VerificationProof';

const proof = await VerificationProof.findById(proofId);

console.log(proof.sources); // All scraped sources
console.log(proof.consensus); // Consensus result
console.log(proof.sources[0].screenshot); // Screenshot proof
```

---

## 🎯 Supported Event Types

| Event Type | Example | Auto-Resolvable | Difficulty |
|------------|---------|-----------------|------------|
| **Election Results** | "Candidate X won 2026 election" | ✅ Yes | Medium |
| **Movie Awards** | "Movie X won Best Picture" | ✅ Yes | Easy |
| **Product Launches** | "iPhone 17 released" | ✅ Yes | Medium |
| **Stock Milestones** | "Tesla stock hit $500" | ✅ Yes | Easy |
| **Weather Events** | "Hurricane hit Florida" | ✅ Yes | Easy |
| **Sports Records** | "Player X broke record" | ✅ Yes | Easy |

---

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Optional: Use GPT-4o for better accuracy
ORACLE_AI_MODEL=gpt-4o

# Minimum sources required
ORACLE_MIN_SOURCES=3

# Minimum confidence threshold
ORACLE_MIN_CONFIDENCE=70

# Minimum agreement percentage
ORACLE_MIN_AGREEMENT=66
```

---

## 📊 Consensus Algorithm

The oracle uses a **weighted majority consensus** algorithm:

1. **Scrape** 3-5 trusted sources
2. **Parse** each source with AI (confidence score 0-100)
3. **Group** similar results
4. **Calculate** agreement percentage
5. **Verify** if:
   - Agreement ≥ 66% (configurable)
   - Average confidence ≥ 70% (configurable)

### Example:

```
Source 1 (BBC):     "Candidate A won" (confidence: 95%)
Source 2 (Reuters): "Candidate A won" (confidence: 90%)
Source 3 (AP):      "Candidate A won" (confidence: 92%)
Source 4 (CNN):     "Candidate B won" (confidence: 75%)

Result:
- Agreement: 75% (3/4 sources agree)
- Avg Confidence: 92%
- Verified: ✅ YES
```

---

## 🛡️ Security & Trust

### Source Reputation System

Each source has a reputation score (0-100):
- **90-100**: Tier 1 (BBC, Reuters, AP, Government sites)
- **70-89**: Tier 2 (Major news outlets)
- **50-69**: Tier 3 (Regional news)
- **<50**: Not used

Reputation is updated based on:
- Success rate of scrapes
- Agreement with other sources
- Manual admin adjustments

### Dispute Resolution

Users can dispute oracle decisions within 24 hours:

```typescript
await VerificationProof.findByIdAndUpdate(proofId, {
  dispute: {
    raisedBy: userId,
    raisedAt: new Date(),
    reason: 'Source data was incorrect',
    evidence: 'Link to contradicting evidence',
    status: 'open'
  }
});
```

Admins review disputes and can:
- Override oracle decision
- Refund participants
- Blacklist unreliable sources

---

## 📈 Performance

- **Scraping**: 2-5 seconds per source
- **AI Parsing**: 1-3 seconds per source
- **Total Time**: 10-20 seconds for full verification
- **Cost**: ~$0.01-0.05 per verification (OpenAI API)

---

## 🔮 Future Enhancements

- [ ] Community voting for disputed verifications
- [ ] Machine learning for source reliability scoring
- [ ] Support for video/audio evidence
- [ ] Integration with blockchain oracles (Chainlink, APRO)
- [ ] Real-time verification for live events
- [ ] Multi-language support

---

## 📝 Quick Start

1. **Install dependencies:**
   ```bash
   npm install puppeteer cheerio openai axios
   ```

2. **Seed trusted sources:**
   ```bash
   ts-node backend/src/oracle/scripts/seedTrustedSources.ts
   ```

3. **Test with examples:**
   ```bash
   ts-node backend/src/oracle/examples/electionVerificationExample.ts election
   ```

4. **See IMPLEMENTATION_GUIDE.md** for full integration steps

---

## 📝 License

MIT License - KAIDO Platform

