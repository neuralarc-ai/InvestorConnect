"use client"

import type { Investor } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { User, Briefcase, MapPin, ExternalLink, Users } from "lucide-react"

// Cleaner function to sanitize text for byte-sensitive areas
function sanitizeText(input: string | number | undefined | null) {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

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

  const parseScore = (scoreValue?: string | number): number => {
    if (scoreValue === undefined || scoreValue === null) return 0;
    if (typeof scoreValue === "number") return Math.min(Math.max(scoreValue, 0), 100);
    if (typeof scoreValue === "string") {
      if (scoreValue.includes('/')) {
        const parts = scoreValue.split('/');
        const score = parseInt(parts[0], 10);
        const maxScore = parseInt(parts[1], 10);
        if (isNaN(score) || isNaN(maxScore) || maxScore === 0) return 0;
        return (score / maxScore) * 100;
      }
      const score = parseFloat(scoreValue);
      if (isNaN(score)) return 0;
      return Math.min(Math.max(score, 0), 100);
    }
    return 0;
  };

  const investmentScoreValue = parseScore(primaryInvestor.investment_score);

  return (
    <div className="relative">
      <Card
        onClick={onSelect}
        className="cursor-pointer transition-all w-80 min-h-[20rem] max-h-[20rem] flex flex-col bg-card p-4 shadow-sm border border-border rounded-xl"
        style={{ display: 'flex', flexDirection: 'column', height: '20rem' }}
      >
        <CardHeader className="p-0 pb-2 flex flex-col gap-y-1">
          <CardTitle className="font-headline tracking-tight flex items-start justify-between text-lg leading-tight min-h-[2.5rem]">
            <span className="line-clamp-2">{sanitizeText(primaryInvestor.investor_name)}</span>
            {primaryInvestor.company_linkedin && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <a href={sanitizeText(primaryInvestor.company_linkedin)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground flex flex-col gap-y-1">
            <div className="flex items-center gap-x-2">
              <User className="h-4 w-4" />
              <span className="truncate">{sanitizeText(primaryInvestor.contact_person)}</span>
            </div>
            {primaryInvestor.designation && (
              <div className="flex items-center gap-x-2">
                <Briefcase className="h-4 w-4" />
                <span className="truncate">{sanitizeText(primaryInvestor.designation)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between p-0">
          <p className="text-sm text-muted-foreground line-clamp-2 h-[2.5rem] mb-2">
            {sanitizeText(primaryInvestor.overview)}
          </p>
          {investmentScoreValue > 0 && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">Investment Score</span>
                <span className="text-xs font-bold">{sanitizeText(primaryInvestor.investment_score)}</span>
              </div>
              <Progress value={investmentScoreValue} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 mt-auto p-0 pt-2">
          {primaryInvestor.location &&
            <Badge variant="secondary" className="flex items-center">
              <MapPin className="mr-1.5 h-3 w-3" />
              {sanitizeText(primaryInvestor.location)}
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
