
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Search, Users, Globe, Briefcase } from 'lucide-react';

const SolutionsSection: React.FC = () => {
  const solutions = [
    {
      id: 'fraud-detection',
      title: 'Combat Fraudulent Metrics & Fake Followers',
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200',
      solutions: [
        'Use multi-layered verification: Combine 3+ tools (HypeAuditor, Social Blade, Modash) for cross-verification of follower authenticity',
        'Implement engagement quality scoring: Focus on comment quality, story engagement, and saves-to-likes ratio over raw metrics',
        'Deploy AI-powered fraud detection: Use tools like Grin or AspireIQ that analyze follower behavior patterns and growth spikes',
        'Establish baseline metrics: Set minimum thresholds (e.g., 3%+ engagement rate, <20% suspicious followers) before influencer consideration',
        'Request audience demographics: Ask influencers for Instagram Insights screenshots showing age, gender, and location breakdowns',
        'Implement trial campaigns: Start with small test campaigns to validate actual performance before larger investments'
      ]
    },
    {
      id: 'influencer-discovery',
      title: 'Optimize Macro vs Micro/Nano Influencer Selection',
      icon: <Users className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-200',
      solutions: [
        'Create tiered campaign strategies: Use macro influencers for brand awareness (20-30% budget) and micro/nano for conversions (70-80%)',
        'Build micro-influencer databases: Use platforms like Klear, Upfluence, or AspireIQ to create searchable databases of verified micro creators',
        'Establish creator education programs: Partner with micro influencers to provide training on campaign processes, contracts, and ASCI compliance',
        'Implement performance-based compensation: Offer micro influencers performance bonuses to ensure quality output and compliance',
        'Use hashtag and location mining: Systematically search location-based hashtags (#PuneFoodie, #BangaloreStartup) to discover local micro influencers',
        'Create ambassador programs: Convert high-performing micro influencers into long-term brand ambassadors for consistent quality'
      ]
    },
    {
      id: 'platform-optimization',
      title: 'Navigate Instagram Platform Challenges',
      icon: <Search className="h-5 w-5 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200',
      solutions: [
        'Focus on Reels-first strategy: Prioritize influencers with strong Reels performance (avg. 10K+ views per Reel)',
        'Use advanced discovery tools: Leverage platforms like Later Influence, Creator.co, or Grin for Instagram-specific influencer search',
        'Monitor trending audio and hashtags: Use tools like TrendTok or Instagram\'s Creator Studio to identify trending elements for campaigns',
        'Implement cross-platform verification: Use YouTube, LinkedIn, or personal websites to verify influencer authenticity and expertise',
        'Create content format guidelines: Provide clear brief templates for Reels, Stories, and feed posts to ensure platform optimization',
        'Stay algorithm-informed: Subscribe to Instagram Creator updates and use tools like Socialinsider for algorithm change notifications'
      ]
    },
    {
      id: 'regional-diversity',
      title: 'Address Regional & Language Diversity',
      icon: <Globe className="h-5 w-5 text-orange-500" />,
      color: 'bg-orange-50 border-orange-200',
      solutions: [
        'Build regional influencer networks: Partner with local agencies in Tier-2/3 cities to identify authentic regional creators',
        'Use vernacular hashtag research: Employ native speakers to research trending hashtags in Hindi, Tamil, Marathi, Bengali, etc.',
        'Implement cultural vetting process: Create checklists for regional cultural appropriateness and local market relevance',
        'Leverage regional festivals and events: Time campaigns around local festivals (Durga Puja, Onam, Gudi Padwa) using regional influencers',
        'Create language-specific content briefs: Develop campaign guidelines that account for local slang, humor, and cultural references',
        'Use geo-targeted discovery: Employ location-based searches on Instagram and cross-reference with regional language content'
      ]
    },
    {
      id: 'compliance-management',
      title: 'Ensure Industry-Specific Compliance',
      icon: <Briefcase className="h-5 w-5 text-red-500" />,
      color: 'bg-red-50 border-red-200',
      solutions: [
        'Create compliance checklists: Develop industry-specific guidelines for BFSI, healthcare, and other regulated sectors',
        'Implement mandatory disclosure training: Require influencers to complete ASCI compliance courses before campaign participation',
        'Use compliance monitoring tools: Deploy automated tools to scan content for proper #ad, #sponsored disclosures',
        'Establish expert influencer panels: Create vetted lists of subject matter experts for finance, health, and tech categories',
        'Implement content approval workflows: Require legal/compliance team approval for regulated industry campaigns',
        'Maintain compliance documentation: Keep records of influencer certifications, disclosure screenshots, and approval trails'
      ]
    }
  ];

  const overallStrategies = [
    'Build comprehensive influencer CRM systems with detailed profiles, performance history, and compliance status',
    'Invest in AI-powered influencer matching tools that consider brand values, audience overlap, and content style',
    'Create standardized vetting processes with scorecards covering authenticity, engagement, compliance, and cultural fit',
    'Establish performance measurement frameworks beyond vanity metrics, focusing on brand lift, sentiment, and conversions',
    'Develop long-term influencer relationships rather than one-off campaigns to ensure consistency and better ROI'
  ];

  return (
    <div className="space-y-6">
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <span>Comprehensive Solutions for Indian Influencer Marketing Challenges</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {solutions.map((section) => (
            <Card key={section.id} className={`${section.color} border`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  {section.icon}
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{solution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <span>Overall Strategic Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {overallStrategies.map((strategy, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs mt-1">
                      {index + 1}
                    </Badge>
                    <span className="text-gray-700 text-sm">{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-gray-800">Expected Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <Badge className="bg-green-500 text-white">ROI Improvements</Badge>
                  <ul className="text-gray-700 space-y-1 text-xs">
                    <li>• 40-60% reduction in wasted ad spend on fake followers</li>
                    <li>• 25-35% improvement in campaign engagement rates</li>
                    <li>• 50% faster influencer discovery and vetting process</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Badge className="bg-blue-500 text-white">Quality Enhancements</Badge>
                  <ul className="text-gray-700 space-y-1 text-xs">
                    <li>• 90%+ compliance with ASCI guidelines</li>
                    <li>• Better brand-influencer alignment and authenticity</li>
                    <li>• Enhanced regional market penetration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolutionsSection;
