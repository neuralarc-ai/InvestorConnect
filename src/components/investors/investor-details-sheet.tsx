"use client"

import { useState, useEffect } from "react"
import type { Investor } from "@/lib/types"
import { generatePersonalizedEmail, type GeneratePersonalizedEmailInput } from "@/ai/flows/generate-personalized-email"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wand2, Mail, Copy, Loader2, Send, Briefcase, Globe, Phone, User, Building, MapPin, TrendingUp, Info } from "lucide-react"

interface InvestorDetailsSheetProps {
  investor: Investor | null
  isOpen: boolean
  onClose: () => void
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function DetailLinkItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
    if (!value) return null;
    const href = value.startsWith('http') ? value : `https://${value}`;
    return (
      <div className="flex items-start">
        <Icon className="h-4 w-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="font-semibold">{label}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">
            {value}
          </a>
        </div>
      </div>
    )
  }

export function InvestorDetailsSheet({ investor, isOpen, onClose }: InvestorDetailsSheetProps) {
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setGeneratedEmail("")
      setIsLoading(false)
    }
  }, [isOpen])

  const handleGenerateEmail = async () => {
    if (!investor) return
    setIsLoading(true)
    setGeneratedEmail("")
    try {
      const input: GeneratePersonalizedEmailInput = {
        Contact_Person: investor.Contact_Person,
        Designation: investor.Designation || 'a leader',
        Investor_Name: investor.Investor_Name,
        Location: investor.Location || 'their region',
        ourCompanyName: "Our Awesome Startup",
        pitchSummary: "We are building a revolutionary platform to change the world."
      }
      const result = await generatePersonalizedEmail(input)
      setGeneratedEmail(result.emailContent)
      toast({ title: "Email Generated", description: "The personalized email is ready for review." })
    } catch (error) {
      console.error("Failed to generate email:", error)
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate the email." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmail = () => {
    toast({ title: "Email Sent (Mock)", description: `Email to ${investor?.Email} has been logged.` })
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail)
    toast({ title: "Copied to Clipboard" })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <ScrollArea className="h-full">
          {investor && (
            <>
              <SheetHeader className="p-6">
                <SheetTitle className="font-headline text-2xl">{investor.Contact_Person}</SheetTitle>
                <SheetDescription>{investor.Designation} at {investor.Investor_Name}</SheetDescription>
              </SheetHeader>
              <Separator />
              <div className="p-6 space-y-6">
                
                <Card>
                    <CardHeader><CardTitle className="text-lg font-headline">Contact Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem icon={Mail} label="Email" value={investor.Email} />
                        <DetailItem icon={Phone} label="Phone" value={investor.Phone} />
                        <DetailLinkItem icon={User} label="LinkedIn" value={investor.LinkedIn} />
                        <DetailLinkItem icon={Building} label="Company LinkedIn" value={investor.Company_LinkedIn} />
                        <DetailLinkItem icon={Globe} label="Website" value={investor.Website} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg font-headline">Investor Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <DetailItem icon={MapPin} label="Location" value={investor.Location} />
                           <DetailItem icon={Briefcase} label="Investor Type" value={investor.Investor_Type} />
                           <DetailItem icon={TrendingUp} label="Investment Score" value={investor.Investment_Score} />
                           <DetailItem icon={Info} label="Founded Year" value={investor.Founded_Year} />
                        </div>
                        <DetailItem icon={Info} label="Practice Areas" value={investor.Practice_Areas} />
                        <DetailItem icon={Info} label="Overview" value={investor.Overview} />
                        <DetailItem icon={Info} label="Description" value={investor.Description} />
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-headline">Generate Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={handleGenerateEmail} disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                      Generate Personalized Email
                    </Button>
                    
                    {generatedEmail && (
                      <div className="space-y-4 pt-4">
                        <Textarea
                          value={generatedEmail}
                          onChange={(e) => setGeneratedEmail(e.target.value)}
                          rows={15}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSendEmail}><Send/>Send Email (Mock)</Button>
                          <Button variant="outline" onClick={handleCopyToClipboard}><Copy/>Copy</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
