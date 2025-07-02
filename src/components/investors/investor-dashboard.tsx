"use client"

import { useState, useMemo, useEffect } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Investor } from "@/lib/types"
import { Button } from "@/components/ui/button"

const ITEMS_PER_PAGE = 20;

export function InvestorDashboard() {
  const { groupedInvestors, totalGroups, isLoading, progress, totalCount, currentPage, setCurrentPage, pageSize } = useInvestors()
  const [selectedInvestorGroup, setSelectedInvestorGroup] = useState<Investor[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const totalPages = Math.ceil(totalGroups / pageSize)
  const paginatedGroups = groupedInvestors.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="flex flex-col min-h-screen">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="flex-grow container mx-auto py-8 px-4">
        {isLoading ? (
          <div className="w-full h-screen flex flex-col justify-center items-center">
            <p className="mb-2 text-lg font-medium">Loading {totalCount} records…</p>
            <div className="w-2/3 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-1">{progress}% complete</p>
          </div>
        ) : groupedInvestors.length > 0 ? (
          <div className="w-full">
            <div className="flex flex-wrap justify-center gap-6">
              {paginatedGroups.map((group, index) => (
                <InvestorCard
                  key={`${group[0]?.investor_name?.toLowerCase().trim() || 'unknown'}-${index}`}
                  investors={group}
                  onSelect={() => setSelectedInvestorGroup(group)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} variant="outline">
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} variant="outline">
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-2xl text-center mx-auto mt-16">
             <h2 className="text-3xl font-bold font-headline mb-4">Welcome to InvestorConnect</h2>
             <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
               Get started by uploading your investor list. Drag and drop a CSV file below or click to select one.
             </p>
            <CsvUploader />
          </div>
        )}
      </main>
      <InvestorDetailsSheet
        investors={selectedInvestorGroup}
        isOpen={!!selectedInvestorGroup}
        onClose={() => setSelectedInvestorGroup(null)}
      />
    </div>
  )
}
