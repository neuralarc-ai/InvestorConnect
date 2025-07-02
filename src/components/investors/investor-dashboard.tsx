"use client"

import { useState, useMemo, useEffect } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Investor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import React from "react"

// Cleaner function to sanitize text for byte-sensitive areas
function sanitizeText(input: string | undefined) {
  if (!input) return '';
  try {
    // More aggressive sanitization
    let sanitized = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    return sanitized;
  } catch (error) {
    console.warn('Text sanitization error:', error);
    return input.replace(/[^\x00-\x7F]/g, '');
  }
}

// Utility to sanitize all investor data
function sanitizeInvestorData(investors: Investor[]): Investor[] {
  return investors.map(investor => {
    const sanitized: Investor = { ...investor };
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      }
    });
    return sanitized;
  });
}

const ITEMS_PER_PAGE = 20;

// PaginationBar component
function PaginationBar({ currentPage, totalPages, onPageChange, pageRange = 10 }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void, pageRange?: number }) {
  if (totalPages <= 1) return null;
  const startPage = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);
  const pages = [];
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline">Previous</Button>
      <div className="flex gap-1">
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${page === currentPage ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <button
            onClick={() => onPageChange(endPage + 1)}
            className="w-9 h-9 rounded-lg border bg-white text-black border-gray-300 hover:bg-gray-100"
            aria-label="Next page range"
          >
            ...
          </button>
        )}
      </div>
      <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline">Next</Button>
      <span className="ml-4 text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
    </div>
  );
}

