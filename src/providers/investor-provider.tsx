"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react"
import type { Investor } from "@/lib/types"
import { supabase } from "@/lib/supabaseClient"

interface InvestorContextType {
  groupedInvestors: Investor[][]
  filteredInvestors: Investor[][]
  totalGroups: number
  isLoading: boolean
  progress: number
  totalCount: number
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  pageSize: number
  setInvestors: React.Dispatch<React.SetStateAction<Investor[]>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  refreshInvestors: () => Promise<void>
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
  const [searchQuery, setSearchQuery] = useState("")
  const pageSize = PAGE_SIZE
  const [previewInvestors, setInvestors] = useState<Investor[]>([])

  // Filter investors based on search query
  const filteredInvestors = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedInvestors
    }
    
    const query = searchQuery.toLowerCase().trim()
    return groupedInvestors.filter(group => {
      const investor = group[0]
      return (
        (investor.investor_name?.toLowerCase().includes(query)) ||
        (investor.contact_person?.toLowerCase().includes(query)) ||
        (investor.designation?.toLowerCase().includes(query)) ||
        (investor.country?.toLowerCase().includes(query))
      )
    })
  }, [groupedInvestors, searchQuery])

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

  // Refresh investors function
  const refreshInvestors = useCallback(async () => {
    const records = await fetchAllBatches()
    const grouped = groupByCompany(records)
    setGroupedInvestors(grouped)
    setTotalGroups(grouped.length)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshInvestors()
  }, [refreshInvestors])

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  return (
    <InvestorContext.Provider value={{ 
      groupedInvestors, 
      filteredInvestors,
      totalGroups, 
      isLoading, 
      progress, 
      totalCount, 
      currentPage, 
      setCurrentPage, 
      pageSize, 
      setInvestors,
      searchQuery,
      setSearchQuery,
      refreshInvestors
    }}>
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
