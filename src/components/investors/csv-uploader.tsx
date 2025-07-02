"use client"

import { useState, useCallback } from "react"
import { useInvestors } from "@/providers/investor-provider"
import type { Investor } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UploadCloud } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

const FIELD_MAP = {
  investor_name: [
    "Investor Name", "Name", "Name of Investor", "Investor", "Full Name", "Investor_FullName", "Lead Investor",
    "Primary Investor", "InvestorName", "Investor", "Investor Full Name", "Company", "Company Name", "Industry"
  ],
  contact_person: [
    "Contact Person", "Contact", "Contact Name", "POC", "Point of Contact", "Person", "Primary Contact", 
    "Representative", "Contact_Person", "Business Contact", "Applicant Contact"
  ],
  designation: [
    "Designation", "Title", "Position", "Role", "Job Title", "Employee Title", "Designation", "Investor Role", 
    "Contact Title", "Position Title", "Job Role"
  ],
  email: [
    "Email", "Email Address", "E-mail", "email_id", "Official Email", "Mail", "Primary Email", "Contact Email", 
    "Investor Email", "EmailAddress", "EmailID", "Email ID", "Email_Address", "E mail"
  ],
  phone: [
    "Phone", "Mobile", "Contact Number", "Phone No", "Phone Number", "Mobile No.", "Telephone", "Mobile Number", 
    "Investor Phone", "Cell", "Cell Phone", "PhoneNumber", "ContactPhone"
  ],
  website: [
    "Website", "Site", "Web URL", "Company Website", "Homepage", "Website URL", "Company_Site", "URL", 
    "WebsiteUrl", "WebSite", "Company Website URL"
  ],
  linkedin: [
    "Linkedin", "LinkedIn Profile", "Personal LinkedIn", "LinkedIn URL", "Linkedin_Profile", "LinkedIn (Personal)", 
    "Investor LinkedIn", "LinkedInId", "LinkedinURL", "LinkedInLink"
  ],
  company_linkedin: [
    "Company Linkedin", "LinkedIn Company", "Company Page", "LinkedIn Company Page", "CompanyLinkedIn", 
    "Org LinkedIn", "Organization LinkedIn", "Company LinkedIn URL"
  ],
  twitter: [
    "Twitter", "Twitter(X)", "X", "Twitter Handle", "X Handle", "X.com", "Twitter Profile", "XHandle", 
    "TwitterID", "X URL"
  ],
  facebook: [
    "Facebook", "FB", "FB Link", "Facebook URL", "Company Facebook", "Personal FB", "Facebook_Page", "FacebookURL", 
    "FBUrl", "FacebookProfile"
  ],
  country: [
    "Country", "Nation", "Location", "Region", "Country of Origin", "Headquarter Country", "Home Country", 
    "Investor Country", "CountryName", "Country Code", "Country/Region"
  ]
};

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function mapHeadersToDbColumns(headers: string[]): Record<string, number> {
  const headerMap: Record<string, number> = {};
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const dbCol in FIELD_MAP) {
    for (const possible of FIELD_MAP[dbCol]) {
      const idx = normalizedHeaders.findIndex(h => h === normalizeHeader(possible));
      if (idx !== -1) {
        headerMap[dbCol] = idx;
        break;
      }
    }
  }
  return headerMap;
}

const DB_COLUMNS = [
  "investor_name", "contact_person", "designation", "email", "phone", "website", "linkedin", "company_linkedin", "twitter", "facebook", "country"
];

  const parseCsv = (csvText: string): Investor[] => {
    const lines = csvText.trim().split(/\r\n?|\n/);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let currentField = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
            currentField += '"';
            i++; 
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      result.push(currentField.trim());
      return result;
    };

    const originalHeaders = parseLine(lines[0]);
  const headerMap = mapHeadersToDbColumns(originalHeaders);

  // Require at least investor_name and contact_person
  if (headerMap.investor_name === undefined || headerMap.contact_person === undefined) {
      toast({
        variant: "destructive",
        title: "Invalid CSV Format",
      description: "CSV must contain recognizable company/investor name and contact person columns.",
      });
      return [];
    }

    const investors: Investor[] = lines.slice(1).map(line => {
      if (!line.trim()) return null;
      const values = parseLine(line);
      if (values.length !== originalHeaders.length) return null;

    const investor: Investor = {} as Investor;
    DB_COLUMNS.forEach(col => {
      const idx = headerMap[col];
      investor[col] = idx !== undefined ? values[idx] || null : null;
      });
      return investor;
  }).filter((investor): investor is Investor => investor !== null && !!investor.investor_name && !!investor.contact_person);

    if (investors.length === 0 && lines.length > 1) {
      toast({
        variant: "destructive",
        title: "No Data Imported",
        description: "Could not parse any valid investor records. Please check column headers and data.",
      });
      return [];
    }

    return investors;
  }

export function CsvUploader() {
  const { setInvestors } = useInvestors()
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [previewData, setPreviewData] = useState<Investor[]>([])

  const handleFile = useCallback((file: File) => {
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        try {
          const parsedInvestors = parseCsv(text)
          if (parsedInvestors.length > 0) {
            setPreviewData(parsedInvestors)
          }
        } catch(error) {
          console.error("CSV Parsing failed", error);
          toast({ variant: "destructive", title: "Parsing Error", description: "An error occurred while parsing the file." })
        }
      }
      reader.readAsText(file)
    } else {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload a valid .csv file." })
    }
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }
  
  const handleConfirm = async () => {
    setInvestors(previewData)
    toast({ title: "Success", description: `${previewData.length} investors imported.` })
    // Supabase insert logic
    if (previewData.length > 0) {
      // Map to DB columns for Supabase
      const rows = previewData.map(inv => {
        const row: Record<string, any> = {};
        DB_COLUMNS.forEach(col => {
          row[col] = inv[col] || null;
        });
        return row;
      });
      const { error } = await supabase.from('investors').insert(rows);
      if (error) {
        toast({ variant: "destructive", title: "Supabase Error", description: error.message });
      }
    }
    setPreviewData([])
  }

  return (
    <>
      <div
        onDrop={handleDrop}
        onDragEnter={handleDragEvents}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}
      >
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-semibold">Drag & drop a .csv file here</p>
        <p className="text-sm text-muted-foreground">or click to select a file</p>
        <input
          type="file"
          accept=".csv, text/csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
      </div>

      <Dialog open={previewData.length > 0} onOpenChange={() => setPreviewData([])}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
          </DialogHeader>
          <p>{previewData.length} investors found. Please review before importing.</p>
          <ScrollArea className="h-[50vh] mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Investor Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((investor, index) => (
                  <TableRow key={index}>
                    <TableCell>{investor.investor_name}</TableCell>
                    <TableCell>{investor.contact_person}</TableCell>
                    <TableCell>{investor.country}</TableCell>
                    <TableCell>{investor.designation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewData([])}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm & Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
