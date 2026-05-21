export interface PropertyData {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: PropertyType;
  yearBuilt: number;
  estimatedRent: number;
  hoa: number;
}

export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'duplex'
  | 'triplex'
  | 'fourplex';

export interface ScrapeResult {
  property: PropertyData;
  confidence: number;
  raw: unknown;
}
