"use client"

import { useState, useCallback } from "react"
import { useInvestors } from "@/providers/investor-provider"
import type { Company, Contact } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UploadCloud } from "lucide-react"

export function CsvUploader() {
  const { setCompanies } = useInvestors()
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [previewData, setPreviewData] = useState<Company[]>([])

  const parseCsv = (csvText: string): Company[] => {
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
                result.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField);
        return result;
    };

    const headers = parseLine(lines[0]).map(h => h.trim());

    // Find column index for required fields, allowing for variations in naming
    const findIndex = (possibleNames: string[]): number => {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => h.toLowerCase().replace(/\s+/g, '') === name);
            if (index !== -1) return index;
        }
        return -1;
    };

    const colIdx = {
        companyName: findIndex(['companyname', 'company name', 'company']),
        investorName: findIndex(['investorname', 'investor name', 'investor']),
        email: findIndex(['email', 'emailaddress']),
        companyDescription: findIndex(['companydescription', 'description']),
        investmentStage: findIndex(['investmentstage', 'stage']),
        pastInvestments: findIndex(['pastinvestments']),
    };
    
    if (colIdx.companyName === -1 || colIdx.investorName === -1) {
        toast({
            variant: "destructive",
            title: "Invalid CSV Format",
            description: "CSV must contain 'Company Name' and 'Investor Name' columns.",
        });
        return [];
    }

    const companyMap = new Map<string, Company>();

    lines.slice(1).forEach(line => {
      if (!line.trim()) return;

      const values = parseLine(line);
      if (values.length !== headers.length) {
          console.warn('Skipping malformed CSV row:', line);
          return;
      }
      
      const getVal = (index: number) => (index !== -1 ? values[index]?.trim() : '') || '';

      const companyName = getVal(colIdx.companyName);
      if (!companyName) return;

      const contact: Contact = {
        investorName: getVal(colIdx.investorName),
        email: getVal(colIdx.email),
      };
      // Add all original headers/values to contact object for full data access
      headers.forEach((header, index) => {
        contact[header] = values[index]?.trim() || '';
      });

      if (companyMap.has(companyName)) {
        companyMap.get(companyName)!.contacts.push(contact);
      } else {
        companyMap.set(companyName, {
          companyName: companyName,
          companyDescription: getVal(colIdx.companyDescription),
          investmentStage: getVal(colIdx.investmentStage),
          pastInvestments: getVal(colIdx.pastInvestments),
          contacts: [contact],
        });
      }
    });

    return Array.from(companyMap.values());
  }

  const handleFile = useCallback((file: File) => {
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        try {
          const parsedCompanies = parseCsv(text)
          if (parsedCompanies.length > 0) {
            setPreviewData(parsedCompanies)
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
  }, [toast, setCompanies])

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
  
  const handleConfirm = () => {
    setCompanies(previewData)
    toast({ title: "Success", description: `${previewData.length} companies imported.` })
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
          <p>{previewData.length} companies found. Please review before importing.</p>
          <ScrollArea className="h-[50vh] mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Investment Stage</TableHead>
                  <TableHead># Contacts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map(company => (
                  <TableRow key={company.companyName}>
                    <TableCell>{company.companyName}</TableCell>
                    <TableCell className="truncate max-w-xs">{company.companyDescription}</TableCell>
                    <TableCell>{company.investmentStage}</TableCell>
                    <TableCell>{company.contacts.length}</TableCell>
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
