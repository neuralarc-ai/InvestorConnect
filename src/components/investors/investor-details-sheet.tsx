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
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Wand2, Mail, Copy, Loader2, Send, Briefcase, Globe, Phone, User, MapPin, TrendingUp, Info } from "lucide-react"

interface InvestorDetailsSheetProps {
  investors: Investor[] | null
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
        <p className="text-sm text-muted-foreground break-words">{value}</p>
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

type EmailState = {
  isLoading: boolean;
  content: string;
}

export function InvestorDetailsSheet({ investors: investorGroup, isOpen, onClose }: InvestorDetailsSheetProps) {
  const [emailStates, setEmailStates] = useState<Map<string, EmailState>>(new Map())
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setEmailStates(new Map())
    }
  }, [isOpen, investorGroup])

  const updateEmailState = (contactId: string, newState: Partial<EmailState>) => {
    setEmailStates(prev => {
      const newMap = new Map(prev)
      const currentState = newMap.get(contactId) || { isLoading: false, content: '' }
      newMap.set(contactId, { ...currentState, ...newState })
      return newMap
    })
  }

  const handleGenerateEmail = async (investor: Investor) => {
    const contactId = investor.Contact_Person;
    updateEmailState(contactId, { isLoading: true, content: '' })

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
      updateEmailState(contactId, { content: result.emailContent })
      toast({ title: "Email Generated", description: `Personalized email for ${contactId} is ready.` })
    } catch (error) {
      console.error("Failed to generate email:", error)
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate the email." })
    } finally {
      updateEmailState(contactId, { isLoading: false })
    }
  }

  const handleSendEmail = (email?: string) => {
    toast({ title: "Email Sent (Mock)", description: `Email to ${email} has been logged.` })
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({ title: "Copied to Clipboard" })
  }

  const handleTextChange = (contactId: string, value: string) => {
    updateEmailState(contactId, { content: value });
  }

  const primaryInvestor = investorGroup?.[0];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl p-0">
        <ScrollArea className="h-full">
          {primaryInvestor && investorGroup && (
            <>
              <SheetHeader className="p-6">
                <SheetTitle className="font-headline text-2xl">{primaryInvestor.Investor_Name}</SheetTitle>
                <SheetDescription>{investorGroup.length} contact{investorGroup.length > 1 ? 's' : ''} found at this firm.</SheetDescription>
              </SheetHeader>
              <Separator />
              <div className="p-6">
                <Accordion type="single" collapsible className="w-full" defaultValue={investorGroup[0].Contact_Person}>
                  {investorGroup.map((investor) => {
                    const contactId = investor.Contact_Person;
                    const emailState = emailStates.get(contactId) || { isLoading: false, content: '' };
                    
                    return (
                      <AccordionItem value={contactId} key={contactId}>
                        <AccordionTrigger className="font-semibold text-left text-lg">{investor.Contact_Person} - <span className="text-muted-foreground font-normal ml-2">{investor.Designation}</span></AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-6 pt-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg font-headline">Contact Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem icon={Mail} label="Email" value={investor.Email} />
                                    <DetailItem icon={Phone} label="Phone" value={investor.Phone} />
                                    <DetailLinkItem icon={User} label="LinkedIn" value={investor.LinkedIn} />
                                    <DetailLinkItem icon={Globe} label="Website" value={investor.Website} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-lg font-headline">Firm Details</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <DetailItem icon={MapPin} label="Location" value={investor.Location} />
                                      <DetailItem icon={Briefcase} label="Investor Type" value={investor.Investor_Type} />
                                      <DetailItem icon={TrendingUp} label="Investment Score" value={investor.Investment_Score} />
                                      <DetailItem icon={Info} label="Practice Areas" value={investor.Practice_Areas} />
                                    </div>
                                    <Separator />
                                    <DetailItem icon={Info} label="Overview" value={investor.Overview} />
                                </CardContent>
                            </Card>
            
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg font-headline">Generate Email</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <Button onClick={() => handleGenerateEmail(investor)} disabled={emailState.isLoading}>
                                  {emailState.isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                  Generate for {investor.Contact_Person}
                                </Button>
                                
                                {emailState.content && (
                                  <div className="space-y-4 pt-4">
                                    <Textarea
                                      value={emailState.content}
                                      onChange={(e) => handleTextChange(contactId, e.target.value)}
                                      rows={15}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button onClick={() => handleSendEmail(investor.Email)}><Send/>Send Email (Mock)</Button>
                                      <Button variant="outline" onClick={() => handleCopyToClipboard(emailState.content)}><Copy/>Copy</Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
