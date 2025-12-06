import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Event categories with their verification requirements
 */
export const EVENT_CATEGORIES = {
  election: {
    name: 'Election Results',
    description: 'Political elections and voting outcomes',
    requiredFields: ['candidate', 'position', 'location', 'date'],
    exampleClaim: 'Candidate X won the 2024 Presidential Election',
    suggestedSources: ['bbc.com', 'reuters.com', 'apnews.com'],
  },
  award: {
    name: 'Awards & Ceremonies',
    description: 'Movie awards, music awards, sports awards',
    requiredFields: ['awardName', 'category', 'winner', 'date'],
    exampleClaim: 'Movie X won Best Picture at the 2024 Oscars',
    suggestedSources: ['variety.com', 'hollywoodreporter.com', 'imdb.com'],
  },
  product_launch: {
    name: 'Product Launches',
    description: 'New product releases and announcements',
    requiredFields: ['productName', 'company', 'launchDate'],
    exampleClaim: 'Company X released Product Y in Month 2024',
    suggestedSources: ['techcrunch.com', 'theverge.com', 'engadget.com'],
  },
  merger: {
    name: 'Business Mergers & Acquisitions',
    description: 'Corporate mergers, acquisitions, and deals',
    requiredFields: ['acquirer', 'target', 'dealValue', 'completionDate'],
    exampleClaim: 'Company X acquired Company Y for $Z billion',
    suggestedSources: ['bloomberg.com', 'reuters.com', 'wsj.com'],
  },
  ipo: {
    name: 'IPO & Stock Listings',
    description: 'Initial public offerings and stock market listings',
    requiredFields: ['company', 'exchange', 'listingDate', 'openingPrice'],
    exampleClaim: 'Company X went public on Exchange Y at $Z per share',
    suggestedSources: ['bloomberg.com', 'cnbc.com', 'marketwatch.com'],
  },
  regulation: {
    name: 'Regulatory Decisions',
    description: 'Government regulations, laws, and policy changes',
    requiredFields: ['regulation', 'authority', 'effectiveDate'],
    exampleClaim: 'Government X approved/banned Y on Date Z',
    suggestedSources: ['reuters.com', 'bloomberg.com', 'ft.com'],
  },
  weather: {
    name: 'Weather Events',
    description: 'Major weather events and natural disasters',
    requiredFields: ['eventType', 'location', 'date', 'severity'],
    exampleClaim: 'Hurricane X made landfall in Location Y on Date Z',
    suggestedSources: ['weather.com', 'noaa.gov', 'bbc.com/weather'],
  },
  space: {
    name: 'Space Missions',
    description: 'Rocket launches, space missions, and discoveries',
    requiredFields: ['mission', 'agency', 'launchDate', 'outcome'],
    exampleClaim: 'Agency X successfully launched Mission Y on Date Z',
    suggestedSources: ['nasa.gov', 'spacex.com', 'space.com'],
  },
};

export type EventCategory = keyof typeof EVENT_CATEGORIES;

/**
 * Generate a verification schema for a real-world event claim using AI
 */
export async function generateVerificationSchema(
  eventType: EventCategory,
  claim: string
): Promise<{
  description: string;
  fields: Record<string, { type: string; description: string }>;
}> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const category = EVENT_CATEGORIES[eventType];

  const prompt = `You are helping create a verification schema for a real-world event prediction.

Event Type: ${category.name}
Claim: "${claim}"

Required Fields: ${category.requiredFields.join(', ')}

Generate a JSON schema that defines what data needs to be extracted from news sources to verify this claim.

Return ONLY a JSON object with this structure:
{
  "description": "Brief description of what to extract",
  "fields": {
    "fieldName": {
      "type": "string" | "number" | "boolean",
      "description": "What this field represents"
    }
  }
}

Make sure to include all required fields: ${category.requiredFields.join(', ')}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = response.choices[0].message.content;
  if (!result) throw new Error('Failed to generate schema');

  return JSON.parse(result);
}

/**
 * Validate a real-world event claim using AI
 */
export async function validateEventClaim(
  eventType: EventCategory,
  claim: string
): Promise<{
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const category = EVENT_CATEGORIES[eventType];

  const prompt = `You are validating a real-world event prediction claim.

Event Type: ${category.name}
Claim: "${claim}"

Check if this claim is:
1. Specific enough to be verified (includes dates, names, numbers)
2. Verifiable through public news sources
3. Not too vague or ambiguous
4. Includes all required information: ${category.requiredFields.join(', ')}

Example of a good claim: "${category.exampleClaim}"

Return ONLY a JSON object:
{
  "isValid": true/false,
  "reason": "Why it's valid or invalid",
  "suggestions": ["suggestion 1", "suggestion 2"] // Only if invalid
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = response.choices[0].message.content;
  if (!result) throw new Error('Failed to validate claim');

  return JSON.parse(result);
}

