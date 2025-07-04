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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

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
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
          const page = startPage + i;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`text-sm font-medium transition-colors ${page === currentPage ? 'bg-[#2B2521] text-white border border-[#2B2521] rounded-[4px] py-4 px-[27px]' : 'border border-[#2B2521] text-black bg-transparent hover:bg-[#2B2521]/10 rounded-[4px] py-4 px-[27px]'}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
        {endPage < totalPages && (
          <button
            onClick={() => onPageChange(endPage + 1)}
            className="border border-[#2B2521] text-black bg-transparent hover:bg-[#2B2521]/10 rounded-[4px] py-4 px-[27px] text-sm font-medium transition-colors"
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
  const { filteredInvestors, totalGroups, isLoading, progress, totalCount, currentPage, setCurrentPage, pageSize, searchQuery, setSearchQuery } = useInvestors()
  const [selectedInvestorGroup, setSelectedInvestorGroup] = useState<Investor[] | null>(null)
  const [countryFilter, setCountryFilter] = useState<string>("All")
  const [view, setView] = useState<'card' | 'list'>("card")

  // Get unique countries for dropdown
  const uniqueCountries = useMemo(() => {
    const set = new Set<string>()
    filteredInvestors.forEach(group => {
      const inv = group[0]
      if (inv.country) set.add(inv.country)
    })
    return ["All", ...Array.from(set).sort()]
  }, [filteredInvestors])

  // Filtering logic (only by country)
  const filteredGroups = useMemo(() => {
    let groups = filteredInvestors
    if (countryFilter !== "All") {
      groups = groups.filter(group => group[0].country === countryFilter)
    }
    return groups
  }, [filteredInvestors, countryFilter])

  const sortedGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) =>
      (a[0]?.investor_name || '').localeCompare(b[0]?.investor_name || '')
    )
  }, [filteredGroups])
  const totalPages = Math.ceil(sortedGroups.length / pageSize)
  const paginatedGroups = sortedGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="flex-grow container mx-auto py-8 px-4">
        {/* Filter Card (country only) - only show if there are investors */}
        {filteredInvestors.length > 0 && (
          <div className="rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 ">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-lg">Filter Leads</span>
              {searchQuery && (
                <span className="text-sm text-muted-foreground">
                  ({filteredInvestors.length} results for "{searchQuery}")
                </span>
              )}
            </div>
            <div className="flex flex-row items-end gap-4 min-w-[300px]">
              <label className="text-sm font-medium mb-1" style={{ minWidth: '70px' }}>Country:</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-64 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCountries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 min-w-[180px] items-end justify-end">
              <div className="flex gap-2 mt-6 md:mt-0">
                <Button
                  variant={view === 'card' ? 'toggle' : 'toggle-outline'}
                  size="toggle"
                  onClick={() => setView('card')}
                >
                  Card View
                </Button>
                <Button
                  variant={view === 'list' ? 'toggle' : 'toggle-outline'}
                  size="toggle"
                  onClick={() => setView('list')}
                >
                  List View
                </Button>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center mt-[20rem] gap-10">
            <div className="cube-loader">
              <div className="cube cube1"></div>
              <div className="cube cube2"></div>
              <div className="cube cube3"></div>
              <div className="cube cube4"></div>
            </div>
            <p className="text-sm mt-2">{progress}%</p>
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
          searchQuery ? (
            <div className="w-full max-w-2xl text-center mx-auto mt-16">
              <h2 className="text-2xl font-semibold text-muted-foreground">No company found</h2>
            </div>
          ) : (
            <div className="w-full max-w-2xl text-center mx-auto mt-16">
              <h2 className="text-3xl font-bold font-headline mb-4">Welcome to 86F</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Get started by uploading your investor list. Drag and drop a CSV file below or click to select one.
              </p>
              <CsvUploader />
            </div>
          )
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
