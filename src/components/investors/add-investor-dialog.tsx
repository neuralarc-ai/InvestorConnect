"use client"

import { useState, useEffect } from "react"
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
import { supabase } from "@/lib/supabaseClient"

interface AddInvestorDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AddInvestorDialog({ isOpen, onClose }: AddInvestorDialogProps) {
  const { setInvestors } = useInvestors()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check Supabase configuration on component mount
  useEffect(() => {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("investors");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setInvestors(parsed);
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

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
    country: "",
    state: "",
    city: "",
    location: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function addInvestor(fields: {
    investor_name: string,
    contact_person: string,
    designation?: string,
    country?: string,
    state?: string,
    city?: string,
    location?: string,
    email?: string,
    phone?: string,
    website?: string,
    linkedin?: string,
    company_linkedin?: string,
    twitter?: string,
    facebook?: string
  }) {
    console.log('Attempting to insert investor:', fields);
    
    const { data, error } = await supabase
      .from('investors')
      .insert([fields])
      .select();
    
    console.log('Supabase response:', { data, error });
    
    if (error) {
      console.error('Detailed error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    
    return { data, error };
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

    // Test database connection first
    try {
      const { data: testData, error: testError } = await supabase
        .from('investors')
        .select('count')
        .limit(1);
      
      console.log('Database connection test:', { testData, testError });
      
      if (testError) {
        console.error('Database connection failed:', testError);
        toast({
          variant: "destructive",
          title: "Database Connection Error",
          description: `Cannot connect to database: ${testError.message}`
        });
        setIsSubmitting(false);
        return;
      }
    } catch (connectionError) {
      console.error('Connection test failed:', connectionError);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to database. Please check your connection."
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create investor object with only non-empty values
      const newInvestor: any = {
        investor_name: formData.investor_name.trim(),
        contact_person: formData.contact_person.trim()
      };
      
      // Only add fields that have values
      if (formData.designation.trim()) newInvestor.designation = formData.designation.trim();
      if (formData.country.trim()) newInvestor.country = formData.country.trim();
      if (formData.state.trim()) newInvestor.state = formData.state.trim();
      if (formData.city.trim()) newInvestor.city = formData.city.trim();
      if (formData.location.trim()) newInvestor.location = formData.location.trim();
      if (formData.email.trim()) newInvestor.email = formData.email.trim();
      if (formData.phone.trim()) newInvestor.phone = formData.phone.trim();
      if (formData.website.trim()) newInvestor.website = formData.website.trim();
      if (formData.linkedin.trim()) newInvestor.linkedin = formData.linkedin.trim();
      if (formData.company_linkedin.trim()) newInvestor.company_linkedin = formData.company_linkedin.trim();
      if (formData.twitter.trim()) newInvestor.twitter = formData.twitter.trim();
      if (formData.facebook.trim()) newInvestor.facebook = formData.facebook.trim();

      const { error, data } = await addInvestor(newInvestor);

      if (error) {
        console.error('Supabase insert error:', error);
        
        let errorMessage = 'Failed to save to database.';
        
        if (error.code === '42501') {
          errorMessage = 'Permission denied. You may not have INSERT permissions on the investors table.';
        } else if (error.code === '42P01') {
          errorMessage = 'Table "investors" does not exist. Please check your database schema.';
        } else if (error.code === '23505') {
          errorMessage = 'Duplicate entry. This investor may already exist in the database.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          variant: "destructive",
          title: "Database Error",
          description: errorMessage
        });
        setIsSubmitting(false);
        return;
      }
      if (!data) {
        toast({
          variant: "destructive",
          title: "No Data Returned",
          description: "No data was returned from Supabase. Check your table and permissions."
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Investor Added Successfully",
        description: `${newInvestor.investor_name} has been added to your investor list.`
      });

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
        country: "",
        state: "",
        city: "",
        location: ""
      });
      onClose();
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
        country: "",
        state: "",
        city: "",
        location: ""
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
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter location"
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