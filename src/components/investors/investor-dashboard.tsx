"use client"

import { useState, useMemo, useEffect } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { CsvUploader } from "@/components/investors/csv-uploader"
import { InvestorCard } from "@/components/investors/investor-card"
import { InvestorDetailsSheet } from "@/components/investors/investor-details-sheet"
import { Header } from "@/components/shared/header"
import type { Investor } from "@/lib/types"
import { Button } from "@/components/ui/button"

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
  const { investors, setInvestors } = useInvestors()
  const [selectedInvestorGroup, setSelectedInvestorGroup] = useState<Investor[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Sanitize existing data on mount
  useEffect(() => {
    if (investors.length > 0) {
      const sanitizedInvestors = sanitizeInvestorData(investors);
      // Only update if there were changes
      const hasChanges = sanitizedInvestors.some((investor, index) => 
        JSON.stringify(investor) !== JSON.stringify(investors[index])
      );
      if (hasChanges) {
        console.log('Sanitizing existing investor data...');
        setInvestors(sanitizedInvestors);
      }
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const groupedInvestors = useMemo(() => {
    if (!investors || investors.length === 0) {
      return []
    }
    const groups = new Map<string, Investor[]>()
    investors.forEach(investor => {
      const key = sanitizeText(investor.Investor_Name)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(investor)
    })
    return Array.from(groups.values())
  }, [investors])
  
  const filteredInvestors = useMemo(() => {
    if (!searchQuery) return groupedInvestors;

    const lowercasedQuery = sanitizeText(searchQuery).toLowerCase();
    return groupedInvestors.filter(group => {
        const companyNameMatch = sanitizeText(group[0].Investor_Name).toLowerCase().includes(lowercasedQuery);
        const contactMatch = group.some(contact => 
            sanitizeText(contact.Contact_Person).toLowerCase().includes(lowercasedQuery) ||
            (contact.Designation && sanitizeText(contact.Designation).toLowerCase().includes(lowercasedQuery))
        );
        return companyNameMatch || contactMatch;
    });
  }, [groupedInvestors, searchQuery]);

  const paginatedInvestors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvestors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvestors, currentPage]);

  const totalPages = Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="flex-grow container mx-auto py-8 px-4">
        {investors.length > 0 ? (
          <div className="w-full">
            <div className="flex flex-wrap justify-center gap-6">
              {paginatedInvestors.map((group) => (
                <InvestorCard
                  key={group[0].Investor_Name}
                  investors={group}
                  onSelect={() => setSelectedInvestorGroup(group)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline">
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">
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
      </main>
      <InvestorDetailsSheet
        investors={selectedInvestorGroup}
        isOpen={!!selectedInvestorGroup}
        onClose={() => setSelectedInvestorGroup(null)}
      />
    </div>
  )
}
