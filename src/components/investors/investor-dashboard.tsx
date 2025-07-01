"use client"

import { useState } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Company } from "@/lib/types"
import { FileUp, Users } from "lucide-react"

export function InvestorDashboard() {
  const { companies } = useInvestors()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  return (
    <>
      <Header />
      <main className="container py-8">
        <CsvUploader />
        {companies.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {companies.map((company) => (
              <InvestorCard
                key={company.companyName}
                company={company}
                onSelect={() => setSelectedCompany(company)}
              />
            ))}
          </div>
        ) : (
           <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full border border-dashed p-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold font-headline">No Investors Yet</h2>
            <p className="mt-2 text-muted-foreground">Upload a CSV file to get started.</p>
             <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <FileUp className="mr-2 h-4 w-4" />
              <span>Use the uploader above to add your investor list.</span>
            </div>
          </div>
        )}
      </main>
      <InvestorDetailsSheet
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </>
  )
}
