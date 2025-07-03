# Investor Analysis System Setup

This document explains how to set up and use the AI-powered investor analysis system that matches your 7500+ investor records against your company profile.

## 🗄️ Database Setup

### 1. Create the Analysis Table

Run this SQL in your Supabase dashboard:

```sql
DROP TABLE IF EXISTS investor_match_analysis;

CREATE TABLE IF NOT EXISTS investor_match_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id bigint REFERENCES investors(id) ON DELETE CASCADE,
  top_rated boolean,
  reason text,
  score int,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_investor_match_analysis_score ON investor_match_analysis(score DESC);
CREATE INDEX idx_investor_match_analysis_top_rated ON investor_match_analysis(top_rated);
CREATE INDEX idx_investor_match_analysis_created_at ON investor_match_analysis(created_at DESC);

-- Enable Row Level Security (optional)
ALTER TABLE investor_match_analysis ENABLE ROW LEVEL SECURITY;
```

## 🔧 Environment Variables

Add these to your `.env.local` file:

```bash
# Existing variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# New variable for cron job security (optional)
CRON_SECRET=your_secret_key_here
```

## 🚀 Vercel Cron Job Setup

The cron job is configured in `vercel.json` to run daily at 2 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/analyze-investors",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Cron Schedule Options:
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 2 * * 1` - Weekly on Monday at 2 AM
- `0 2 1 * *` - Monthly on the 1st at 2 AM

## 🎯 Company Profile Configuration

Edit `src/lib/company-profile.ts` to match your company:

```typescript
export const COMPANY_PROFILE: CompanyProfile = {
  name: "Your Company Name",
  description: "Your company description...",
  industry: "Your Industry",
  stage: "Seed/Series A/etc",
  funding_needed: "Amount needed",
  key_technologies: ["Tech1", "Tech2", "Tech3"],
  target_markets: ["Market1", "Market2"],
  business_model: "SaaS/B2B/etc",
  competitive_advantages: ["Advantage1", "Advantage2"]
};
```

## 📊 Analysis Algorithm

The system analyzes investors based on:

### Scoring Factors (Weighted):
1. **Investment Score** (20%) - Existing score from database
2. **Description Analysis** (30%) - Keyword matching in investor description
3. **Overview Analysis** (25%) - Keyword matching in investor overview
4. **Practice Areas** (15%) - Focus area relevance
5. **Investor Type** (10%) - Type of investor (VC, Angel, etc.)

### Additional Factors:
- **Company presence** (website, LinkedIn)
- **Geographic location** (tech hubs get bonus points)
- **Investor age** (recently founded investors get bonus)
- **Direct keyword matches** with your company profile

### Top-Rated Criteria:
- Investors in the top 10% by score
- Minimum score threshold of 80

## 🔍 API Endpoints

### 1. Run Full Analysis (Cron Job)
```
GET/POST /api/cron/analyze-investors
```

**Response:**
```json
{
  "success": true,
  "message": "Investor analysis completed successfully",
  "summary": {
    "totalInvestors": 7500,
    "totalAnalyzed": 7500,
    "totalInserted": 7500,
    "totalErrors": 0,
    "topRatedCount": 750,
    "averageScore": 65,
    "scoreDistribution": {
      "high": 1500,
      "medium": 3000,
      "low": 3000
    },
    "batchInfo": {
      "totalBatches": 15,
      "batchSize": 500,
      "processedCount": 7500
    }
  }
}
```

### 2. Run Micro-Batch Analysis (Manual Control)
```
POST /api/cron/analyze-investors-batch
```

**Request Body:**
```json
{
  "batchNumber": 0,
  "batchSize": 10,
  "clearExisting": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Micro-batch 1 analysis completed successfully",
  "summary": {
    "batchNumber": 1,
    "totalBatches": 750,
    "batchSize": 10,
    "totalInvestors": 7500,
    "totalAnalyzed": 10,
    "totalInserted": 10,
    "totalErrors": 0,
    "topRatedCount": 1,
    "averageScore": 65,
    "scoreDistribution": {
      "high": 2,
      "medium": 5,
      "low": 3
    },
    "range": {
      "from": 1,
      "to": 10
    }
  }
}
```

### 3. Run Progressive Analysis (Multiple Micro-Batches)
```
POST /api/cron/analyze-investors-progressive
```

**Request Body:**
```json
{
  "startBatch": 0,
  "numBatches": 5,
  "batchSize": 10,
  "clearExisting": false,
  "delayBetweenBatches": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progressive analysis completed successfully. Processed 50 investors across 5 micro-batches.",
  "summary": {
    "totalInvestors": 7500,
    "totalBatches": 750,
    "batchSize": 10,
    "startBatch": 1,
    "endBatch": 5,
    "batchesProcessed": 5,
    "totalAnalyzed": 50,
    "totalProcessed": 50,
    "totalTopRated": 5,
    "totalErrors": 0,
    "averageScore": 65,
    "scoreDistribution": {
      "high": 10,
      "medium": 25,
      "low": 15
    },
    "batchResults": [
      {
        "batchNumber": 1,
        "success": true,
        "processed": 10,
        "topRated": 1,
        "inserted": 10,
        "errors": 0,
        "averageScore": 65
      }
    ],
    "range": {
      "from": 1,
      "to": 50
    }
  }
}
```

### 4. Get Batch Information
```
GET /api/cron/analyze-investors-batch?batch_size=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalInvestors": 7500,
    "totalBatches": 15,
    "batchSize": 500,
    "batches": [
      {
        "batchNumber": 0,
        "from": 1,
        "to": 500,
        "size": 500
      },
      {
        "batchNumber": 1,
        "from": 501,
        "to": 1000,
        "size": 500
      }
    ]
  }
}
```

### 5. Fetch Analysis Results
```
GET /api/investor-analysis?page=1&limit=20&top_rated=true&min_score=80&sort_by=score&sort_order=desc
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `top_rated` - Filter top-rated only (true/false)
- `min_score` - Minimum score filter
- `max_score` - Maximum score filter
- `sort_by` - Sort field (score, created_at)
- `sort_order` - Sort direction (asc, desc)

