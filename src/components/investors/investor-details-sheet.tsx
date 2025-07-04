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
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"

interface InvestorDetailsSheetProps {
  investors: Investor[] | null
  isOpen: boolean
  onClose: () => void
  deduplicateContacts?: boolean // Add this prop
}

// Cleaner function to sanitize text for byte-sensitive areas
function sanitizeText(input: string | number | undefined | null) {
  if (input === undefined || input === null) return '';
  const str = String(input);
  try {
    let sanitized = str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    return sanitized;
  } catch (error) {
    console.warn('Text sanitization error:', error);
    return str.replace(/[^\x00-\x7F]/g, '');
  }
}

// Generate a random 4-digit PIN
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number }) {
  if (value === undefined || value === null) return null;
  const safeValue = sanitizeText(value);
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground break-words">{safeValue || 'N/A'}</p>
      </div>
    </div>
  )
}

function DetailLinkItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number }) {
  if (value === undefined || value === null) return null;
  const safeValue = sanitizeText(value);
  const href = safeValue.startsWith('http') ? safeValue : `https://${safeValue}`;
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 break-all">
          {safeValue || 'N/A'}
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
  const contactId = sanitizeText(String(investor.contact_person)) || String(investor.email) || String(investor.id) || `contact-fallback`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline">
            {sanitizeText(String(investor.contact_person))}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-headline">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem icon={Mail} label="Email" value={String(investor.email) || 'N/A'} />
              <DetailItem icon={Phone} label="Phone" value={String(investor.phone) || 'N/A'} />
              <DetailLinkItem icon={User} label="LinkedIn" value={String(investor.linkedin) || 'N/A'} />
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
                    Generate Email with Pitch Access for {sanitizeText(String(investor.contact_person))}
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
                  
                  <div className="mt-4">
                    <div className="font-semibold mb-2">Preview:</div>
                    <div className="border rounded p-4 bg-white">
                      <div className="fustat-variable" dangerouslySetInnerHTML={{ __html: emailState.content }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onSendEmail(investor, emailState.content, emailState.pin)}
                      disabled={!String(investor.email)}
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
                  {!String(investor.email) && (
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

export function InvestorDetailsSheet({ investors: investorGroup, isOpen, onClose, deduplicateContacts = false }: InvestorDetailsSheetProps) {
  const [emailStates, setEmailStates] = useState<Map<string, EmailState>>(new Map())
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null)
  const { toast } = useToast()
  const [emailHistory, setEmailHistory] = useState<any[]>([])

  // Deduplicate contacts if requested (for match analysis dashboard)
  const contactsToShow = investorGroup
    ? deduplicateContacts
      ? Array.from(
          new Map(
            investorGroup.map(inv => [
              `${inv.contact_person?.toLowerCase().trim()}|${inv.email?.toLowerCase().trim()}`,
              inv
            ])
          ).values()
        )
      : investorGroup
    : [];

  const primaryInvestor = contactsToShow?.[0];

  useEffect(() => {
    if (!isOpen) {
      setEmailStates(new Map());
      setSelectedInvestor(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && investorGroup && investorGroup.length > 0) {
      // Fetch email history for these contacts
      const emails = investorGroup.map(inv => inv.email).filter(Boolean)
      if (emails.length > 0) {
        supabase
          .from('email_history')
          .select('*')
          .in('email', emails)
          .then(({ data }) => setEmailHistory(data || []))
      }
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

  const handleGenerateEmail = async (investor: Investor, contactId: string) => {
    updateEmailState(contactId, { isLoading: true, content: '' })

    try {
      // Generate PIN first
      const pin = generatePin();
      
      const input: GeneratePersonalizedEmailInput = {
        Contact_Person: sanitizeText(String(investor.contact_person)),
        Designation: sanitizeText(String(investor.designation)) || 'a leader',
        Investor_Name: sanitizeText(String(investor.investor_name)),
        Location: sanitizeText(String(investor.location)) || 'their region',
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
      
      console.log('Generated email content:', result.emailContent);
      console.log('Generated PIN:', pin);
      
      // Replace the PIN placeholder with the actual PIN - try multiple possible formats
      let emailWithPin = result.emailContent;
      
      // Try different possible placeholder formats
      const pinPlaceholders = [
        '[PIN_PLACEHOLDER]',
        '[PIN will be added automatically]',
        'INVESTOR_PIN',
        '[PIN]',
        'PIN_PLACEHOLDER'
      ];
      
      for (const placeholder of pinPlaceholders) {
        if (emailWithPin.includes(placeholder)) {
          emailWithPin = emailWithPin.replace(placeholder, pin);
          console.log(`Replaced placeholder "${placeholder}" with PIN: ${pin}`);
          break;
        }
      }
      
      // If no placeholder found, try to find and replace any line containing "PIN:" with the actual PIN
      if (!emailWithPin.includes(pin)) {
        const lines = emailWithPin.split('\n');
        const updatedLines = lines.map(line => {
          if (line.includes('PIN:') && !line.includes(pin)) {
            // Replace any text after "PIN:" with the actual PIN
            const pinIndex = line.indexOf('PIN:');
            const beforePin = line.substring(0, pinIndex + 4); // Include "PIN:"
            return `${beforePin} ${pin}`;
          }
          return line;
        });
        emailWithPin = updatedLines.join('\n');
      }
      
      console.log('Email after PIN replacement:', emailWithPin);
      
      // Final safety check: if PIN is still not in the email, add it manually
      if (!emailWithPin.includes(pin)) {
        console.log('PIN not found in email, adding manually');
        // Find the line with pitch deck URL and add PIN after it
        const lines = emailWithPin.split('\n');
        const updatedLines = lines.map((line, index) => {
          if (line.includes('https://pitch.neuralarc.ai')) {
            // Add PIN line after the pitch deck URL line
            return line + '\n\nTo access exclusive investor materials, please use the following PIN: ' + pin;
          }
          return line;
        });
        emailWithPin = updatedLines.join('\n');
        console.log('Email after manual PIN addition:', emailWithPin);
      }
      
      // Convert the email content to proper HTML format
      const emailHtml = emailWithPin
        .split('\n')
        .map(line => {
          if (line.trim() === '') return '<br>';
          if (line.includes('Dear') && line.includes(',')) {
            return `<p style="margin: 0 0 16px 0;">${line}</p>`;
          }
          if (line.includes('Best regards,')) {
            return `<p style="margin: 16px 0 8px 0;"><strong>${line}</strong></p>`;
          }
          if (line.startsWith('[') && line.endsWith(']')) {
            return `<p style="margin: 4px 0; color: #666;">${line}</p>`;
          }
          if (line.includes('PIN:') && line.includes(pin)) {
            return `<p style="margin: 16px 0;">${line.replace(pin, `<span style="font-size: 18px; font-weight: bold; color: #28a745; letter-spacing: 2px;">${pin}</span>`)}</p>`;
          }
          if (line.includes('https://pitch.neuralarc.ai')) {
            return `<p style="margin: 16px 0;">${line.replace('https://pitch.neuralarc.ai', '<a href="https://pitch.neuralarc.ai" style="color: #007bff; text-decoration: none;">https://pitch.neuralarc.ai</a>')}</p>`;
          }
          return `<p style="margin: 0 0 16px 0;">${line}</p>`;
        })
        .join('');
      
      const emailWithPitchAccess = emailHtml;


      
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
    const subject = `Investment Opportunity in Our Agile AI Solutions Company`;
    const to = sanitizeText(String(investor.email)) || String(investor.email) || String(investor.id) || `contact-fallback`;
    
    if (!to) {
      toast({ 
        variant: "destructive", 
        title: "No Email Address", 
        description: "This contact doesn't have an email address." 
      });
      return;
    }

    // If there's a PIN, save it to Supabase first
    if (investor.email && pin) {
      const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours from now
      try {
        const response = await fetch('/api/store-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: investor.email, pin, expires_at })
        });
        const result = await response.json();
        if (result.error) {
          toast({
            variant: "destructive",
            title: "Failed to store PIN",
            description: result.error || "Could not save PIN to pitch database."
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to store PIN",
          description: (error as Error).message || "Could not save PIN to pitch database."
        });
      }
    }

    // Send email directly using our API
    try {
      console.log('Frontend: Sending email request...')
      console.log('Frontend: To:', to)
      console.log('Frontend: Subject:', subject)
      console.log('Frontend: Content length:', emailContent.length)
      
      const response = await fetch('/api/send-investor-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: to,
          subject: subject,
          content: emailContent,
          pin: pin
        }),
      });

      console.log('Frontend: Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Frontend: Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json();
      console.log('Frontend: Response result:', result)
      
      if (result.success) {
        toast({ 
          title: "Email Sent Successfully", 
          description: `Email sent to ${sanitizeText(String(investor.contact_person))}${pin ? ` with PIN: ${pin}` : ''}` 
        });
        // Save to email_history
        if (investor.contact_person && investor.email) {
          await supabase.from('email_history').insert([
            {
              contact_person: investor.contact_person,
              email: investor.email
            }
          ]);
        }
      } else {
        throw new Error(result.error || result.details || 'Failed to send email');
      }
    } catch (error) {
      console.error("Frontend: Failed to send email:", error);
      console.error("Frontend: Error details:", error instanceof Error ? error.stack : 'No stack trace');
      toast({ 
        variant: "destructive", 
        title: "Email Error", 
        description: error instanceof Error ? error.message : "Could not send email. Please try again." 
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

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl p-0">
        <ScrollArea className="h-full">
          {primaryInvestor && contactsToShow && (
            <>
              <SheetHeader className="p-6">
                  <SheetTitle className="font-headline text-2xl">{sanitizeText(String(primaryInvestor.investor_name))}</SheetTitle>
                <SheetDescription>{contactsToShow.length} contact{contactsToShow.length > 1 ? 's' : ''} found at this firm.</SheetDescription>
              </SheetHeader>
              <Separator />
              <div className="p-6">
                  <Card className="mb-6">
                    <CardHeader><CardTitle className="text-lg font-headline">Company Details</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem icon={MapPin} label="Location" value={primaryInvestor.location || 'N/A'} />
                        <DetailItem icon={Briefcase} label="Investor Type" value={primaryInvestor.investor_type || 'N/A'} />
                        <DetailItem icon={TrendingUp} label="Investment Score" value={primaryInvestor.investment_score || 'N/A'} />
                        <DetailItem icon={Info} label="Practice Areas" value={primaryInvestor.practice_areas || 'N/A'} />
                                    </div>
                                    <Separator />
                      <DetailItem icon={Info} label="Overview" value={primaryInvestor.overview || 'N/A'} />
                                </CardContent>
                            </Card>
            
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contactsToShow.map((investor, idx) => {
                      const cardKey = `${investor.id}-${investor.email || investor.contact_person || 'noid'}-${idx}`;
                      const contactId = sanitizeText(String(investor.contact_person)) || String(investor.email) || cardKey;
                      // Check if this contact has a sent email in history
                      const sent = emailHistory.some(h => h.email === investor.email && h.contact_person === investor.contact_person)
                      return (
                        <Card 
                          key={cardKey}
                          className="cursor-pointer hover:shadow-md transition-shadow relative"
                          onClick={() => handleCardClick(investor)}
                        >
                          {sent && (
                            <Badge className="absolute top-2 right-2 bg-green-500 text-white z-10">Sent</Badge>
                          )}
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-headline">
                              {sanitizeText(String(investor.contact_person))}
                            </CardTitle>
                            {investor.designation && (
                              <p className="text-sm text-muted-foreground">
                                {sanitizeText(String(investor.designation))}
                              </p>
                            )}
                              </CardHeader>
                          <CardContent className="space-y-3">
                            {investor.email && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 mr-2" />
                                <span className="truncate">{sanitizeText(String(investor.email)) || 'N/A'}</span>
                              </div>
                            )}
                            {investor.phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 mr-2" />
                                <span>{sanitizeText(String(investor.phone)) || 'N/A'}</span>
                                    </div>
                            )}
                            {investor.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{sanitizeText(String(investor.location)) || 'N/A'}</span>
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
          emailState={emailStates.get(sanitizeText(String(selectedInvestor.contact_person))) || { isLoading: false, content: '' }}
          onGenerateEmail={(inv) => handleGenerateEmail(inv, sanitizeText(String(inv.contact_person)) || String(inv.email) || String(inv.id) || 'contact-fallback')}
          onSendEmail={handleSendEmail}
          onCopyToClipboard={handleCopyToClipboard}
          onTextChange={handleTextChange}
        />
      )}
    </>
  )
}
