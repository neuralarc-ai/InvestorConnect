"use client"

import { useState } from "react"
import type { Company, Contact } from "@/lib/types"
import { generatePersonalizedEmail, type GeneratePersonalizedEmailInput } from "@/ai/flows/generate-personalized-email"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wand2, Mail, Copy, Loader2, Send } from "lucide-react"

interface InvestorDetailsSheetProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
}

export function InvestorDetailsSheet({ company, isOpen, onClose }: InvestorDetailsSheetProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateEmail = async () => {
    if (!company || !selectedContact) return
    setIsLoading(true)
    setGeneratedEmail("")
    try {
      const input: GeneratePersonalizedEmailInput = {
        investorName: selectedContact.investorName,
        companyName: company.companyName,
        companyDescription: company.companyDescription,
        investmentStage: company.investmentStage,
        pastInvestments: company.pastInvestments,
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
    // Mock sending email
    toast({ title: "Email Sent (Mock)", description: `Email to ${selectedContact?.email} has been logged.` })
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail)
    toast({ title: "Copied to Clipboard" })
  }

  const handleSheetClose = () => {
    onClose()
    setTimeout(() => {
      setSelectedContact(null)
      setGeneratedEmail("")
    }, 300) // Delay reset to allow sheet to close gracefully
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <ScrollArea className="h-full">
          {company && (
            <>
              <SheetHeader className="p-6">
                <SheetTitle className="font-headline text-2xl">{company.companyName}</SheetTitle>
                <SheetDescription>{company.companyDescription}</SheetDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">{company.investmentStage}</Badge>
                </div>
              </SheetHeader>
              <Separator />
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-headline">Contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {company.contacts.map((contact, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md cursor-pointer transition-colors ${selectedContact?.email === contact.email ? 'bg-accent' : 'hover:bg-accent/50'}`}
                          onClick={() => {
                            setSelectedContact(contact)
                            setGeneratedEmail("")
                          }}
                        >
                          <p className="font-semibold">{contact.investorName}</p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Mail className="mr-2 h-3 w-3" /> {contact.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedContact && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-headline">Generate Email</CardTitle>
                      <p className="text-sm text-muted-foreground">For: {selectedContact.investorName}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={handleGenerateEmail} disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
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
                            <Button onClick={handleSendEmail}><Send className="mr-2 h-4 w-4"/>Send Email (Mock)</Button>
                            <Button variant="outline" onClick={handleCopyToClipboard}><Copy className="mr-2 h-4 w-4"/>Copy</Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
