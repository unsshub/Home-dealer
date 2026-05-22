import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrapingService } from './scraping.service.js';

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  delete: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([]),
}));

vi.mock('../db/index', () => ({
  db: mockDb,
}));

vi.mock('openai', () => {
  const MockOpenAI = vi.fn();
  MockOpenAI.prototype.chat = {
    completions: {
      create: vi.fn(),
    },
  };
  return { default: MockOpenAI };
});

describe('ScrapingService', () => {
  let service: ScrapingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ScrapingService();
  });

  it('returns cached result when cache hit is fresh', async () => {
    const cached = {
      id: '1',
      cacheKey: 'abc',
      resultData: { property: { address: '123 Main St' }, confidence: 0.9, raw: {} },
      createdAt: new Date(),
      ttlSeconds: 86400,
    };
    mockDb.limit.mockResolvedValue([cached]);

    const result = await service.scrape('https://example.com/listing');

    expect(result.property.address).toBe('123 Main St');
    expect(result.confidence).toBe(0.9);
    expect(mockDb.delete).not.toHaveBeenCalled();
  });

  it('calls OpenAI on cache miss and stores result', async () => {
    mockDb.limit.mockResolvedValue([]);

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            address: '456 Oak St',
            price: 300000,
            bedrooms: 3,
            bathrooms: 2,
            sqft: 1500,
            propertyType: 'single_family',
            yearBuilt: 2000,
            estimatedRent: 2500,
            hoa: 100,
          }),
        },
      }],
    });

    const openai = await import('openai');
    (openai.default.prototype.chat.completions.create as ReturnType<typeof vi.fn>) = mockCreate;

    const result = await service.scrape('https://example.com/listing2');

    expect(result.property.address).toBe('456 Oak St');
    expect(result.property.price).toBe(300000);
    expect(mockDb.values).toHaveBeenCalled();
  });

  it('deletes expired cache and re-fetches', async () => {
    const expired = {
      id: '1',
      cacheKey: 'abc',
      resultData: { property: { address: 'Old' }, confidence: 0.8, raw: {} },
      createdAt: new Date(Date.now() - 90000000),
      ttlSeconds: 86400,
    };
    mockDb.limit.mockResolvedValue([expired]);

    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            address: '789 Pine St',
            price: 500000,
            bedrooms: 4,
            bathrooms: 3,
            sqft: 2000,
            propertyType: 'single_family',
            yearBuilt: 2010,
            estimatedRent: 3000,
            hoa: 0,
          }),
        },
      }],
    });

    const openai = await import('openai');
    (openai.default.prototype.chat.completions.create as ReturnType<typeof vi.fn>) = mockCreate;

    const result = await service.scrape('https://example.com/listing3');

    expect(mockDb.delete).toHaveBeenCalled();
    expect(result.property.address).toBe('789 Pine St');
    expect(mockDb.values).toHaveBeenCalled();
  });
});
