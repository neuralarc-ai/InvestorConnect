"use client"

import { useState } from "react"
import { useInvestors } from "@/providers/investor-provider"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, Building2, Mail, Linkedin, Twitter, Facebook } from "lucide-react"
import type { Investor } from "@/lib/types"

interface AddInvestorDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddInvestorDialog({ isOpen, onClose }: AddInvestorDialogProps) {
  const { investors, setInvestors } = useInvestors()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    investor_name: "",
    contact_person: "",
    designation: "",
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    company_linkedin: "",
    twitter: "",
    facebook: "",
    country: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if (!formData.investor_name.trim() || !formData.contact_person.trim()) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: "Investor name and contact person are required fields."
      })
      return
    }

    setIsSubmitting(true)

    try {
      const newInvestor: Investor = {
        Investor_Name: formData.investor_name.trim(),
        Contact_Person: formData.contact_person.trim(),
        Designation: formData.designation.trim() || undefined,
        Email: formData.email.trim() || undefined,
        Phone: formData.phone.trim() || undefined,
        Website: formData.website.trim() || undefined,
        LinkedIn: formData.linkedin.trim() || undefined,
        Company_LinkedIn: formData.company_linkedin.trim() || undefined,
        Twitter: formData.twitter.trim() || undefined,
        Facebook: formData.facebook.trim() || undefined,
        Country: formData.country.trim() || undefined
      }

      setInvestors(prev => [...prev, newInvestor])

      toast({
        title: "Investor Added Successfully",
        description: `${newInvestor.Investor_Name} has been added to your investor list.`
      })

      setFormData({
        investor_name: "",
        contact_person: "",
        designation: "",
        email: "",
        phone: "",
        website: "",
        linkedin: "",
        company_linkedin: "",
        twitter: "",
        facebook: "",
        country: ""
      })
      onClose()
    } catch (error) {
      console.error("Error adding investor:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add investor. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        investor_name: "",
        contact_person: "",
        designation: "",
        email: "",
        phone: "",
        website: "",
        linkedin: "",
        company_linkedin: "",
        twitter: "",
        facebook: "",
        country: ""
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Add New Investor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investor_name">Investor Name *</Label>
                  <Input
                    id="investor_name"
                    value={formData.investor_name}
                    onChange={(e) => handleInputChange("investor_name", e.target.value)}
                    placeholder="Enter investor/company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange("contact_person", e.target.value)}
                    placeholder="Enter contact person name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    placeholder="e.g., Partner, Managing Director"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Linkedin className="mr-2 h-4 w-4" />
                Social Media & Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">Personal LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    placeholder="Enter personal LinkedIn URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_linkedin">Company LinkedIn</Label>
                  <Input
                    id="company_linkedin"
                    value={formData.company_linkedin}
                    onChange={(e) => handleInputChange("company_linkedin", e.target.value)}
                    placeholder="Enter company LinkedIn URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange("twitter", e.target.value)}
                    placeholder="Enter Twitter handle or URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange("facebook", e.target.value)}
                    placeholder="Enter Facebook page URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Investor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 