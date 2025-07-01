"use client"

import type { Investor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Briefcase, MapPin, TrendingUp, ExternalLink } from "lucide-react"

interface InvestorCardProps {
  investor: Investor
  onSelect: () => void
}

export function InvestorCard({ investor, onSelect }: InvestorCardProps) {
  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
    >
      <CardHeader>
        <CardTitle className="font-headline tracking-tight flex items-start justify-between">
          <span className="line-clamp-2">{investor.Investor_Name}</span>
          {investor.LinkedIn && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            >
              <a href={investor.LinkedIn} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </CardTitle>
        <div className="text-sm text-muted-foreground pt-1 space-y-1">
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>{investor.Contact_Person}</span>
          </div>
          {investor.Designation && (
             <div className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              <span>{investor.Designation}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">
          {investor.Overview}
        </p>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        {investor.Location &&
          <Badge variant="secondary" className="flex items-center">
            <MapPin className="mr-1.5 h-3 w-3" />
            {investor.Location}
          </Badge>
        }
        {investor.Investment_Score &&
          <Badge variant="secondary" className="flex items-center">
            <TrendingUp className="mr-1.5 h-3 w-3" />
            {investor.Investment_Score}
          </Badge>
        }
      </CardFooter>
    </Card>
  )
}
