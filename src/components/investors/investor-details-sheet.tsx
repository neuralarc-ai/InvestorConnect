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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wand2, Mail, Copy, Loader2, Send, Briefcase, Globe, Phone, User, MapPin, TrendingUp, Info } from "lucide-react"

interface InvestorDetailsSheetProps {
  investors: Investor[] | null
  isOpen: boolean
  onClose: () => void
}

// Cleaner function to sanitize text for byte-sensitive areas
function sanitizeText(input: string | undefined) {
  if (!input) return '';
  try {
    // More aggressive sanitization
    let sanitized = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    return sanitized;
  } catch (error) {
    console.warn('Text sanitization error:', error);
    return input.replace(/[^\x00-\x7F]/g, '');
  }
}

// Generate a random 4-digit PIN
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
  if (!value) return null;
  const safeValue = sanitizeText(value);
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground break-words">{safeValue}</p>
      </div>
    </div>
  )
}

function DetailLinkItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
    if (!value) return null;
    const safeValue = sanitizeText(value);
    const href = safeValue.startsWith('http') ? safeValue : `https://${safeValue}`;
    return (
      <div className="flex items-start">
        <Icon className="h-4 w-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="font-semibold">{label}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 break-all">
            {safeValue}
          </a>
        </div>
      </div>
    )
  }

type EmailState = {
  isLoading: boolean;
  content: string;
  pin?: string;
}

