"use client"

import { useState, useMemo } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Investor } from "@/lib/types"

export function InvestorDashboard() {
  const { investors } = useInvestors()
  const [selectedInvestorGroup, setSelectedInvestorGroup] = useState<Investor[] | null>(null)

  const groupedInvestors = useMemo(() => {
    if (!investors || investors.length === 0) {
      return []
    }
    const groups = new Map<string, Investor[]>()
    investors.forEach(investor => {
      const key = investor.Investor_Name
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(investor)
    })
    return Array.from(groups.values())
  }, [investors])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4">
        {investors.length > 0 ? (
          <div className="w-full">
            <div className="mb-8 max-w-4xl mx-auto">
              <p className="text-lg font-semibold mb-2">Import More Investors</p>
              <CsvUploader />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {groupedInvestors.map((group) => (
                <InvestorCard
                  key={group[0].Investor_Name}
                  investors={group}
                  onSelect={() => setSelectedInvestorGroup(group)}
                />
              ))}
            </div>
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
