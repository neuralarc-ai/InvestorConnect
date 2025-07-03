import type { CompanyProfile } from './types';

// Configure your company profile here for investor matching
export const COMPANY_PROFILE: CompanyProfile = {
  name: "Neural Arc",
  description: "Neural Arc is a generative artificial intelligence company establishing the cognitive infrastructure for enterprises. Our intelligent agent systems integrate natively with existing data, allowing organisations to automate decisions, streamline workflows, and extract actionable insights without costly system replacement.",
  industry: "Artificial Intelligence",
  stage: "Seed",
  funding_needed: "Seed round",
  key_technologies: [
    "Generative AI",
    "Machine Learning",
    "Enterprise Software",
    "Agent Systems",
    "Data Integration",
    "Workflow Automation",
    "Cognitive Computing"
  ],
  target_markets: [
    "Enterprise",
    "B2B",
    "SaaS",
    "Financial Services",
    "Healthcare",
    "Manufacturing",
    "Technology"
  ],
  business_model: "SaaS",
  competitive_advantages: [
    "Proprietary AI agent framework",
    "Native data integration",
    "Rapid deployment capability",
    "Experienced founding team",
    "Strong market momentum in agentic automation"
  ]
};

// Keywords that indicate investor interest in AI/tech companies
export const INVESTOR_INTEREST_KEYWORDS = [
  // AI/ML related
  "artificial intelligence", "machine learning", "AI", "ML", "deep learning", "neural networks",
  "generative AI", "automation", "intelligent systems", "cognitive", "agent systems",
  
  // Technology
  "technology", "tech", "software", "SaaS", "enterprise software", "platform",
  "digital transformation", "innovation", "disruptive", "emerging technology",
  
  // Business models
  "B2B", "enterprise", "SaaS", "subscription", "recurring revenue", "scalable",
  
  // Investment stages
  "seed", "early stage", "startup", "growth", "venture capital", "angel investment",
  
  // Market sectors
  "fintech", "healthtech", "enterprise", "manufacturing", "financial services",
  
  // Positive indicators
  "innovative", "disruptive", "transformative", "scalable", "high growth",
  "market leader", "competitive advantage", "proprietary", "intellectual property"
];

// Keywords that indicate investor focus on specific areas
export const INVESTOR_FOCUS_AREAS = {
  ai_ml: ["artificial intelligence", "machine learning", "AI", "ML", "deep learning", "neural networks", "generative AI"],
  enterprise: ["enterprise", "B2B", "corporate", "business software", "enterprise software"],
  saas: ["SaaS", "software as a service", "subscription", "recurring revenue"],
  fintech: ["fintech", "financial technology", "banking", "payments", "financial services"],
  healthtech: ["healthtech", "healthcare technology", "medical", "healthcare"],
  automation: ["automation", "workflow", "process automation", "efficiency"],
  data: ["data", "analytics", "insights", "business intelligence", "data integration"]
}; 