"use client"

import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut, Rocket, Search, Plus, Building2, TrendingUp, History, X, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddInvestorDialog } from "@/components/investors/add-investor-dialog"
import { useState, useEffect } from "react"
import CompanyProfileDialog from "@/components/CompanyProfileDialog"
import { InvestorAnalysisDashboard } from "@/components/investors/investor-analysis-dashboard"
import { supabase } from "@/lib/supabaseClient"
import Image from 'next/image'
import { CsvUploader } from "@/components/investors/csv-uploader"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { logout } = useAuth()
  const [isAddInvestorOpen, setIsAddInvestorOpen] = useState(false)
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false)
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [emailHistory, setEmailHistory] = useState<any[]>([])

  useEffect(() => {
    if (isHistoryOpen) {
      supabase
        .from('email_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50)
        .then(async ({ data }) => {
          if (!data) return setEmailHistory([])
          // For records missing company_name, fetch from investors
          const updated = await Promise.all(data.map(async (row) => {
            if (row.company_name) return row
            // Try to find company name by email
            const { data: investorData } = await supabase
              .from('investors')
              .select('investor_name')
              .eq('email', row.email)
              .limit(1)
              .single()
            return {
              ...row,
              company_name: investorData?.investor_name || '-',
            }
          }))
          setEmailHistory(updated)
        })
    }
  }, [isHistoryOpen])

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <>
      <header className="sticky w-full overflow-visible top-0 z-30 flex h-fit items-center justify-between gap-4 bg-[hsl(48,33%,98%)] border-b border-[#E0E0E0] ">
        <div className="w-full flex h-14 items-center mx-auto">
          {/* Logo */}
          <div className="flex items-center">
            <Image src="/F.png" alt="Logo" width={50} height={50} className="ml-[6rem]" />
          </div>
          {/* Search Bar + Action Icons */}
          <div className="flex items-center flex-1 justify-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by company name or contact person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-background pl-8 pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsAddInvestorOpen(true)}
                      aria-label="Add investor"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Investor</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCsvUploadOpen(true)}
                      aria-label="Upload CSV"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload CSV</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCompanyDialogOpen(true)}
                      aria-label="Edit company profile"
                    >
                      <Building2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Company Details</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAnalysisOpen(true)}
                      aria-label="View investor analysis"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Top Investors</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsHistoryOpen(true)}
                      aria-label="View email history"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sent Emails</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </header>
      
      <AddInvestorDialog 
        isOpen={isAddInvestorOpen} 
        onClose={() => setIsAddInvestorOpen(false)} 
      />
      {isCsvUploadOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-background rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Upload Investors CSV</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCsvUploadOpen(false)}
                  aria-label="Close CSV Upload"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <CsvUploader />
              </div>
            </div>
          </div>
        </div>
      )}
      <CompanyProfileDialog
        open={isCompanyDialogOpen}
        onOpenChange={setIsCompanyDialogOpen}
        isEditable={true}
      />
      {isAnalysisOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-7xl h-[90vh] bg-background rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Investor Analysis</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAnalysisOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-full overflow-y-auto p-4">
                <InvestorAnalysisDashboard />
              </div>
            </div>
          </div>
        </div>
      )}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-background rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Email History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsHistoryOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-96 overflow-y-auto p-4">
                {emailHistory.length === 0 ? (
                  <p className="text-muted-foreground">No email history found.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Company</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailHistory.map((row, idx) => (
                        <tr key={row.id || idx} className="border-t">
                          <td className="px-4 py-2">{row.contact_person}</td>
                          <td className="px-4 py-2">{row.company_name || '-'}</td>
                          <td className="px-4 py-2">{row.email}</td>
                          <td className="px-4 py-2">{row.sent_at ? new Date(row.sent_at).toLocaleString() : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