export function InvestorDashboard() {
  const { groupedInvestors, totalGroups, isLoading, progress, totalCount, currentPage, setCurrentPage, pageSize } = useInvestors()
  const [selectedInvestorGroup, setSelectedInvestorGroup] = useState<Investor[] | null>(null)
  const [countryFilter, setCountryFilter] = useState<string>("All")
  const [view, setView] = useState<'card' | 'list'>("card")

  // Get unique countries for dropdown
  const uniqueCountries = useMemo(() => {
    const set = new Set<string>()
    groupedInvestors.forEach(group => {
      const inv = group[0]
      if (inv.country) set.add(inv.country)
    })
    return ["All", ...Array.from(set).sort()]
  }, [groupedInvestors])

  // Filtering logic (only by country)
  const filteredGroups = useMemo(() => {
    let groups = groupedInvestors
    if (countryFilter !== "All") {
      groups = groups.filter(group => group[0].country === countryFilter)
    }
    return groups
  }, [groupedInvestors, countryFilter])

  const sortedGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) =>
      (a[0]?.investor_name || '').localeCompare(b[0]?.investor_name || '')
    )
  }, [filteredGroups])
  const totalPages = Math.ceil(sortedGroups.length / pageSize)
  const paginatedGroups = sortedGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // --- DUMMY DATA SECTION ---
  const [dummyInvestors, setDummyInvestors] = useState<any[]>([])
  const [isDummyLoading, setIsDummyLoading] = useState(true)
  const [dummyPage, setDummyPage] = useState(1)
  const dummyPageSize = 20

  useEffect(() => {
    async function fetchDummy() {
      setIsDummyLoading(true)
      try {
        const { data } = await supabase
          .from('investorsdummy')
          .select('*')
          .order('created_at', { ascending: false })
        setDummyInvestors(data || [])
      } finally {
        setIsDummyLoading(false)
      }
    }
    fetchDummy()
  }, [])

  // Group dummy investors by investor_name
  const groupedDummyInvestors = useMemo(() => {
    const map = new Map()
    dummyInvestors.forEach(inv => {
      const key = (inv.investor_name || '').trim().toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(inv)
    })
    return Array.from(map.values())
  }, [dummyInvestors])

  // Search and paginate dummy investors (country filter only)
  const filteredDummyGroups = useMemo(() => {
    let groups = groupedDummyInvestors
    if (countryFilter !== "All") {
      groups = groups.filter(group => group[0].country === countryFilter)
    }
    return groups
  }, [groupedDummyInvestors, countryFilter])

  const dummyTotalPages = Math.ceil(filteredDummyGroups.length / dummyPageSize)
  const paginatedDummyGroups = filteredDummyGroups.slice((dummyPage - 1) * dummyPageSize, dummyPage * dummyPageSize)

  // List view component
  function InvestorListView({ groups, onSelect }: { groups: Investor[][], onSelect: (group: Investor[]) => void }) {
    return (
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Investor Name</th>
              <th className="px-4 py-2 text-left">Contact Person</th>
              <th className="px-4 py-2 text-left">Designation</th>
              <th className="px-4 py-2 text-left">Country</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, idx) => {
              const inv = group[0]
              return (
                <tr key={inv.id || idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{inv.investor_name}</td>
                  <td className="px-4 py-2">{inv.contact_person}</td>
                  <td className="px-4 py-2">{inv.designation}</td>
                  <td className="px-4 py-2">{inv.country}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" onClick={() => onSelect(group)}>View</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header searchQuery={""} setSearchQuery={() => {}} />
      <main className="flex-grow container mx-auto py-8 px-4">
        {/* Filter Card (country only) */}
        <div className="bg-[#FAF9F6] border border-[#ECECEC] rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-lg">Filter Leads</span>
          </div>
          <div className="flex flex-row items-end gap-4 min-w-[300px]">
            <label className="text-sm font-medium mb-1" style={{ minWidth: '70px' }}>Country:</label>
            <select
              className="w-64 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 min-w-[180px] items-end justify-end">
            <div className="flex gap-2 mt-6 md:mt-0">
              <Button
                variant={view === 'card' ? 'default' : 'outline'}
                onClick={() => setView('card')}
                className="rounded-lg px-4"
              >
                Card View
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                onClick={() => setView('list')}
                className="rounded-lg px-4"
              >
                List View
              </Button>
            </div>
          </div>
        </div>
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
        ) : paginatedGroups.length > 0 ? (
          <div className="w-full">
            {view === 'card' ? (
              <div className="flex flex-wrap justify-center gap-6">
                {paginatedGroups.map((group, index) => (
                  <InvestorCard
                    key={`${group[0]?.investor_name?.toLowerCase().trim() || 'unknown'}-${index}`}
                    investors={group}
                    onSelect={() => setSelectedInvestorGroup(group)}
                  />
                ))}
              </div>
            ) : (
              <InvestorListView groups={paginatedGroups} onSelect={setSelectedInvestorGroup} />
            )}
            {totalPages > 1 && (
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageRange={10}
              />
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

        {/* --- DUMMY DATA SECTION --- */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-4">Investors (Dummy Table)</h2>
          {isDummyLoading ? (
            <div className="w-full flex flex-col justify-center items-center">
              <p className="mb-2 text-lg font-medium">Loading dummy investors…</p>
            </div>
          ) : paginatedDummyGroups.length > 0 ? (
            <div className="w-full">
              <div className="flex flex-wrap justify-center gap-6">
                {paginatedDummyGroups.map((group, index) => (
                  <InvestorCard
                    key={`dummy-${group[0]?.investor_name?.toLowerCase().trim() || 'unknown'}-${index}`}
                    investors={group}
                    onSelect={() => setSelectedInvestorGroup(group)}
                  />
                ))}
              </div>
              {dummyTotalPages > 1 && (
                <PaginationBar
                  currentPage={dummyPage}
                  totalPages={dummyTotalPages}
                  onPageChange={setDummyPage}
                  pageRange={10}
                />
              )}
            </div>
          ) : (
            <div className="w-full text-center mx-auto mt-8">
              <p className="text-muted-foreground">No dummy investors found.</p>
            </div>
          )}
        </div>
      </main>
      <InvestorDetailsSheet
        investors={selectedInvestorGroup}
        isOpen={!!selectedInvestorGroup}
        onClose={() => setSelectedInvestorGroup(null)}
      />
    </div>
  )
}
