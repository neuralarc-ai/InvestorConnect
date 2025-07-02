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

export function InvestorDashboard() {
  const { groupedInvestors, totalGroups, isLoading, progress, totalCount, currentPage, setCurrentPage, pageSize } = useInvestors()
  const [selectedInvestorGroup, setSelectedInvestorGroup] = useState<Investor[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter groups by search query (matches investor_name or contact_person)
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedInvestors;
    const q = searchQuery.toLowerCase();
    return groupedInvestors.filter(group => {
      const primary = group[0];
      return (
        (primary.investor_name && primary.investor_name.toLowerCase().includes(q)) ||
        (primary.contact_person && primary.contact_person.toLowerCase().includes(q))
      );
    });
  }, [groupedInvestors, searchQuery]);

  const totalPages = Math.ceil(filteredGroups.length / pageSize)
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // --- DUMMY DATA SECTION ---
  const [dummyInvestors, setDummyInvestors] = useState<any[]>([]);
  const [isDummyLoading, setIsDummyLoading] = useState(true);
  const [dummyPage, setDummyPage] = useState(1);
  const dummyPageSize = 20;

  useEffect(() => {
    async function fetchDummy() {
      setIsDummyLoading(true);
      try {
        const { data } = await supabase
          .from('investorsdummy')
          .select('*')
          .order('created_at', { ascending: false });
        setDummyInvestors(data || []);
      } finally {
        setIsDummyLoading(false);
      }
    }
    fetchDummy();
  }, []);

  // Group dummy investors by investor_name
  const groupedDummyInvestors = useMemo(() => {
    const map = new Map();
    dummyInvestors.forEach(inv => {
      const key = (inv.investor_name || '').trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(inv);
    });
    return Array.from(map.values());
  }, [dummyInvestors]);

  // Search and paginate dummy investors
  const filteredDummyGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedDummyInvestors;
    const q = searchQuery.toLowerCase();
    return groupedDummyInvestors.filter(group => {
      const primary = group[0];
      return (
        (primary.investor_name && primary.investor_name.toLowerCase().includes(q)) ||
        (primary.contact_person && primary.contact_person.toLowerCase().includes(q))
      );
    });
  }, [groupedDummyInvestors, searchQuery]);

  const dummyTotalPages = Math.ceil(filteredDummyGroups.length / dummyPageSize);
  const paginatedDummyGroups = filteredDummyGroups.slice((dummyPage - 1) * dummyPageSize, dummyPage * dummyPageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="flex-grow container mx-auto py-8 px-4">
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
            <div className="flex flex-wrap justify-center gap-6">
              {paginatedGroups.map((group, index) => (
                <InvestorCard
                  key={`${group[0]?.investor_name?.toLowerCase().trim() || 'unknown'}-${index}`}
                  investors={group}
                  onSelect={() => setSelectedInvestorGroup(group)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} variant="outline">
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} variant="outline">
                  Next
                </Button>
              </div>
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
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <Button onClick={() => setDummyPage((prev) => Math.max(prev - 1, 1))} disabled={dummyPage === 1} variant="outline">
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    Page {dummyPage} of {dummyTotalPages}
                  </span>
                  <Button onClick={() => setDummyPage((prev) => Math.min(prev + 1, dummyTotalPages))} disabled={dummyPage === dummyTotalPages} variant="outline">
                    Next
                  </Button>
                </div>
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
