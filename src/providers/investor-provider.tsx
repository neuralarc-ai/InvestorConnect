"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"
import type { Company } from "@/lib/types"

interface InvestorContextType {
  companies: Company[]
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>
}

const InvestorContext = createContext<InvestorContextType | undefined>(undefined)

export function InvestorProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])

  return (
    <InvestorContext.Provider value={{ companies, setCompanies }}>
      {children}
    </InvestorContext.Provider>
  )
}

export function useInvestors() {
  const context = useContext(InvestorContext)
  if (context === undefined) {
    throw new Error("useInvestors must be used within an InvestorProvider")
  }
  return context
}
