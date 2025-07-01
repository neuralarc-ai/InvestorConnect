"use client"

import { useState } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Investor } from "@/lib/types"

export function InvestorDashboard() {
  const { investors } = useInvestors()
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow container py-8 ${investors.length === 0 ? 'flex items-center justify-center' : ''}`}>
        {investors.length > 0 ? (
          <div className="w-full">
            <div className="mb-8">
              <p className="text-lg font-semibold mb-2">Import More Investors</p>
              <CsvUploader />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {investors.map((investor, index) => (
                <InvestorCard
                  key={`${investor.Investor_Name}-${index}`}
                  investor={investor}
                  onSelect={() => setSelectedInvestor(investor)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl text-center">
             <h2 className="text-3xl font-bold font-headline mb-4">Welcome to InvestorConnect</h2>
             <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
               Get started by uploading your investor list. Drag and drop a CSV file below or click to select one.
             </p>
            <CsvUploader />
          </div>
        )}
      </main>
      <InvestorDetailsSheet
        investor={selectedInvestor}
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
      />
    </div>
  )
}
