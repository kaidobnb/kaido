# KAIDO Oracle Implementation Guide

## 🎯 Complete Implementation Roadmap

This guide walks you through implementing the KAIDO Custom Oracle from scratch.

---

## Phase 1: Setup & Dependencies (Day 1)

### 1.1 Install Required Packages

```bash
cd backend
npm install puppeteer cheerio openai axios
npm install --save-dev @types/cheerio
```

### 1.2 Environment Configuration

Add to `.env`:

```bash
# OpenAI API Key (required for AI parsing)
OPENAI_API_KEY=sk-proj-...

# Oracle Configuration
ORACLE_AI_MODEL=gpt-4o-mini  # or gpt-4o for better accuracy
ORACLE_MIN_SOURCES=3
ORACLE_MIN_CONFIDENCE=70
ORACLE_MIN_AGREEMENT=66

# MongoDB (already configured)
MONGO_URI=mongodb://localhost:27017/kaido
```

### 1.3 Seed Trusted Sources

```bash
cd backend/src/oracle/scripts
ts-node seedTrustedSources.ts
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing sources
✅ Inserted 15 trusted sources

📊 Summary by Category:
  news: 4 sources (avg reputation: 92.5)
  government: 2 sources (avg reputation: 100.0)
  entertainment: 3 sources (avg reputation: 88.3)
  technology: 3 sources (avg reputation: 86.7)
  finance: 3 sources (avg reputation: 91.7)

✅ Seed complete!
```

---

## Phase 2: Extend Prediction Model (Day 2)

### 2.1 Update Prediction Schema

Edit `backend/src/models/Prediction.ts`:

```typescript
// Add new categories
category: {
  type: String,
  enum: ['crypto', 'sports', 'realworld'], // Add 'realworld'
  default: 'crypto',
  required: true,
},

// Add oracle-specific data
oracleData: {
  eventType: String, // 'election_result', 'movie_award', etc.
  claim: String, // The claim to verify
  verificationProofId: {
    type: Schema.Types.ObjectId,
    ref: 'VerificationProof'
  },
  requiresOracle: {
    type: Boolean,
    default: false
  },
  schema: {
    description: String,
    fields: Schema.Types.Mixed
  }
}
```

### 2.2 Update Prediction Interface

```typescript
export interface IPrediction extends Document {
  // ... existing fields ...
  
  oracleData?: {
    eventType: string;
    claim: string;
    verificationProofId?: mongoose.Types.ObjectId;
    requiresOracle: boolean;
    schema?: {
      description: string;
      fields: Record<string, { type: string; description: string }>;
    };
  };
}
```

---

## Phase 3: Integrate Oracle into Resolution Job (Day 3)

### 3.1 Update `predictionResolutionJob.ts`

Add oracle resolution logic:

```typescript
import { OracleService } from '../oracle/services/OracleService';

// Initialize oracle
const oracle = new OracleService(process.env.OPENAI_API_KEY!);

// In the resolution job:
for (const prediction of expiredPredictions) {
  try {
    let resolvedChoice: string | undefined;

    // Check if prediction requires oracle verification
    if (prediction.category === 'realworld' && prediction.oracleData?.requiresOracle) {
      console.log(`🔮 Using oracle for prediction ${prediction._id}`);
      
      const oracleResult = await oracle.verifyEvent({
        predictionId: String(prediction._id),
        eventType: prediction.oracleData.eventType,
        claim: prediction.oracleData.claim,
        schema: prediction.oracleData.schema!,
        minimumSources: 3,
        minimumConfidence: 70,
        minimumAgreement: 66
      });

      if (oracleResult.success && oracleResult.verified) {
        resolvedChoice = 'yes'; // Claim verified
        
        // Store proof ID
        await Prediction.findByIdAndUpdate(prediction._id, {
          'oracleData.verificationProofId': oracleResult.proofId
        });
      } else {
        resolvedChoice = 'no'; // Claim not verified
      }
    }
    // ... existing crypto/sports logic ...
    
  } catch (error) {
    console.error(`Error resolving prediction ${prediction._id}:`, error);
  }
}

// Cleanup oracle resources
await oracle.cleanup();
```

---

## Phase 4: Frontend Integration (Day 4-5)

### 4.1 Add "Real-World Events" Category

Update prediction creation form:

```typescript
// In CreatePredictionForm.tsx
const categories = [
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'sports', label: 'Sports' },
  { value: 'realworld', label: 'Real-World Events' } // NEW
];

// Add event type selector for realworld category
{category === 'realworld' && (
  <select name="eventType">
    <option value="election_result">Election Result</option>
    <option value="movie_award">Movie Award</option>
    <option value="product_launch">Product Launch</option>
    <option value="weather_event">Weather Event</option>
  </select>
)}
```

