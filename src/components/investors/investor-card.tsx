"use client"

import type { Investor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { User, Briefcase, MapPin, ExternalLink, Users } from "lucide-react"

interface InvestorCardProps {
  investors: Investor[]
  onSelect: () => void
}

export function InvestorCard({ investors, onSelect }: InvestorCardProps) {
  if (!investors || investors.length === 0) {
    return null
  }
  const primaryInvestor = investors[0]
  const otherContactsCount = investors.length - 1

  const parseScore = (scoreString?: string): number => {
    if (!scoreString) return 0
    
    // Handle "X/Y" format
    if (scoreString.includes('/')) {
        const parts = scoreString.split('/');
        const score = parseInt(parts[0], 10);
        const maxScore = parseInt(parts[1], 10);
        if (isNaN(score) || isNaN(maxScore) || maxScore === 0) return 0;
        return (score / maxScore) * 100;
    }

    // Handle plain number format (assume out of 100)
    const score = parseFloat(scoreString);
    if (isNaN(score)) return 0;
    return Math.min(Math.max(score, 0), 100); // Clamp between 0 and 100
  };

  const investmentScoreValue = parseScore(primaryInvestor.Investment_Score)

  return (
    <div className="relative card-hover-border">
       <Card
        onClick={onSelect}
        className="cursor-pointer transition-all w-80 flex flex-col bg-card"
      >
        <CardHeader>
          <CardTitle className="font-headline tracking-tight flex items-start justify-between">
            <span className="line-clamp-2">{primaryInvestor.Investor_Name}</span>
            {primaryInvestor.Company_LinkedIn && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <a href={primaryInvestor.Company_LinkedIn} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground pt-1 space-y-1">
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{primaryInvestor.Contact_Person}</span>
            </div>
            {primaryInvestor.Designation && (
              <div className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                <span>{primaryInvestor.Designation}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">
            {primaryInvestor.Overview}
          </p>
          {investmentScoreValue > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">Investment Score</span>
                <span className="text-xs font-bold">{primaryInvestor.Investment_Score}</span>
              </div>
              <Progress value={investmentScoreValue} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          {primaryInvestor.Location &&
            <Badge variant="secondary" className="flex items-center">
              <MapPin className="mr-1.5 h-3 w-3" />
              {primaryInvestor.Location}
            </Badge>
          }
          {otherContactsCount > 0 &&
            <Badge variant="outline" className="flex items-center">
              <Users className="mr-1.5 h-3 w-3" />
              {otherContactsCount} more contact{otherContactsCount > 1 ? 's' : ''}
            </Badge>
          }
        </CardFooter>
      </Card>
    </div>
  )
}
