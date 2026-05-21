import type { Strategy, Verdict, DSCRBreakdown, AnalysisParams } from './analysis';
import type { PropertyData } from './property';

export interface AnalyzeRequest {
  url: string;
  strategy: Strategy;
  params: AnalysisParams;
  overrides?: Partial<Pick<PropertyData, 'price' | 'estimatedRent' | 'hoa'>>;
}

export interface AnalyzeResponse {
  id: string;
  property: PropertyData & { id: string };
  strategy: Strategy;
  dscrRatio: number;
  verdict: Verdict;
  breakdown: DSCRBreakdown;
  createdAt: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}
