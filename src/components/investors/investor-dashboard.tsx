"use client"

import { useState } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Company } from "@/lib/types"

export function InvestorDashboard() {
  const { companies } = useInvestors()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow container py-8 ${companies.length === 0 ? 'flex items-center justify-center' : ''}`}>
        {companies.length > 0 ? (
          <div className="w-full">
            <div className="mb-8">
              <p className="text-lg font-semibold mb-2">Import More Investors</p>
              <CsvUploader />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map((company) => (
                <InvestorCard
                  key={company.companyName}
                  company={company}
                  onSelect={() => setSelectedCompany(company)}
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
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  )
}
