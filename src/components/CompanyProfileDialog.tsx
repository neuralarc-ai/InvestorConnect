import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Building2, Box } from 'lucide-react';

const industryOptions = [
  'SaaS', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Technology', 'Other'
];

export default function CompanyProfileDialog({ open, onOpenChange, isEditable = false }) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Service',
    description: '',
    targetMarket: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    if (open) fetchCompany();
  }, [open]);

  const fetchCompany = async () => {
    const { data } = await supabase.from('company').select('*').single();
    if (data) {
      setCompanyId(data.id);
      setCompanyName(data.name || '');
      setWebsite(data.website || '');
      setIndustry(data.industry || '');
      setCompanyDescription(data.description || '');
      fetchServices(data.id);
    }
  };

  const fetchServices = async (companyId) => {
    const { data } = await supabase.from('company_service').select('*').eq('company_id', companyId);
    setServices(data || []);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let cid = companyId;
      if (!cid) {
        const { data } = await supabase.from('company').insert({
          name: companyName,
          website,
          industry,
          description: companyDescription
        }).select().single();
        cid = data.id;
        setCompanyId(cid);
      } else {
        await supabase.from('company').update({
          name: companyName,
          website,
          industry,
          description: companyDescription
        }).eq('id', cid);
      }
      // Upsert services
      if (cid) {
        await supabase.from('company_service').delete().eq('company_id', cid);
        if (services.length > 0) {
          await supabase.from('company_service').insert(
            services.map(s => ({
              company_id: cid,
              name: s.name,
              category: s.category,
              description: s.description,
              target_market: s.targetMarket
            }))
          );
        }
      }
      toast({ title: 'Success', description: 'Company profile saved.' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save company profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full rounded-2xl bg-white max-h-[90vh] flex flex-col p-8 overflow-y-auto">
        <DialogTitle className="flex items-center gap-3 mb-6 text-2xl font-bold">
          <Building2 className="w-6 h-6" /> Company Profile
        </DialogTitle>
        <div className="flex flex-col gap-6 px-2 pb-2">
          <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" required readOnly={!isEditable} className="h-12 text-base px-4" />
          <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" required readOnly={!isEditable} className="h-12 text-base px-4" />
          <Select value={industry} onValueChange={setIndustry} disabled={!isEditable}>
            <SelectTrigger className="w-full h-12 text-base px-4">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="Company Description" required className="resize-none min-h-[120px] text-base px-4 py-3" readOnly={!isEditable} />
          {/* Services card */}
          <div className="bg-[#F8F7F3] border border-[#E0E0E0] rounded-xl mt-8 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Box className="w-7 h-7 text-[#282828]" />
                <span className="text-xl font-semibold text-[#282828]">Services & Products</span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg px-5 py-2 font-medium text-base border-[#E0E0E0] text-[#282828] max-h-12 max-w-fit"
                onClick={() => setShowAddService(true)}
                disabled={!isEditable || showAddService}
              >
                + Add Service
              </Button>
            </div>
            {/* Add Service Form (above the grid) */}
            {showAddService && (
              <div className="bg-white border border-[#E0E0E0] rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Service Name</label>
                    <Input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter service name" className="h-10 text-base px-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={serviceForm.category} onValueChange={v => setServiceForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="w-full h-10 text-base px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this service or product" className="h-20 text-base px-3 py-2" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Target Market</label>
                  <Input value={serviceForm.targetMarket} onChange={e => setServiceForm(f => ({ ...f, targetMarket: e.target.value }))} placeholder="Who is this for? (e.g., Small businesses, Enterprise clients)" className="h-10 text-base px-3" />
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    className="bg-black text-white px-6 h-10"
                    onClick={() => {
                      setServices([...services, { ...serviceForm }]);
                      setShowAddService(false);
                      setServiceForm({ name: '', category: 'Service', description: '', targetMarket: '' });
                    }}
                    disabled={!serviceForm.name.trim()}
                  >
                    Add Service
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddService(false);
                      setServiceForm({ name: '', category: 'Service', description: '', targetMarket: '' });
                    }}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[340px] overflow-y-auto">
              {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-[#B0B0B0] py-10">
                  <Box className="w-14 h-14 mb-3" />
                  <span className="text-xl font-medium">No services added yet</span>
                  <span className="text-base">Add your company's services and products</span>
                </div>
              ) : (
                services.map((s, i) => (
                  <div
                    key={i}
                    className="relative bg-white border border-[#E0E0E0] rounded-2xl p-3 min-w-[180px] max-w-xs h-40 flex flex-col shadow-sm"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-lg text-[#282828] hover:text-red-500"
                      onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                      disabled={!isEditable}
                      aria-label="Remove service"
                    >
                      ×
                    </button>
                    {/* Name and category */}
                    <div className="flex items-center mb-1">
                      <span className="font-bold text-base text-[#282828]">{s.name}</span>
                      <span className="inline-block bg-[#F5F3EE] text-[#282828] text-xs font-semibold rounded-full px-3 py-0.5 ml-2 align-middle">
                        {s.category}
                      </span>
                    </div>
                    {/* Description */}
                    <div className="text-[#5E6156] text-sm leading-snug mb-1">
                      {s.description}
                    </div>
                    {/* Target */}
                    <div className="text-[#888] text-xs mt-auto">
                      Target: {s.targetMarket}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-8">
          <Button onClick={handleSave} disabled={isSaving || !isEditable} className="h-12 px-8 text-base">OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 