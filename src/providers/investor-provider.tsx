"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"
import type { Investor } from "@/lib/types"

interface InvestorContextType {
  investors: Investor[]
  setInvestors: React.Dispatch<React.SetStateAction<Investor[]>>
}

const InvestorContext = createContext<InvestorContextType | undefined>(undefined)

export function InvestorProvider({ children }: { children: ReactNode }) {
  const [investors, setInvestors] = useState<Investor[]>([])

  return (
    <InvestorContext.Provider value={{ investors, setInvestors }}>
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
