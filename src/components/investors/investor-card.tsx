"use client"

import type { Company } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface InvestorCardProps {
  company: Company
  onSelect: () => void
}

export function InvestorCard({ company, onSelect }: InvestorCardProps) {
  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
    >
      <CardHeader>
        <CardTitle className="font-headline tracking-tight">{company.companyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {company.companyDescription}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{company.investmentStage}</Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1.5 h-4 w-4" />
            <span>{company.contacts.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
