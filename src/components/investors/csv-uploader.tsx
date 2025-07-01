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

export function CsvUploader() {
  const { setInvestors } = useInvestors()
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [previewData, setPreviewData] = useState<Investor[]>([])

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
    const headers = originalHeaders.map(h => h.toLowerCase().replace(/[\s_]+/g, ''));

    const findIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h === name);
        if (index !== -1) return index;
      }
      return -1;
    };

    const requiredHeaders = {
      investorName: findIndex(['investorname']),
      contactPerson: findIndex(['contactperson']),
    };

    if (requiredHeaders.investorName === -1 || requiredHeaders.contactPerson === -1) {
      toast({
        variant: "destructive",
        title: "Invalid CSV Format",
        description: "CSV must contain 'Investor_Name' and 'Contact_Person' columns.",
      });
      return [];
    }

    const investors: Investor[] = lines.slice(1).map(line => {
      if (!line.trim()) return null;
      const values = parseLine(line);
      if (values.length !== originalHeaders.length) return null;

      const investor: Investor = {
        Investor_Name: '',
        Contact_Person: '',
      };

      originalHeaders.forEach((header, index) => {
        investor[header] = values[index] || '';
      });

      return investor;
    }).filter((investor): investor is Investor => investor !== null && !!investor.Investor_Name && !!investor.Contact_Person);

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
  
  const handleConfirm = () => {
    setInvestors(previewData)
    toast({ title: "Success", description: `${previewData.length} investors imported.` })
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
                    <TableCell>{investor.Investor_Name}</TableCell>
                    <TableCell>{investor.Contact_Person}</TableCell>
                    <TableCell>{investor.Location}</TableCell>
                    <TableCell>{investor.Investor_Type}</TableCell>
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
