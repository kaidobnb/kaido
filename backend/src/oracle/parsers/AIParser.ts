import OpenAI from 'openai';

export interface ParseConfig {
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  temperature?: number;
  maxTokens?: number;
}

export interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  confidence?: number; // 0-100
  reasoning?: string;
  error?: string;
  tokensUsed?: number;
}

/**
 * AI Parser using OpenAI GPT-4
 * Extracts structured data from unstructured HTML/text
 */
export class AIParser {
  private openai: OpenAI;
  private config: ParseConfig;

  constructor(apiKey: string, config: ParseConfig = {}) {
    this.openai = new OpenAI({ apiKey });
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.1, // Low temperature for consistent extraction
      maxTokens: 2000,
      ...config
    };
  }

  /**
   * Parse HTML/text and extract structured data based on schema
   */
  async parse<T>(
    content: string,
    schema: {
      description: string;
      fields: Record<string, { type: string; description: string }>;
    },
    options?: {
      screenshot?: string; // Base64 encoded screenshot
      useVision?: boolean;
    }
  ): Promise<ParseResult<T>> {
    try {
      const systemPrompt = this.buildSystemPrompt(schema);
      const userPrompt = this.buildUserPrompt(content);

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Use vision API if screenshot provided
      if (options?.screenshot && options?.useVision) {
        messages[1] = {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${options.screenshot}`
              }
            }
          ]
        };
      }

      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      if (!result) {
        throw new Error('Empty response from AI');
      }

      const parsed = JSON.parse(result);

      return {
        success: true,
        data: parsed.data as T,
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning,
        tokensUsed: response.usage?.total_tokens
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI parsing error:', errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Build system prompt with schema definition
   */
  private buildSystemPrompt(schema: {
    description: string;
    fields: Record<string, { type: string; description: string }>;
  }): string {
    const fieldsDescription = Object.entries(schema.fields)
      .map(([key, field]) => `  - ${key} (${field.type}): ${field.description}`)
      .join('\n');

    return `You are a data extraction expert. Your task is to extract structured information from HTML/text content.

TASK: ${schema.description}

EXTRACT THE FOLLOWING FIELDS:
${fieldsDescription}

IMPORTANT RULES:
1. Only extract information that is explicitly stated in the content
2. If a field cannot be found, set it to null
3. Provide a confidence score (0-100) for your extraction
4. Provide brief reasoning for your confidence score
5. Return ONLY valid JSON in this exact format:

{
  "data": {
    // extracted fields here
  },
  "confidence": 85,
  "reasoning": "Brief explanation of confidence score"
}`;
  }

  /**
   * Build user prompt with content
   */
  private buildUserPrompt(content: string): string {
    // Truncate content if too long (keep first 10000 chars)
    const truncated = content.length > 10000 
      ? content.substring(0, 10000) + '\n\n[Content truncated...]'
      : content;

    return `Extract the required information from the following content:\n\n${truncated}`;
  }

  /**
   * Verify a specific claim against content
   */
  async verifyClaim(
    content: string,
    claim: string
  ): Promise<ParseResult<{ verified: boolean; evidence: string }>> {
    try {
      const systemPrompt = `You are a fact-checking expert. Verify if a claim is supported by the provided content.

RULES:
1. Only verify based on explicit information in the content
2. Return "verified: true" only if the claim is clearly supported
3. Provide specific evidence (quote from content)
4. Provide confidence score (0-100)

Return JSON in this format:
{
  "data": {
    "verified": true/false,
    "evidence": "Specific quote or explanation"
  },
  "confidence": 85,
  "reasoning": "Brief explanation"
}`;

      const userPrompt = `CLAIM TO VERIFY: ${claim}\n\nCONTENT:\n${content.substring(0, 5000)}`;

      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const result = response.choices[0].message.content;
      if (!result) throw new Error('Empty response');

      const parsed = JSON.parse(result);

      return {
        success: true,
        data: parsed.data,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        tokensUsed: response.usage?.total_tokens
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

