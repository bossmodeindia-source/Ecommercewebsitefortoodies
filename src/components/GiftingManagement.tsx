import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import { Gift, Tag, CheckCircle, Upload, X, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

export function GiftingManagement() {
  const [businessInfo, setBusinessInfo] = useState(storageUtils.getBusinessInfo());
  const [neckLabelTemplate, setNeckLabelTemplate] = useState(businessInfo.neckLabelTemplate || '');
  const [thankYouCardTemplate, setThankYouCardTemplate] = useState(businessInfo.thankYouCardTemplate || '');
  const [boxTemplate, setBoxTemplate] = useState(businessInfo.boxTemplate || '');

  const handleSave = () => {
    const updatedInfo = {
      ...businessInfo,
      neckLabelTemplate,
      thankYouCardTemplate,
      boxTemplate
    };
    storageUtils.saveBusinessInfo(updatedInfo);
    setBusinessInfo(updatedInfo);
    toast.success('Gifting protocols archived successfully.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'neck' | 'card' | 'box') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'neck') setNeckLabelTemplate(result);
      if (type === 'card') setThankYouCardTemplate(result);
      if (type === 'box') setBoxTemplate(result);
      toast.success('Template integrated successfully.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Gifting & Bespoke Extras</h2>
          <p className="text-slate-500 font-light mt-1">Define templates for luxury packaging and identification</p>
        </div>
        <Button onClick={handleSave} className="glow-button px-8 h-12 rounded-xl font-bold uppercase tracking-widest text-xs border-0">
          Archive Protocol
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Neck Label Template */}
        <Card className="glass-card border-[#d4af37]/20 bg-black overflow-hidden luxury-glow-hover transition-all">
          <CardHeader className="pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-2 border border-[#d4af37]/20">
              <Tag className="w-5 h-5 text-[#d4af37]" />
            </div>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Neck Label</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Identification Template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group">
              {neckLabelTemplate ? (
                <>
                  <img src={neckLabelTemplate} alt="Neck Label" className="w-full h-full object-contain" />
                  <button onClick={() => setNeckLabelTemplate('')} className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                </>
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">No Master Template</p>
                </div>
              )}
            </div>
            <div className="relative">
              <input type="file" id="neck-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'neck')} />
              <Button asChild variant="outline" className="w-full border-white/10 text-white hover:bg-[#d4af37]/10 hover:text-[#d4af37] h-10 text-[9px] uppercase font-black tracking-widest cursor-pointer">
                <label htmlFor="neck-upload"><Upload className="w-3.5 h-3.5 mr-2" />Upload Master</label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Thank You Card Template */}
        <Card className="glass-card border-[#d4af37]/20 bg-black overflow-hidden luxury-glow-hover transition-all">
          <CardHeader className="pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-2 border border-[#d4af37]/20">
              <CheckCircle className="w-5 h-5 text-[#d4af37]" />
            </div>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Greeting Card</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gratitude Template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group">
              {thankYouCardTemplate ? (
                <>
                  <img src={thankYouCardTemplate} alt="Thank You Card" className="w-full h-full object-contain" />
                  <button onClick={() => setThankYouCardTemplate('')} className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                </>
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">No Master Template</p>
                </div>
              )}
            </div>
            <div className="relative">
              <input type="file" id="card-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'card')} />
              <Button asChild variant="outline" className="w-full border-white/10 text-white hover:bg-[#d4af37]/10 hover:text-[#d4af37] h-10 text-[9px] uppercase font-black tracking-widest cursor-pointer">
                <label htmlFor="card-upload"><Upload className="w-3.5 h-3.5 mr-2" />Upload Master</label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Box Template */}
        <Card className="glass-card border-[#d4af37]/20 bg-black overflow-hidden luxury-glow-hover transition-all">
          <CardHeader className="pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-2 border border-[#d4af37]/20">
              <Gift className="w-5 h-5 text-[#d4af37]" />
            </div>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Luxury Box</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Packaging Template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center relative overflow-hidden group">
              {boxTemplate ? (
                <>
                  <img src={boxTemplate} alt="Box" className="w-full h-full object-contain" />
                  <button onClick={() => setBoxTemplate('')} className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                </>
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">No Master Template</p>
                </div>
              )}
            </div>
            <div className="relative">
              <input type="file" id="box-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'box')} />
              <Button asChild variant="outline" className="w-full border-white/10 text-white hover:bg-[#d4af37]/10 hover:text-[#d4af37] h-10 text-[9px] uppercase font-black tracking-widest cursor-pointer">
                <label htmlFor="box-upload"><Upload className="w-3.5 h-3.5 mr-2" />Upload Master</label>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-[32px] p-8 mt-12 luxury-glow">
        <div className="flex items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#d4af37] flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <Gift className="w-7 h-7 text-black" />
          </div>
          <div>
            <h3 className="text-white text-xl font-black uppercase tracking-tight mb-2">Protocol Integration</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-light">
              Uploaded templates define the base aesthetic for all customer customizations. The 2D Studio will automatically inject these masters into the curation flow when "Gifting" is activated by the client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