## 🎨 UI Components

### Investor Analysis Dashboard
The `InvestorAnalysisDashboard` component provides:
- Real-time analysis results
- Filtering and sorting
- Score visualization
- Top-rated investor highlighting
- Direct email and contact links

### Integration
Add the dashboard to your main app:

```typescript
import { InvestorAnalysisDashboard } from "@/components/investors/investor-analysis-dashboard"

// In your page component
<InvestorAnalysisDashboard />
```

## 🔄 Manual Analysis Trigger

You can manually trigger analysis from the UI or via API:

### Full Analysis:
```bash
# Via curl
curl -X POST https://your-domain.vercel.app/api/cron/analyze-investors

# Via fetch
fetch('/api/cron/analyze-investors', { method: 'POST' })
```

### Micro-Batch Analysis:
```bash
# Via curl - analyze first micro-batch
curl -X POST https://your-domain.vercel.app/api/cron/analyze-investors-batch \
  -H "Content-Type: application/json" \
  -d '{"batchNumber": 0, "batchSize": 10}'

# Via fetch - analyze specific micro-batch
fetch('/api/cron/analyze-investors-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batchNumber: 0,
    batchSize: 10,
    clearExisting: false
  })
})
```

### Progressive Analysis:
```bash
# Via curl - analyze multiple micro-batches
curl -X POST https://your-domain.vercel.app/api/cron/analyze-investors-progressive \
  -H "Content-Type: application/json" \
  -d '{"startBatch": 0, "numBatches": 5, "batchSize": 10}'

# Via fetch - progressive analysis
fetch('/api/cron/analyze-investors-progressive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startBatch: 0,
    numBatches: 5,
    batchSize: 10,
    clearExisting: false,
    delayBetweenBatches: 500
  })
})
```

## 📈 Performance Considerations

### For Large Datasets (7500+ records):
- **Analysis runs in micro-batches of 10 records** for precise processing
- **Database inserts in batches of 10 records** for optimal performance
- **Real-time progress tracking** and error handling for each micro-batch
- **Memory-efficient processing** with controlled micro-batch sizes
- **Delays between micro-batches** (500ms) to prevent overwhelming the system
- **Progressive analysis** allows processing multiple micro-batches sequentially

### Optimization Tips:
1. **Database Indexes** - Ensure all indexes are created
2. **Micro-Batch Size** - Adjust `BATCH_SIZE` (10) and `INSERT_BATCH_SIZE` (10) if needed
3. **Cron Frequency** - Don't run too frequently to avoid database load
4. **Monitoring** - Check Vercel logs for performance issues
5. **Progressive Processing** - Use progressive analysis for controlled, incremental updates
6. **Delay Settings** - Adjust `delayBetweenBatches` (500ms) based on system performance

## 🛡️ Security

### Cron Job Security:
- Optional `CRON_SECRET` environment variable
- Authorization header validation
- Rate limiting (handled by Vercel)

### Data Security:
- Row Level Security enabled
- Input validation and sanitization
- Error handling without data exposure

## 🐛 Troubleshooting

### Common Issues:

1. **Analysis not running:**
   - Check Vercel cron job logs
   - Verify environment variables
   - Check database permissions

2. **Slow performance:**
   - Ensure database indexes are created
   - Reduce batch size if needed
   - Check Supabase performance

3. **No results:**
   - Verify investor data exists
   - Check company profile configuration
   - Review analysis algorithm weights

### Debug Mode:
Add logging to see detailed analysis:

```typescript
// In investor-analyzer.ts
console.log('Analyzing investor:', investor.investor_name);
console.log('Score breakdown:', { descriptionScore, overviewScore, typeScore });
```

## 📊 Monitoring

### Vercel Logs:
- Check Function Logs in Vercel dashboard
- Monitor execution time and memory usage
- Watch for errors and timeouts

### Database Monitoring:
- Track table growth
- Monitor query performance
- Check for failed inserts

## 🔄 Updates and Maintenance

### Regular Tasks:
1. **Update company profile** as your business evolves
2. **Review keyword lists** for relevance
3. **Monitor analysis quality** and adjust weights
4. **Clean old analysis data** if needed

### Algorithm Improvements:
- Add more scoring factors
- Implement machine learning models
- Include market trends and timing
- Add investor portfolio analysis

## 📞 Support

For issues or questions:
1. Check Vercel function logs
2. Review database queries
3. Test with smaller datasets first
4. Verify all environment variables are set 