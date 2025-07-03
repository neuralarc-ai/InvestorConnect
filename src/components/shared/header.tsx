"use client"

import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { LogOut, Rocket, Search, Plus, Building2, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddInvestorDialog } from "@/components/investors/add-investor-dialog"
import { useState } from "react"
import CompanyProfileDialog from "@/components/CompanyProfileDialog"
import { InvestorAnalysisDashboard } from "@/components/investors/investor-analysis-dashboard"

interface HeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { logout } = useAuth()
  const [isAddInvestorOpen, setIsAddInvestorOpen] = useState(false)
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)

  return (
    <>
      <header className="sticky w-full overflow-visible top-0 z-30 flex h-fit items-center justify-between gap-4 bg-card border-b border-border shadow-md">
        <div className="max-w-[1440px] mx-auto w-full flex h-14 items-center justify-center">
          <div className="flex items-center mr-8">
            <Rocket className="mr-2 h-6 w-6" />
            <span className="font-headline text-lg font-bold">InvestorConnect</span>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-background pl-8"
            />
          </div>
          <div className="flex items-center space-x-2 ml-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAddInvestorOpen(true)}
              aria-label="Add investor"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCompanyDialogOpen(true)}
              aria-label="Edit company profile"
            >
              <Building2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAnalysisOpen(true)}
              aria-label="View investor analysis"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <AddInvestorDialog 
        isOpen={isAddInvestorOpen} 
        onClose={() => setIsAddInvestorOpen(false)} 
      />
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
    </>
  )
}
