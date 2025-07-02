"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Investor } from "@/lib/types"
import { supabase } from "@/lib/supabaseClient"

interface InvestorContextType {
  groupedInvestors: Investor[][]
  totalGroups: number
  isLoading: boolean
  progress: number
  totalCount: number
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  pageSize: number
  setInvestors: React.Dispatch<React.SetStateAction<Investor[]>>
}

const InvestorContext = createContext<InvestorContextType | undefined>(undefined)

const PAGE_SIZE = 20
const BATCH_SIZE = 500

function groupByCompany(records: Investor[]): Investor[][] {
  const groupMap = new Map<string, Investor[]>()
  records.forEach((inv: Investor) => {
    const key = (inv.investor_name || '').trim().toLowerCase()
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(inv)
  })
  return Array.from(groupMap.values())
}

export function InvestorProvider({ children }: { children: ReactNode }) {
  const [groupedInvestors, setGroupedInvestors] = useState<Investor[][]>([])
  const [totalGroups, setTotalGroups] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = PAGE_SIZE
  const [previewInvestors, setInvestors] = useState<Investor[]>([])

  // Get total count from Supabase
  const getTotalCount = async () => {
    const { count } = await supabase
      .from('investors')
      .select('*', { count: 'exact', head: true })
    return count || 0
  }

  // Fetch all records in batches
  const fetchAllBatches = async () => {
    setIsLoading(true)
    setProgress(0)
    const total = await getTotalCount()
    setTotalCount(total)
    let allData: Investor[] = []
    const totalBatches = Math.ceil(total / BATCH_SIZE)
    for (let i = 0; i < totalBatches; i++) {
      const from = i * BATCH_SIZE
      const to = from + BATCH_SIZE - 1
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .range(from, to)
      if (error) {
        console.error(error)
        continue
      }
      allData = [...allData, ...(data || [])]
      const pct = Math.round(((i + 1) / totalBatches) * 100)
      setProgress(pct)
      // Artificial delay for refined progress bar
      await new Promise(res => setTimeout(res, 200))
    }
    return allData
  }

  useEffect(() => {
    (async () => {
      const records = await fetchAllBatches()
      const grouped = groupByCompany(records)
      setGroupedInvestors(grouped)
      setTotalGroups(grouped.length)
      setIsLoading(false)
    })()
  }, [])

  return (
    <InvestorContext.Provider value={{ groupedInvestors, totalGroups, isLoading, progress, totalCount, currentPage, setCurrentPage, pageSize, setInvestors }}>
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
