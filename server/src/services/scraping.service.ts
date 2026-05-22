import crypto from 'node:crypto';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { pageCache } from '../db/schema/page_cache.js';
import type { ScrapeResult, PropertyData, PropertyType } from '@dscr/shared';

const SYSTEM_PROMPT = `You extract US real estate data from listing URLs. Return ONLY valid JSON with:
- address: full street address
- price: numeric listing price
- bedrooms: integer count
- bathrooms: number (supports .5)
- sqft: integer square footage
- propertyType: "single_family" | "condo" | "townhouse" | "multi_family" | "duplex" | "triplex" | "fourplex"
- yearBuilt: integer
- estimatedRent: numeric monthly rent estimate
- hoa: numeric monthly HOA fee (0 if none)
Use null for any field not found in the listing.`;

function extractState(address: string): string | null {
  const match = address.match(/\b([A-Z]{2})\s+\d{5}\b/);
  return match?.[1] ?? null;
}

export class ScrapingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const cacheKey = crypto.createHash('sha256').update(url).digest('hex');

    const [cached] = await db
      .select()
      .from(pageCache)
      .where(eq(pageCache.cacheKey, cacheKey))
      .limit(1);

    if (cached) {
      const age = Date.now() - new Date(cached.createdAt).getTime();
      if (age < cached.ttlSeconds * 1000) {
        return cached.resultData as ScrapeResult;
      }
      await db.delete(pageCache).where(eq(pageCache.cacheKey, cacheKey));
    }

    const result = await this._doScrape(url);

    try {
      await db.insert(pageCache).values({ cacheKey, resultData: result });
    } catch {
      // Cache insertion failure is non-fatal
    }

    return result;
  }

  private async _doScrape(url: string): Promise<ScrapeResult> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract property data from this listing URL: ${url}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    const parsed = JSON.parse(content);

    const property: PropertyData = {
      address: parsed.address ?? 'Unknown address',
      price: parsed.price ?? 0,
      bedrooms: parsed.bedrooms ?? 0,
      bathrooms: parsed.bathrooms ?? 0,
      sqft: parsed.sqft ?? 0,
      propertyType: (parsed.propertyType as PropertyType) ?? 'single_family',
      yearBuilt: parsed.yearBuilt ?? 0,
      estimatedRent: parsed.estimatedRent ?? 0,
      hoa: parsed.hoa ?? 0,
    };

    return {
      property,
      confidence: 0.8,
      raw: parsed,
    };
  }

  extractStateFromAddress(address: string): string | null {
    return extractState(address);
  }
}

export const scrapingService = new ScrapingService();
