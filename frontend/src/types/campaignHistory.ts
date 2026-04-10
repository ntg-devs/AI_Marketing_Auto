export type DistributionChannel = 'facebook' | 'linkedin' | 'blog';

export type CampaignStatus = 'scheduled' | 'success' | 'failed';

export interface SparklineDataPoint {
  day: string;
  value: number;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'report' | 'social' | 'internal';
}

export interface AIAnalysis {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyFactors: string[];
  recommendation: string;
}

export interface CampaignHistoryItem {
  id: string;
  title: string;
  campaignName: string;
  channel: DistributionChannel;
  status: CampaignStatus;
  publishedAt: string; // ISO date string
  scheduledAt?: string;
  sparklineData: SparklineDataPoint[];
  engagementRate: number;  // percentage
  impressions: number;
  clicks: number;

  // Expanded detail data
  researchKnowledgeBase: string[];
  sources: ResearchSource[];
  aiAnalysis: AIAnalysis;
}
