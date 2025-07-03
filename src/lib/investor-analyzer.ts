import type { Investor, InvestorMatchAnalysis, CompanyProfile } from './types';
import { COMPANY_PROFILE, INVESTOR_INTEREST_KEYWORDS, INVESTOR_FOCUS_AREAS } from './company-profile';

interface AnalysisResult {
  investor_id: number;
  score: number;
  reasons: string[];
  top_rated: boolean;
}

export class InvestorAnalyzer {
  private companyProfile: CompanyProfile;

  constructor(companyProfile: CompanyProfile = COMPANY_PROFILE) {
    this.companyProfile = companyProfile;
  }

  /**
   * Analyze a single investor and return a score with reasons
   */
  analyzeInvestor(investor: Investor): AnalysisResult {
    let totalScore = 0;
    const reasons: string[] = [];

    // Base score from investment_score if available
    if (investor.investment_score) {
      const baseScore = this.normalizeInvestmentScore(investor.investment_score);
      totalScore += baseScore * 0.2; // 20% weight
      reasons.push(`Base investment score: ${investor.investment_score}`);
    }

    // Analyze investor description and overview
    const descriptionScore = this.analyzeTextContent(investor.description || '');
    const overviewScore = this.analyzeTextContent(investor.overview || '');
    const practiceAreasScore = this.analyzeTextContent(investor.practice_areas || '');
    
    totalScore += descriptionScore * 0.3; // 30% weight
    totalScore += overviewScore * 0.25; // 25% weight
    totalScore += practiceAreasScore * 0.15; // 15% weight

    // Analyze investor type
    const typeScore = this.analyzeInvestorType(investor.investor_type || '');
    totalScore += typeScore * 0.1; // 10% weight

    // Analyze business models
    const businessModelScore = this.analyzeTextContent(investor.business_models || '');
    totalScore += businessModelScore * 0.1; // 10% weight

    // Additional scoring factors
    const additionalScore = this.analyzeAdditionalFactors(investor);
    totalScore += additionalScore;

    // Determine if top rated (top 10% of scores)
    const topRated = totalScore >= 80; // Threshold for top rated

    return {
      investor_id: investor.id,
      score: Math.round(totalScore),
      reasons: reasons.filter(reason => reason.length > 0),
      top_rated: topRated
    };
  }

  /**
   * Analyze text content for relevant keywords and themes
   */
  private analyzeTextContent(text: string): number {
    if (!text) return 0;

    const lowerText = text.toLowerCase();
    let score = 0;
    let keywordMatches = 0;

    // Check for interest keywords
    for (const keyword of INVESTOR_INTEREST_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywordMatches++;
        score += 5; // 5 points per keyword match
      }
    }

    // Check for specific focus areas
    for (const [area, keywords] of Object.entries(INVESTOR_FOCUS_AREAS)) {
      const areaMatches = keywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      ).length;
      
      if (areaMatches > 0) {
        score += areaMatches * 8; // 8 points per focus area keyword
      }
    }

    // Check for company-specific keywords
    const companyKeywords = [
      ...this.companyProfile.key_technologies,
      ...this.companyProfile.target_markets,
      ...this.companyProfile.competitive_advantages
    ];

    for (const keyword of companyKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 10; // 10 points for direct company relevance
      }
    }

    // Bonus for longer, more detailed descriptions
    if (text.length > 200) {
      score += 5;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Analyze investor type for relevance
   */
  private analyzeInvestorType(investorType: string): number {
    if (!investorType) return 0;

    const lowerType = investorType.toLowerCase();
    let score = 0;

    // High relevance types
    if (lowerType.includes('venture capital') || lowerType.includes('vc')) score += 25;
    if (lowerType.includes('angel') || lowerType.includes('seed')) score += 20;
    if (lowerType.includes('early stage') || lowerType.includes('startup')) score += 20;
    if (lowerType.includes('technology') || lowerType.includes('tech')) score += 15;
    if (lowerType.includes('ai') || lowerType.includes('artificial intelligence')) score += 30;
    if (lowerType.includes('software') || lowerType.includes('saas')) score += 15;
    if (lowerType.includes('enterprise')) score += 15;

    // Medium relevance types
    if (lowerType.includes('growth')) score += 10;
    if (lowerType.includes('private equity')) score += 8;
    if (lowerType.includes('investment')) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Normalize investment score to 0-100 scale
   */
  private normalizeInvestmentScore(score: number | string): number {
    if (typeof score === 'number') {
      return Math.min(Math.max(score, 0), 100);
    }

    if (typeof score === 'string') {
      // Handle formats like "85/100" or "85%"
      if (score.includes('/')) {
        const [numerator, denominator] = score.split('/').map(s => parseFloat(s));
        if (!isNaN(numerator) && !isNaN(denominator) && denominator > 0) {
          return Math.min((numerator / denominator) * 100, 100);
        }
      }
      
      if (score.includes('%')) {
        const num = parseFloat(score.replace('%', ''));
        return !isNaN(num) ? Math.min(Math.max(num, 0), 100) : 0;
      }

      const num = parseFloat(score);
      return !isNaN(num) ? Math.min(Math.max(num, 0), 100) : 0;
    }

    return 0;
  }

  /**
   * Analyze additional factors that might indicate investor suitability
   */
  private analyzeAdditionalFactors(investor: Investor): number {
    let score = 0;

    // Check if investor has website (indicates established presence)
    if (investor.website) score += 5;

    // Check if investor has LinkedIn (indicates professional presence)
    if (investor.company_linkedin) score += 5;

    // Check if investor has recent founding year (indicates active investing)
    if (investor.founded_year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - investor.founded_year;
      if (age <= 10) score += 10; // Recent investors more likely to invest
      else if (age <= 20) score += 5;
    }

    // Check location relevance (if in tech hubs)
    if (investor.country) {
      const techHubs = ['united states', 'usa', 'us', 'canada', 'uk', 'united kingdom', 'germany', 'france', 'singapore', 'israel'];
      if (techHubs.some(hub => investor.country?.toLowerCase().includes(hub))) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Generate detailed reason for the score
   */
  private generateReason(analysis: AnalysisResult): string {
    const reasons = analysis.reasons;
    
    if (reasons.length === 0) {
      return "Limited information available for analysis";
    }

    const topReasons = reasons.slice(0, 3); // Top 3 reasons
    return topReasons.join('. ');
  }

  /**
   * Analyze all investors and return sorted results
   */
  analyzeAllInvestors(investors: Investor[]): InvestorMatchAnalysis[] {
    console.log(`Starting analysis of ${investors.length} investors...`);

    const analyses = investors.map(investor => {
      const analysis = this.analyzeInvestor(investor);
      return {
        investor_id: analysis.investor_id,
        top_rated: analysis.top_rated,
        reason: this.generateReason(analysis),
        score: analysis.score
      };
    });

    // Sort by score descending
    analyses.sort((a, b) => b.score - a.score);

    // Mark top 10% as top rated
    const topCount = Math.ceil(analyses.length * 0.1);
    analyses.forEach((analysis, index) => {
      if (index < topCount) {
        analysis.top_rated = true;
      }
    });

    console.log(`Analysis complete. Found ${topCount} top-rated investors.`);
    return analyses;
  }
} 