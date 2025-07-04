"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { 
  TrendingUp, 
  Users, 
  Star, 
  Filter, 
  RefreshCw, 
  ExternalLink,
  Mail,
  Building2,
  MapPin,
  Target
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface AnalysisData {
  id: string
  investor_id: number
  top_rated: boolean
  reason: string
  score: number
  created_at: string
  investor: {
    id: number
    investor_name: string
    contact_person: string
    designation?: string
    email?: string
    country?: string
    investor_type?: string
    overview?: string
    investment_score?: number
  }
}

interface AnalysisResponse {
  success: boolean
  data: AnalysisData[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function InvestorAnalysisDashboard() {
  const { toast } = useToast()
  const [analyses, setAnalyses] = useState<AnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Track last batch processed for progressive analysis
  const [lastBatchProcessed, setLastBatchProcessed] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const BATCH_SIZE = 10
  const NUM_BATCHES = 10

  // Investor details sheet state
  const [selectedGroup, setSelectedGroup] = useState<AnalysisData[] | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)

  // Fetch analysis data
  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Fetch all top-rated
        sort_by: 'score',
        sort_order: 'desc',
        top_rated: 'true',
      })
      const response = await fetch(`/api/investor-analysis?${params}`)
      const data: AnalysisResponse = await response.json()
      if (data.success) {
        setAnalyses(data.data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch analysis data"
        })
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch analysis data"
      })
    } finally {
      setLoading(false)
    }
  }

  // Trigger full analysis refresh
  const triggerAnalysis = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/cron/analyze-investors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Analysis Complete",
          description: `Analyzed ${data.summary.totalAnalyzed} investors in ${data.summary.batchInfo.totalBatches} batches. Found ${data.summary.topRatedCount} top-rated investors.`
        })
        fetchAnalysis() // Refresh the data
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: data.error || "Failed to run analysis"
        })
      }
    } catch (error) {
      console.error('Error triggering analysis:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to trigger analysis"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Trigger micro-batch analysis
  const triggerBatchAnalysis = async (batchNumber: number, batchSize: number = 10) => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/cron/analyze-investors-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchNumber,
          batchSize,
          clearExisting: false
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Micro-Batch Analysis Complete",
          description: `Micro-batch ${data.summary.batchNumber} complete. Analyzed ${data.summary.totalAnalyzed} investors. Found ${data.summary.topRatedCount} top-rated investors.`
        })
        fetchAnalysis() // Refresh the data
      } else {
        toast({
          variant: "destructive",
          title: "Micro-Batch Analysis Failed",
          description: data.error || "Failed to run micro-batch analysis"
        })
      }
    } catch (error) {
      console.error('Error triggering micro-batch analysis:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to trigger micro-batch analysis"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Trigger progressive analysis (multiple micro-batches)
  const triggerProgressiveAnalysis = async () => {
    try {
      setRefreshing(true)
      toast({
        title: "Starting Progressive Analysis",
        description: `Processing ${NUM_BATCHES} micro-batches starting from batch ${lastBatchProcessed + 1}...`
      });
      const response = await fetch('/api/cron/analyze-investors-progressive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startBatch: lastBatchProcessed,
          numBatches: NUM_BATCHES,
          batchSize: BATCH_SIZE,
          clearExisting: false,
          delayBetweenBatches: 500
        })
      })
      const data = await response.json()
      if (data.success) {
        const summary = data.summary;
        toast({
          title: "Progressive Analysis Complete",
          description: `Processed ${summary.totalProcessed} investors across ${summary.batchesProcessed} micro-batches. Found ${summary.totalTopRated} top-rated investors.`
        });
        setLastBatchProcessed(lastBatchProcessed + NUM_BATCHES)
        fetchAnalysis() // Refresh the data
      } else {
        toast({
          variant: "destructive",
          title: "Progressive Analysis Failed",
          description: data.error || "Failed to run progressive analysis"
        });
      }
    } catch (error) {
      console.error('Error triggering progressive analysis:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to trigger progressive analysis"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch total investor count and batches
  const fetchBatchInfo = async () => {
    try {
      const response = await fetch(`/api/cron/analyze-investors-progressive?batch_size=${BATCH_SIZE}&num_batches=${NUM_BATCHES}`)
      const data = await response.json()
      if (data.success) {
        setTotalBatches(data.data.totalBatches)
      }
    } catch (error) {
      console.error('Error fetching batch info:', error)
    }
  }

  useEffect(() => {
    fetchAnalysis()
    fetchBatchInfo()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
  }

  // Group analyses by investor name (company/fund)
  const groupedAnalyses = useMemo(() => {
    const map = new Map<string, AnalysisData[]>();
    analyses.forEach(analysis => {
      const key = analysis.investor.investor_name?.trim().toLowerCase() || 'unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(analysis);
    });
    return Array.from(map.values());
  }, [analyses]);

  // Handle card click to open investor details
  const handleCardClick = async (group: AnalysisData[]) => {
    // Fetch full investor info for each contact in the group
    const ids = group.map(a => a.investor_id).filter(Boolean)
    const { data: fullInvestors, error } = await supabase
      .from('investors')
      .select('*')
      .in('id', ids)
    if (error) {
      setSelectedGroup([])
      setIsDetailsSheetOpen(true)
      return
    }
    // Map to preserve order and fill missing with partial
    const fullGroup = group.map(a => fullInvestors?.find(inv => inv.id === a.investor_id) || a.investor)
    setSelectedGroup(fullGroup)
    setIsDetailsSheetOpen(true)
  }

  // Handle closing the details sheet
  const handleCloseDetailsSheet = () => {
    setIsDetailsSheetOpen(false);
    setSelectedGroup(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Investor Analysis</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered analysis of {pagination.totalCount} investors based on your company profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={triggerProgressiveAnalysis}
            disabled={refreshing || lastBatchProcessed >= totalBatches}
            variant={lastBatchProcessed >= totalBatches ? 'toggle-outline' : 'toggle'}
            size="toggle"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Running...' : lastBatchProcessed >= totalBatches ? 'All Batches Complete' : 'Analyze-10 Batches'}
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analysis results...</p>
          </div>
        </div>
      ) : groupedAnalyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">No top-rated investors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupedAnalyses.map((group) => {
            const main = group[0];
            // Get all unique contact names for this group
            const contactNames = Array.from(new Set(group.map(a => a.investor.contact_person).filter(Boolean)));
            return (
              <Card
                key={main.investor.investor_name}
                className="h-full cursor-pointer"
                onClick={() => handleCardClick(group)}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold line-clamp-1">{main.investor.investor_name}</h3>
                      {group.some(a => a.top_rated) && (
                        <Badge variant="default" className="bg-yellow-500 text-black flex-shrink-0">
                          <Star className="h-3 w-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm line-clamp-1">{contactNames.slice(0, 2).join(', ')}{contactNames.length > 2 ? `, +${contactNames.length - 2} more` : ''}</span>
                      </div>
                      {main.investor.designation && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm line-clamp-1">{main.investor.designation}</span>
                        </div>
                      )}
                      {main.investor.country && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm line-clamp-1">{main.investor.country}</span>
                        </div>
                      )}
                      {main.investor.investor_type && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm line-clamp-1">{main.investor.investor_type}</span>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Match Score</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getScoreColor(main.score)}>
                            {main.score}/100
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getScoreLabel(main.score)}
                          </span>
                        </div>
                      </div>
                      <Progress value={main.score} className="h-2" />
                    </div>
                    {main.reason && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        <strong>Analysis:</strong> {main.reason}
                      </p>
                    )}
                    {main.investor.overview && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {main.investor.overview}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Investor Details Sheet */}
      {selectedGroup && (
        <InvestorDetailsSheet
          investors={selectedGroup}
          isOpen={isDetailsSheetOpen}
          onClose={handleCloseDetailsSheet}
          deduplicateContacts={true}
        />
      )}
    </div>
  )
} 