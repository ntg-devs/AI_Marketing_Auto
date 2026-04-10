import type { CampaignHistoryItem } from '@/types/campaignHistory';

export const campaignHistoryData: CampaignHistoryItem[] = [
  {
    id: 'ch-001',
    title: 'AI-Powered Marketing: 5 Strategies That Actually Work in 2026',
    campaignName: 'Product Launch Q2',
    channel: 'linkedin',
    status: 'success',
    publishedAt: '2026-04-08T09:00:00Z',
    sparklineData: [
      { day: 'Mon', value: 120 },
      { day: 'Tue', value: 245 },
      { day: 'Wed', value: 390 },
      { day: 'Thu', value: 520 },
      { day: 'Fri', value: 680 },
      { day: 'Sat', value: 590 },
      { day: 'Sun', value: 720 },
    ],
    engagementRate: 4.8,
    impressions: 12400,
    clicks: 596,
    researchKnowledgeBase: [
      'McKinsey Digital Marketing Trends 2026',
      'HubSpot State of AI in Marketing',
      'Internal: Q1 Performance Analytics Report',
    ],
    sources: [
      {
        id: 's1',
        title: 'McKinsey: The state of AI in early 2026',
        url: 'https://mckinsey.com/ai-2026',
        type: 'report',
      },
      {
        id: 's2',
        title: 'HubSpot Blog: AI Marketing Automation',
        url: 'https://hubspot.com/blog/ai-marketing',
        type: 'article',
      },
    ],
    aiAnalysis: {
      summary:
        'This post outperformed average LinkedIn engagement by 3.2x. The listicle format combined with data-driven insights resonated strongly with the B2B audience. Posting at 9AM UTC on Tuesday captured peak professional browsing hours.',
      sentiment: 'positive',
      keyFactors: [
        'Listicle format had 42% higher completion rate',
        'Data-backed claims increased trust signals',
        'CTA placement at paragraph 3 optimal for LinkedIn',
        'Hashtag strategy aligned with trending topics',
      ],
      recommendation:
        'Replicate the data-driven listicle format for upcoming campaigns. Consider A/B testing with carousel format for even higher engagement.',
    },
  },
  {
    id: 'ch-002',
    title: 'How Our Team Reduced CAC by 60% Using AI Content Workflows',
    campaignName: 'Brand Awareness 2026',
    channel: 'blog',
    status: 'success',
    publishedAt: '2026-04-07T14:30:00Z',
    sparklineData: [
      { day: 'Mon', value: 85 },
      { day: 'Tue', value: 140 },
      { day: 'Wed', value: 210 },
      { day: 'Thu', value: 345 },
      { day: 'Fri', value: 410 },
      { day: 'Sat', value: 320 },
      { day: 'Sun', value: 380 },
    ],
    engagementRate: 3.2,
    impressions: 8900,
    clicks: 285,
    researchKnowledgeBase: [
      'Internal: Q1 Cost Analysis Dashboard',
      'Gartner: Marketing Automation ROI Framework',
    ],
    sources: [
      {
        id: 's3',
        title: 'Gartner: Marketing Automation ROI 2026',
        url: 'https://gartner.com/marketing-roi',
        type: 'report',
      },
      {
        id: 's4',
        title: 'Internal Analytics: CAC Reduction Metrics',
        url: '#internal',
        type: 'internal',
      },
    ],
    aiAnalysis: {
      summary:
        'Case study format performed well for SEO with 3.2% engagement rate. The article ranked #4 for "AI content workflow" within 48 hours. Long-form content (2,800 words) had strong dwell time metrics.',
      sentiment: 'positive',
      keyFactors: [
        'Case study format builds authority',
        'SEO-optimized headers improved organic reach',
        'Internal data adds unique value proposition',
        'Social proof metrics strengthened credibility',
      ],
      recommendation:
        'Create a follow-up series expanding on each workflow stage. Consider repurposing into a LinkedIn carousel and short-form video.',
    },
  },
  {
    id: 'ch-003',
    title: 'Weekly Product Update: New AI Writing Assistant Features',
    campaignName: 'Product Launch Q2',
    channel: 'facebook',
    status: 'failed',
    publishedAt: '2026-04-06T16:00:00Z',
    sparklineData: [
      { day: 'Mon', value: 45 },
      { day: 'Tue', value: 38 },
      { day: 'Wed', value: 22 },
      { day: 'Thu', value: 18 },
      { day: 'Fri', value: 12 },
      { day: 'Sat', value: 8 },
      { day: 'Sun', value: 5 },
    ],
    engagementRate: 0.4,
    impressions: 3200,
    clicks: 45,
    researchKnowledgeBase: ['Internal: Product Changelog v3.2'],
    sources: [
      {
        id: 's5',
        title: 'Internal: Product Roadmap Documentation',
        url: '#internal',
        type: 'internal',
      },
    ],
    aiAnalysis: {
      summary:
        'This post significantly underperformed. Facebook algorithm deprioritized product update content. The purely promotional tone without storytelling failed to generate engagement. Publishing on Saturday afternoon missed peak audience hours.',
      sentiment: 'negative',
      keyFactors: [
        'Promotional tone without value-add content',
        'Saturday 4PM is worst posting time for B2B on Facebook',
        'No visual media attached - text-only posts get -72% reach',
        'Missing emotional hook or storytelling element',
      ],
      recommendation:
        'Reframe product updates as user success stories. Add video demos. Shift Facebook posting to Tuesday-Thursday, 10AM-2PM window.',
    },
  },
  {
    id: 'ch-004',
    title: 'The Future of Content Distribution: Multi-Channel AI Orchestration',
    campaignName: 'SEO Content Sprint',
    channel: 'blog',
    status: 'scheduled',
    scheduledAt: '2026-04-12T10:00:00Z',
    publishedAt: '',
    sparklineData: [],
    engagementRate: 0,
    impressions: 0,
    clicks: 0,
    researchKnowledgeBase: [
      'Forrester: Multi-Channel Content Strategy 2026',
      'Internal: Distribution Pipeline Architecture',
      'Content Marketing Institute: AI Orchestration Report',
    ],
    sources: [
      {
        id: 's6',
        title: 'Forrester: Multi-Channel Strategy Report',
        url: 'https://forrester.com/multi-channel',
        type: 'report',
      },
      {
        id: 's7',
        title: 'CMI: AI in Content Distribution',
        url: 'https://contentmarketinginstitute.com/ai-distribution',
        type: 'article',
      },
    ],
    aiAnalysis: {
      summary:
        'Pre-publication analysis indicates strong topic relevance. SEO keyword difficulty is moderate (KD 42) with high search volume. Predicted engagement rate: 3.8-4.5% based on historical performance of similar content.',
      sentiment: 'neutral',
      keyFactors: [
        'Target keyword has 8,400 monthly searches',
        'No competing content from top 5 competitors',
        'Optimal publish window: Tuesday 10AM EST',
        'Recommended word count: 2,200-2,500',
      ],
      recommendation:
        'Proceed with scheduled publication. Consider adding an interactive infographic to boost shareability. Pre-schedule social amplification across LinkedIn and Twitter.',
    },
  },
  {
    id: 'ch-005',
    title: 'Behind the Scenes: How We Built an AI-First Marketing Platform',
    campaignName: 'Brand Awareness 2026',
    channel: 'linkedin',
    status: 'success',
    publishedAt: '2026-04-05T08:00:00Z',
    sparklineData: [
      { day: 'Mon', value: 200 },
      { day: 'Tue', value: 380 },
      { day: 'Wed', value: 510 },
      { day: 'Thu', value: 620 },
      { day: 'Fri', value: 750 },
      { day: 'Sat', value: 680 },
      { day: 'Sun', value: 830 },
    ],
    engagementRate: 5.6,
    impressions: 18200,
    clicks: 1019,
    researchKnowledgeBase: [
      'Internal: Engineering Architecture Documentation',
      'Internal: Team Interview Transcripts',
      'LinkedIn Thought Leadership Best Practices',
    ],
    sources: [
      {
        id: 's8',
        title: 'LinkedIn: Thought Leadership Content Guide',
        url: 'https://linkedin.com/business/thought-leadership',
        type: 'article',
      },
      {
        id: 's9',
        title: 'Internal: Platform Architecture Overview',
        url: '#internal',
        type: 'internal',
      },
    ],
    aiAnalysis: {
      summary:
        'Top-performing post this quarter. Behind-the-scenes narrative created strong emotional connection. Personal storytelling from team members generated 5.6% engagement — highest in 90 days. Comments section showed high-quality professional discussions.',
      sentiment: 'positive',
      keyFactors: [
        'Personal narrative increases engagement by 4.1x',
        'Team member quotes humanize the brand',
        'Long-form LinkedIn posts (1,300+ chars) outperform short ones',
        'Early morning posting (8AM) captured commute audience',
      ],
      recommendation:
        'Create a monthly "Behind the Scenes" series. Feature different team members each time. This format should become a recurring content pillar.',
    },
  },
  {
    id: 'ch-006',
    title: 'Infographic: AI Marketing Stack Comparison 2026',
    campaignName: 'Product Launch Q2',
    channel: 'facebook',
    status: 'success',
    publishedAt: '2026-04-04T11:00:00Z',
    sparklineData: [
      { day: 'Mon', value: 150 },
      { day: 'Tue', value: 280 },
      { day: 'Wed', value: 320 },
      { day: 'Thu', value: 290 },
      { day: 'Fri', value: 260 },
      { day: 'Sat', value: 180 },
      { day: 'Sun', value: 210 },
    ],
    engagementRate: 2.9,
    impressions: 9800,
    clicks: 284,
    researchKnowledgeBase: [
      'G2: Marketing Automation Software Comparison',
      'Internal: Competitive Analysis Q1',
    ],
    sources: [
      {
        id: 's10',
        title: 'G2: Marketing Automation Grid Report',
        url: 'https://g2.com/categories/marketing-automation',
        type: 'report',
      },
    ],
    aiAnalysis: {
      summary:
        'Visual infographic format performed 2.4x better than text posts on Facebook. The comparison angle attracted engagement from competing brand audiences. Share rate was particularly high (3.1%), indicating viral potential.',
      sentiment: 'positive',
      keyFactors: [
        'Infographic format ideal for Facebook algorithm',
        'Comparison content drives debate and shares',
        'Visual hierarchy made data scannable',
        'Brand mentions triggered competitor audience reach',
      ],
      recommendation:
        'Produce monthly infographic comparisons. Test animated/video infographic format for even higher engagement. Consider boosting top-performing infographics with paid amplification.',
    },
  },
  {
    id: 'ch-007',
    title: '10 Email Subject Lines That Boosted Our Open Rate by 85%',
    campaignName: 'SEO Content Sprint',
    channel: 'blog',
    status: 'scheduled',
    scheduledAt: '2026-04-14T09:00:00Z',
    publishedAt: '',
    sparklineData: [],
    engagementRate: 0,
    impressions: 0,
    clicks: 0,
    researchKnowledgeBase: [
      'Mailchimp: Email Marketing Benchmarks 2026',
      'Internal: Email Campaign Performance Data',
    ],
    sources: [
      {
        id: 's11',
        title: 'Mailchimp: Email Benchmarks Report',
        url: 'https://mailchimp.com/resources/email-marketing-benchmarks',
        type: 'report',
      },
    ],
    aiAnalysis: {
      summary:
        'Pre-publication SEO analysis shows high potential. Target keyword "email subject lines" has 14,200 monthly searches with moderate competition. Listicle format historically performs well for this topic cluster.',
      sentiment: 'neutral',
      keyFactors: [
        'High-volume keyword with intent match',
        'Listicle with specific numbers increases CTR',
        'Include real data screenshots for credibility',
        'Internal link to email automation product page',
      ],
      recommendation:
        'Add A/B testing results screenshots. Create companion social snippets for each subject line example. Pre-schedule LinkedIn amplification.',
    },
  },
];
