import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Building2, Mail, Phone, Globe, MapPin, Save, Facebook, Instagram, Twitter, Linkedin, CreditCard, Banknote, Eye, EyeOff, FileText, Monitor, MessageCircle, Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { storageUtils } from '../utils/storage';
import { settingsApi } from '../utils/supabaseApi';
import storageHelpers from '../utils/supabaseStorageHelpers';
import { BusinessInfo } from '../types';
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';

// ── helpers to map between camelCase (app) ↔ snake_case (Supabase) ──────────
function dbToBusinessInfo(db: any): BusinessInfo {
  return {
    companyName: db.company_name || '',
    address: db.address || '',
    city: db.city || '',
    state: db.state || '',
    pincode: db.pincode || '',
    country: db.country || 'India',
    phone: db.phone || '',
    email: db.email || '',
    supportEmail: db.support_email || '',
    whatsapp: db.whatsapp || '',
    gstin: db.gstin || '',
    website: db.website || '',
    supportHours: db.support_hours || '',
    heroImage: db.hero_image || '',
    neckLabelTemplate: db.neck_label_template || '',
    thankYouCardTemplate: db.thank_you_card_template || '',
    boxTemplate: db.box_template || '',
    socialMedia: db.social_media || {},
    bankDetails: db.bank_details || {
      accountName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '',
    },
    visibility: db.visibility || {
      website: {
        showAddress: true, showPhone: true, showEmail: true,
        showSupportEmail: true, showSupportHours: true,
        showSocialMedia: true, showGSTIN: false, showWhatsApp: true,
      },
      invoice: {
        showFullAddress: true, showPhone: true, showEmail: true,
        showGSTIN: true, showWebsite: true, showBankDetails: true,
      },
    },
  };
}

function businessInfoToDb(info: BusinessInfo): Record<string, any> {
  return {
    company_name: info.companyName,
    address: info.address,
    city: info.city,
    state: info.state,
    pincode: info.pincode,
    country: info.country,
    phone: info.phone,
    email: info.email,
    support_email: info.supportEmail,
    whatsapp: info.whatsapp,
    gstin: info.gstin,
    website: info.website,
    support_hours: info.supportHours,
    hero_image: info.heroImage,
    neck_label_template: info.neckLabelTemplate,
    thank_you_card_template: info.thankYouCardTemplate,
    box_template: info.boxTemplate,
    social_media: info.socialMedia,
    bank_details: info.bankDetails,
    visibility: info.visibility,
  };
}

const EMPTY_BUSINESS_INFO: BusinessInfo = {
  companyName: 'Toodies',
  address: '',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '',
  country: 'India',
  phone: '+91 98865 10858',
  email: 'hello@toodies.com',
  supportEmail: '',
  whatsapp: '+919886510858',
  gstin: '',
  website: '',
  supportHours: '',
  heroImage: '',
  socialMedia: {},
  bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' },
  visibility: {
    website: {
      showAddress: true, showPhone: true, showEmail: true,
      showSupportEmail: true, showSupportHours: true,
      showSocialMedia: true, showGSTIN: false, showWhatsApp: true,
    },
    invoice: {
      showFullAddress: true, showPhone: true, showEmail: true,
      showGSTIN: true, showWebsite: true, showBankDetails: true,
    },
  },
};

