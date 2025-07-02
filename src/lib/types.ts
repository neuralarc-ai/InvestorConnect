export interface Investor {
  id: number;
  investor_name: string;
  contact_person: string;
  designation?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  company_linkedin?: string;
  twitter?: string;
  facebook?: string;
  country?: string;
  state?: string;
  city?: string;
  founded_year?: string;
  investor_type?: string;
  practice_areas?: string;
  description?: string;
  overview?: string;
  investment_score?: string;
  business_models?: string;
  contact_summary?: string;
  location?: string;
  domain_name?: string;
  blog_url?: string;
  tracxn_url?: string;
  // For any other columns in the CSV
  [key: string]: string | number | undefined;
}