// Individual Investor Dialog Component
function InvestorDialog({ 
  investor, 
  isOpen, 
  onClose, 
  emailState, 
  onGenerateEmail, 
  onSendEmail, 
  onCopyToClipboard, 
  onTextChange 
}: {
  investor: Investor;
  isOpen: boolean;
  onClose: () => void;
  emailState: EmailState;
  onGenerateEmail: (investor: Investor) => void;
  onSendEmail: (investor: Investor, content: string, pin?: string) => void;
  onCopyToClipboard: (content: string) => void;
  onTextChange: (contactId: string, value: string) => void;
}) {
  const contactId = sanitizeText(investor.Contact_Person);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline">
            {sanitizeText(investor.Contact_Person)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-headline">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={Mail} label="Email" value={investor.Email} />
              <DetailItem icon={Phone} label="Phone" value={investor.Phone} />
              <DetailLinkItem icon={User} label="LinkedIn" value={investor.LinkedIn} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-headline">Generate & Compose Email with Pitch Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> When you generate an email, it will automatically include:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                  <li>A personalized outreach message</li>
                  <li>Pitch deck access link and PIN</li>
                  <li>48-hour PIN expiry information</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => onGenerateEmail(investor)} 
                disabled={emailState.isLoading}
                className="w-full sm:w-auto"
              >
                {emailState.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Email with Pitch Access for {sanitizeText(investor.Contact_Person)}
                  </>
                )}
              </Button>
              
              {emailState.content && (
                <div className="space-y-4 pt-4">
                  {emailState.pin && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Generated PIN:</strong> <span className="font-mono text-lg font-bold">{emailState.pin}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This PIN will be saved to the database when you send the email.
                      </p>
                    </div>
                  )}
                  
                  <Textarea
                    value={emailState.content}
                    onChange={(e) => onTextChange(contactId, e.target.value)}
                    rows={15}
                    className="text-sm"
                    placeholder="Generated email content will appear here..."
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onSendEmail(investor, emailState.content, emailState.pin)}
                      disabled={!investor.Email}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onCopyToClipboard(emailState.content)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  {!investor.Email && (
                    <p className="text-sm text-muted-foreground">
                      No email address available for this contact.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InvestorDetailsSheet({ investors: investorGroup, isOpen, onClose }: InvestorDetailsSheetProps) {
  const [emailStates, setEmailStates] = useState<Map<string, EmailState>>(new Map())
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setEmailStates(new Map())
      setSelectedInvestor(null)
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
    const contactId = sanitizeText(investor.Contact_Person);
    updateEmailState(contactId, { isLoading: true, content: '' })

    try {
      // Generate PIN first
      const pin = generatePin();
      
      const input: GeneratePersonalizedEmailInput = {
        Contact_Person: sanitizeText(investor.Contact_Person),
        Designation: sanitizeText(investor.Designation) || 'a leader',
        Investor_Name: sanitizeText(investor.Investor_Name),
        Location: sanitizeText(investor.Location) || 'their region',
        ourCompanyName: "Our Awesome Startup",
        pitchSummary: "We are building a revolutionary platform to change the world."
      }
      
      // Additional safety check before sending to AI
      Object.keys(input).forEach(key => {
        const value = input[key as keyof GeneratePersonalizedEmailInput];
        if (typeof value === 'string' && value.length > 0) {
          // Check for any characters with code > 255
          for (let i = 0; i < value.length; i++) {
            const charCode = value.charCodeAt(i);
            if (charCode > 255) {
              console.warn(`Found problematic character at index ${i} in ${key}: ${charCode}`);
              // Re-sanitize this field
              input[key as keyof GeneratePersonalizedEmailInput] = sanitizeText(value);
              break;
            }
          }
        }
      });
      
      const result = await generatePersonalizedEmail(input)
      
      // Add pitch deck access information to the generated email
      const pitchUrl = process.env.NEXT_PUBLIC_PITCH_URL || 'https://your-pitch-deck-url.com';
      const pitchAccessSection = `

---
Pitch Deck Access

I've also attached access to our detailed pitch deck for your review:

Access Link: ${pitchUrl}
Your PIN: ${pin}

This PIN will expire in 48 hours for security purposes. Please let me know if you need any additional information or have questions about our pitch.

---
`;
      
      const emailWithPitchAccess = result.emailContent + pitchAccessSection;
      
      updateEmailState(contactId, { content: emailWithPitchAccess, pin })
      toast({ title: "Email Generated", description: `Personalized email for ${contactId} is ready with PIN: ${pin}` })
    } catch (error) {
      console.error("Failed to generate email:", error)
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate the email." })
    } finally {
      updateEmailState(contactId, { isLoading: false })
      
    }
  }

  const handleSendEmail = async (investor: Investor, emailContent: string, pin?: string) => {
    const subject = `Outreach from ${sanitizeText(investor.Investor_Name)}`;
    const to = sanitizeText(investor.Email);
    
    if (!to) {
      toast({ 
        variant: "destructive", 
        title: "No Email Address", 
        description: "This contact doesn't have an email address." 
      });
      return;
    }

    // If there's a PIN, save it to Supabase first
    if (pin) {
      try {
        const response = await fetch('/api/send-access-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: to, pin }),
        });

        const result = await response.json();
        if (!result.success) {
          console.warn('Failed to save PIN to database:', result.error);
        }
      } catch (error) {
        console.warn('Failed to save PIN to database:', error);
      }
    }

    // Create mailto link for actual email sending
    const body = encodeURIComponent(emailContent);
    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
    
    try {
      window.open(mailtoLink, '_blank');
      toast({ 
        title: "Email Client Opened", 
        description: `Email client opened for ${sanitizeText(investor.Contact_Person)}${pin ? ` with PIN: ${pin}` : ''}` 
      });
    } catch (error) {
      console.error("Failed to open email client:", error);
      toast({ 
        variant: "destructive", 
        title: "Email Error", 
        description: "Could not open email client. Please check your email settings." 
      });
    }
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({ title: "Copied to Clipboard" })
  }

  const handleTextChange = (contactId: string, value: string) => {
    updateEmailState(contactId, { content: value });
  }

  const handleCardClick = (investor: Investor) => {
    setSelectedInvestor(investor);
  };

  const handleDialogClose = () => {
    setSelectedInvestor(null);
  };

  const primaryInvestor = investorGroup?.[0];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-4xl p-0">
          <ScrollArea className="h-full">
            {primaryInvestor && investorGroup && (
              <>
                <SheetHeader className="p-6">
                  <SheetTitle className="font-headline text-2xl">{sanitizeText(primaryInvestor.Investor_Name)}</SheetTitle>
                  <SheetDescription>{investorGroup.length} contact{investorGroup.length > 1 ? 's' : ''} found at this firm.</SheetDescription>
                </SheetHeader>
                <Separator />
                <div className="p-6">
                  <Card className="mb-6">
                    <CardHeader><CardTitle className="text-lg font-headline">Company Details</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem icon={MapPin} label="Location" value={primaryInvestor.Location} />
                        <DetailItem icon={Briefcase} label="Investor Type" value={primaryInvestor.Investor_Type} />
                        <DetailItem icon={TrendingUp} label="Investment Score" value={primaryInvestor.Investment_Score} />
                        <DetailItem icon={Info} label="Practice Areas" value={primaryInvestor.Practice_Areas} />
                      </div>
                      <Separator />
                      <DetailItem icon={Info} label="Overview" value={primaryInvestor.Overview} />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {investorGroup.map((investor) => {
                      const contactId = sanitizeText(investor.Contact_Person);
                      
                      return (
                        <Card 
                          key={contactId}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleCardClick(investor)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-headline">
                              {sanitizeText(investor.Contact_Person)}
                            </CardTitle>
                            {investor.Designation && (
                              <p className="text-sm text-muted-foreground">
                                {sanitizeText(investor.Designation)}
                              </p>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {investor.Email && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 mr-2" />
                                <span className="truncate">{sanitizeText(investor.Email)}</span>
                              </div>
                            )}
                            {investor.Phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 mr-2" />
                                <span>{sanitizeText(investor.Phone)}</span>
                              </div>
                            )}
                                                         {investor.Location && (
                               <div className="flex items-center text-sm text-muted-foreground">
                                 <MapPin className="h-4 w-4 mr-2" />
                                 <span>{sanitizeText(investor.Location)}</span>
                               </div>
                             )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Individual Investor Dialog */}
      {selectedInvestor && (
        <InvestorDialog
          investor={selectedInvestor}
          isOpen={!!selectedInvestor}
          onClose={handleDialogClose}
          emailState={emailStates.get(sanitizeText(selectedInvestor.Contact_Person)) || { isLoading: false, content: '' }}
          onGenerateEmail={handleGenerateEmail}
          onSendEmail={handleSendEmail}
          onCopyToClipboard={handleCopyToClipboard}
          onTextChange={handleTextChange}
        />
      )}
    </>
  )
}