export function BusinessSettings() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(EMPTY_BUSINESS_INFO);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [heroImagePreview, setHeroImagePreview] = useState<string>('');
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Load from Supabase on mount; fall back to localStorage
  useEffect(() => {
    const load = async () => {
      try {
        const db = await settingsApi.getBusiness();
        if (db && Object.keys(db).length > 0) {
          const mapped = dbToBusinessInfo(db);
          setBusinessInfo(mapped);
          setHeroImagePreview(mapped.heroImage || '');
        } else {
          // Supabase empty — check localStorage fallback
          const local = storageUtils.getBusinessInfo();
          setBusinessInfo(local);
          setHeroImagePreview(local.heroImage || '');
        }
      } catch {
        const local = storageUtils.getBusinessInfo();
        setBusinessInfo(local);
        setHeroImagePreview(local.heroImage || '');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Primary: save to Supabase
      await settingsApi.saveBusiness(businessInfoToDb(businessInfo));
      // Mirror to localStorage so LandingPage has it without a fetch
      storageUtils.saveBusinessInfo(businessInfo);
      toast.success('Business information saved to Supabase successfully!');
    } catch (err: any) {
      // Fallback: save to localStorage so changes aren't lost
      storageUtils.saveBusinessInfo(businessInfo);
      toast.warning('Saved locally (Supabase unavailable): ' + (err?.message || 'Check connection'));
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Hero image must be less than 10MB');
      return;
    }
    setIsUploadingHero(true);
    try {
      // Try Supabase Storage first
      const url = await storageHelpers.uploadAdminAsset('hero', file);
      setHeroImagePreview(url);
      setBusinessInfo({ ...businessInfo, heroImage: url });
      toast.success('Hero image uploaded to Storage! Remember to Save.');
    } catch {
      // Fallback to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setHeroImagePreview(result);
        setBusinessInfo({ ...businessInfo, heroImage: result });
        toast.success('Hero image loaded (local preview). Remember to Save.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingHero(false);
      e.target.value = '';
    }
  };

  const removeHeroImage = () => {
    setHeroImagePreview('');
    setBusinessInfo({ ...businessInfo, heroImage: '' });
    toast.success('Hero image removed! Remember to save changes.');
  };

  const updateVisibility = (context: 'website' | 'invoice', field: string, value: boolean) => {
    setBusinessInfo({
      ...businessInfo,
      visibility: {
        ...businessInfo.visibility!,
        [context]: {
          ...businessInfo.visibility![context],
          [field]: value,
        },
      },
    });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="ml-3 text-slate-400">Loading business info…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-cyan-100 glow-text flex items-center gap-3 mb-2">
          <Building2 className="w-7 h-7" />
          Business Information
        </h2>
        <p className="text-slate-400">
          Manage your company details, contact information, and bank details for invoices
        </p>
      </div>

      {/* Company Details */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Details
          </CardTitle>
          <CardDescription>Basic business information displayed on invoices and website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-cyan-100">Company Name *</Label>
              <Input
                value={businessInfo.companyName}
                onChange={(e) => setBusinessInfo({ ...businessInfo, companyName: e.target.value })}
                placeholder="Your Company Name"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100">GSTIN *</Label>
              <Input
                value={businessInfo.gstin}
                onChange={(e) => setBusinessInfo({ ...businessInfo, gstin: e.target.value })}
                placeholder="22AAAAA0000A1Z5"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-100">Street Address *</Label>
            <Textarea
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
              placeholder="Street Address, Building No., Floor"
              className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-cyan-100">City *</Label>
              <Input
                value={businessInfo.city}
                onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                placeholder="City"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100">State *</Label>
              <Input
                value={businessInfo.state}
                onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                placeholder="State"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100">Pincode *</Label>
              <Input
                value={businessInfo.pincode}
                onChange={(e) => setBusinessInfo({ ...businessInfo, pincode: e.target.value })}
                placeholder="000000"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                maxLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-100">Country *</Label>
            <Input
              value={businessInfo.country}
              onChange={(e) => setBusinessInfo({ ...businessInfo, country: e.target.value })}
              placeholder="India"
              className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>How customers can reach your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Business Email *
              </Label>
              <Input
                type="email"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                placeholder="info@toodies.com"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Support Email
              </Label>
              <Input
                type="email"
                value={businessInfo.supportEmail || ''}
                onChange={(e) => setBusinessInfo({ ...businessInfo, supportEmail: e.target.value })}
                placeholder="support@toodies.com"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Number
              </Label>
              <Input
                value={businessInfo.whatsapp || ''}
                onChange={(e) => setBusinessInfo({ ...businessInfo, whatsapp: e.target.value })}
                placeholder="+919876543210"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
              <p className="text-xs text-slate-400">
                WhatsApp number for customer support (with country code, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                type="url"
                value={businessInfo.website || ''}
                onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                placeholder="https://www.toodies.com"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-100">Support Hours</Label>
            <Input
              value={businessInfo.supportHours || ''}
              onChange={(e) => setBusinessInfo({ ...businessInfo, supportHours: e.target.value })}
              placeholder="Mon-Sat: 9:00 AM - 6:00 PM IST"
              className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social Media Links
          </CardTitle>
          <CardDescription>Your social media presence (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </Label>
              <Input
                type="url"
                value={businessInfo.socialMedia?.facebook || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  socialMedia: { ...businessInfo.socialMedia, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/yourpage"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </Label>
              <Input
                type="url"
                value={businessInfo.socialMedia?.instagram || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  socialMedia: { ...businessInfo.socialMedia, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/yourpage"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter/X
              </Label>
              <Input
                type="url"
                value={businessInfo.socialMedia?.twitter || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  socialMedia: { ...businessInfo.socialMedia, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/yourpage"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100 flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Label>
              <Input
                type="url"
                value={businessInfo.socialMedia?.linkedin || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  socialMedia: { ...businessInfo.socialMedia, linkedin: e.target.value }
                })}
                placeholder="https://linkedin.com/company/yourpage"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Bank Account Details
          </CardTitle>
          <CardDescription>Bank information for invoices and payment instructions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-cyan-100">Account Holder Name</Label>
              <Input
                value={businessInfo.bankDetails?.accountName || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  bankDetails: { ...businessInfo.bankDetails!, accountName: e.target.value }
                })}
                placeholder="Account Holder Name"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100">Account Number</Label>
              <Input
                value={businessInfo.bankDetails?.accountNumber || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  bankDetails: { ...businessInfo.bankDetails!, accountNumber: e.target.value }
                })}
                placeholder="0000000000000"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100">IFSC Code</Label>
              <Input
                value={businessInfo.bankDetails?.ifscCode || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  bankDetails: { ...businessInfo.bankDetails!, ifscCode: e.target.value }
                })}
                placeholder="ABCD0000000"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-cyan-100">Bank Name</Label>
              <Input
                value={businessInfo.bankDetails?.bankName || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  bankDetails: { ...businessInfo.bankDetails!, bankName: e.target.value }
                })}
                placeholder="Your Bank Name"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-cyan-100">Branch Name</Label>
              <Input
                value={businessInfo.bankDetails?.branchName || ''}
                onChange={(e) => setBusinessInfo({ 
                  ...businessInfo, 
                  bankDetails: { ...businessInfo.bankDetails!, branchName: e.target.value }
                })}
                placeholder="Branch Name/Location"
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Image */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Hero Image
          </CardTitle>
          <CardDescription>Upload a custom hero/banner image for your landing page (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Label className="text-cyan-100 font-medium flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                Landing Page Hero Image
              </Label>
              <p className="text-xs text-slate-400">
                This image will be displayed as the main hero image on your website's landing page. Recommended size: 1080x1350px (4:5 aspect ratio).
              </p>
              <Input
                id="hero-image-upload"
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('hero-image-upload')?.click()}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white w-full md:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                {heroImagePreview ? 'Change Hero Image' : 'Upload Hero Image'}
              </Button>
            </div>

            {heroImagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-cyan-500/30">
                <img
                  src={heroImagePreview}
                  alt="Hero Image Preview"
                  className="w-full h-64 object-cover"
                />
                <Button
                  type="button"
                  onClick={removeHeroImage}
                  className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg">
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">Current Hero Image</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings - Website */}
      <Card className="glass-card border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-cyan-500/5">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-teal-400" />
            Website Visibility Settings
          </CardTitle>
          <CardDescription>Control what information is displayed on your website (footer, contact pages, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show WhatsApp Button</Label>
                  <p className="text-xs text-slate-500">Floating contact button for customers</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showWhatsApp ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showWhatsApp', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Full Address</Label>
                  <p className="text-xs text-slate-500">Display complete business address</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showAddress ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showAddress', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Phone Number</Label>
                  <p className="text-xs text-slate-500">Display business phone</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showPhone ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showPhone', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Business Email</Label>
                  <p className="text-xs text-slate-500">Display main business email</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showEmail ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Support Email</Label>
                  <p className="text-xs text-slate-500">Display support email address</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showSupportEmail ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showSupportEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Support Hours</Label>
                  <p className="text-xs text-slate-500">Display business hours</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showSupportHours ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showSupportHours', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Instagram className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Social Media</Label>
                  <p className="text-xs text-slate-500">Display social media links</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showSocialMedia ?? true}
                onCheckedChange={(checked) => updateVisibility('website', 'showSocialMedia', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-teal-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-teal-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show GSTIN</Label>
                  <p className="text-xs text-slate-500">Display GST identification number</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.website.showGSTIN ?? false}
                onCheckedChange={(checked) => updateVisibility('website', 'showGSTIN', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings - Invoice */}
      <Card className="glass-card border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-teal-500/5">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Invoice Visibility Settings
          </CardTitle>
          <CardDescription>Control what business information appears on generated invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Full Address</Label>
                  <p className="text-xs text-slate-500">Include complete address on invoice</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.invoice.showFullAddress ?? true}
                onCheckedChange={(checked) => updateVisibility('invoice', 'showFullAddress', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Phone Number</Label>
                  <p className="text-xs text-slate-500">Include phone on invoice</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.invoice.showPhone ?? true}
                onCheckedChange={(checked) => updateVisibility('invoice', 'showPhone', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Email</Label>
                  <p className="text-xs text-slate-500">Include email on invoice</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.invoice.showEmail ?? true}
                onCheckedChange={(checked) => updateVisibility('invoice', 'showEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-cyan-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show GSTIN</Label>
                  <p className="text-xs text-slate-500">Include GST number on invoice</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.invoice.showGSTIN ?? true}
                onCheckedChange={(checked) => updateVisibility('invoice', 'showGSTIN', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-cyan-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Website</Label>
                  <p className="text-xs text-slate-500">Include website URL on invoice</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.invoice.showWebsite ?? false}
                onCheckedChange={(checked) => updateVisibility('invoice', 'showWebsite', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <Banknote className="w-4 h-4 text-cyan-400" />
                <div>
                  <Label className="text-cyan-100 font-medium">Show Bank Details</Label>
                  <p className="text-xs text-slate-500">Include bank account info on invoice</p>
                </div>
              </div>
              <Switch
                checked={businessInfo.visibility?.invoice.showBankDetails ?? true}
                onCheckedChange={(checked) => updateVisibility('invoice', 'showBankDetails', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-6 z-10">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/50 glow-button"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Business Information'}
        </Button>
      </div>
    </div>
  );
}