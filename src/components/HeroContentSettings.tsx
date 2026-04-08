import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Upload, Video, Image as ImageIcon, X, Save, Layers, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { settingsApi } from '../utils/supabaseApi';
import storageHelpers from '../utils/supabaseStorageHelpers';

interface HeroContent {
  type: 'video' | 'image';
  url: string;
  heading: string;
  subheading: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

// Collection image slot metadata — "Crafted for the Bold" section
const COLLECTION_SLOTS = [
  {
    index: 0,
    label: 'Hoodies — Large Featured Card',
    ratio: '4:5',
    ratioLabel: 'Portrait (4 : 5)',
    recommended: '800 × 1000 px',
    minH: '380px',
    cols: 'col-span-2 (wide)',
    hint: 'This is the hero card of the grid — tall and dominant. Use a portrait fashion shot with ample vertical space. The subject should be clearly visible even at smaller sizes.',
    bgColor: 'rgba(212,175,55,0.06)',
    borderColor: 'rgba(212,175,55,0.3)',
  },
  {
    index: 1,
    label: 'T-Shirts — Square Cell',
    ratio: '1:1',
    ratioLabel: 'Square (1 : 1)',
    recommended: '600 × 600 px',
    minH: '180px',
    cols: '1 col',
    hint: 'A compact square tile — keep the focal point centred. Works best with a clean product shot on a dark background.',
    bgColor: 'rgba(212,175,55,0.04)',
    borderColor: 'rgba(212,175,55,0.2)',
  },
  {
    index: 2,
    label: 'Streetwear — Square Cell',
    ratio: '1:1',
    ratioLabel: 'Square (1 : 1)',
    recommended: '600 × 600 px',
    minH: '180px',
    cols: '1 col',
    hint: 'Pair with the T-Shirts cell. A lifestyle or flat-lay streetwear image works well here.',
    bgColor: 'rgba(212,175,55,0.04)',
    borderColor: 'rgba(212,175,55,0.2)',
  },
  {
    index: 3,
    label: 'Custom Prints — Wide Banner',
    ratio: '3:1',
    ratioLabel: 'Panoramic (3 : 1)',
    recommended: '1200 × 400 px',
    minH: '190px',
    cols: 'col-span-2 (wide)',
    hint: 'A very wide, short strip — perfect for a banner-style lifestyle shot or a flat-lay of multiple custom-printed products side by side.',
    bgColor: 'rgba(212,175,55,0.06)',
    borderColor: 'rgba(212,175,55,0.3)',
  },
];

const DEFAULT_COLLECTION_IMGS = [
  'https://images.unsplash.com/photo-1571754338920-1ba712024258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1604384809954-c6f6a74d56fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1535395567430-827184ae2eda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1571754338920-1ba712024258?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
];

export function HeroContentSettings() {
  const [heroContent, setHeroContent] = useState<HeroContent>({
    type: 'image',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
    heading: 'Timeless Elegance',
    subheading: 'Crafted with precision, designed for distinction',
    ctaPrimary: 'Explore Collection',
    ctaSecondary: 'Our Story',
  });

  const [collectionImages, setCollectionImages] = useState<string[]>(DEFAULT_COLLECTION_IMGS);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [loadedSlot, setLoadedSlot] = useState<number | null>(null);
  // Track per-slot upload progress
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  useEffect(() => {
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    try {
      const business = await settingsApi.getBusiness();
      if (business) {
        // Hero content
        if (business.hero_image) {
          setHeroContent(prev => ({ ...prev, url: business.hero_image }));
        }
        if (business.hero_heading) {
          setHeroContent(prev => ({ ...prev, heading: business.hero_heading }));
        }
        if (business.hero_subheading) {
          setHeroContent(prev => ({ ...prev, subheading: business.hero_subheading }));
        }
        if (business.hero_cta_primary) {
          setHeroContent(prev => ({ ...prev, ctaPrimary: business.hero_cta_primary }));
        }
        if (business.hero_cta_secondary) {
          setHeroContent(prev => ({ ...prev, ctaSecondary: business.hero_cta_secondary }));
        }
        // Collection images
        if (business.collection_images && Array.isArray(business.collection_images)) {
          setCollectionImages(business.collection_images);
        }
      }
    } catch (err) {
      // silent — fallback to defaults
    }
  };

  const handleSaveHero = async () => {
    setIsSavingHero(true);
    try {
      await settingsApi.saveBusiness({
        hero_image: heroContent.url,
        hero_heading: heroContent.heading,
        hero_subheading: heroContent.subheading,
        hero_cta_primary: heroContent.ctaPrimary,
        hero_cta_secondary: heroContent.ctaSecondary,
      });
      toast.success('Hero content saved successfully');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleSaveCollection = async () => {
    setIsSavingCollection(true);
    try {
      await settingsApi.saveBusiness({ collection_images: collectionImages });
      toast.success('Collection images saved — changes are live on the landing page!');
    } catch (err: any) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingCollection(false);
    }
  };

  /**
   * Upload a file to Supabase Storage and return the public URL.
   * Falls back to base64 DataURL if Storage upload fails (e.g. bucket not created yet).
   */
  const uploadToStorage = async (file: File, folder: string): Promise<string> => {
    try {
      const url = await storageHelpers.uploadAdminAsset(folder, file);
      return url;
    } catch (err: any) {
      // Storage bucket may not exist yet — fall back to base64 for local preview
      console.warn(`Storage upload failed (${folder}), falling back to base64:`, err?.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast.error('Please upload a valid image or video file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploadingHero(true);
    try {
      const url = await uploadToStorage(file, 'hero');
      setHeroContent(prev => ({
        ...prev,
        type: isVideo ? 'video' : 'image',
        url,
      }));
      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded — click Save to apply`);
    } catch (err: any) {
      toast.error('Upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsUploadingHero(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const handleUrlInput = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    setHeroContent(prev => ({ ...prev, type: isVideo ? 'video' : 'image', url }));
  };

  const handleCollectionImageUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be less than 20MB');
      return;
    }

    setUploadingSlot(slotIndex);
    try {
      const url = await uploadToStorage(file, 'collection');
      const updated = [...collectionImages];
      updated[slotIndex] = url;
      setCollectionImages(updated);
      setLoadedSlot(slotIndex);
      toast.success(`Slot ${slotIndex + 1} image uploaded — click "Save Collection Images" to apply`);
    } catch (err: any) {
      toast.error('Upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleCollectionUrlChange = (slotIndex: number, url: string) => {
    const updated = [...collectionImages];
    updated[slotIndex] = url;
    setCollectionImages(updated);
  };

  const clearCollectionSlot = (slotIndex: number) => {
    const updated = [...collectionImages];
    updated[slotIndex] = DEFAULT_COLLECTION_IMGS[slotIndex];
    setCollectionImages(updated);
    toast.info(`Slot ${slotIndex + 1} reset to default`);
  };

  return (
    <div className="space-y-8">

      {/* ── HERO SECTION ── */}
      <Card className="glass-luxury border-[#c9a961]/20">
        <CardHeader>
          <CardTitle className="serif-heading text-[#f8f6f0]">Hero Section Content</CardTitle>
          <CardDescription className="text-slate-400">
            Upload a video or image for the landing page full-screen hero banner. Videos create a cinematic experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-[#f8f6f0]">Upload Media (Image or Video)</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#c9a961]/30 hover:bg-[#c9a961]/10 text-[#f8f6f0]"
                onClick={() => document.getElementById('hero-file-upload')?.click()}
                disabled={isUploadingHero}
              >
                {isUploadingHero ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload File</>
                )}
              </Button>
              <input
                id="hero-file-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-xs text-slate-500">Max 50 MB · Recommended: <span className="text-[#c9a961]">1920×1080 px (16:9)</span> or higher for images, MP4 for videos</p>
          </div>

          {/* URL Input */}
          <div className="space-y-3">
            <Label htmlFor="hero-url" className="text-[#f8f6f0]">Or Enter Media URL</Label>
            <Input
              id="hero-url"
              type="url"
              placeholder="https://example.com/hero-video.mp4"
              value={heroContent.url}
              onChange={(e) => handleUrlInput(e.target.value)}
              className="bg-[#1a1a24]/60 border-[#c9a961]/20 text-[#f8f6f0]"
            />
          </div>

          {/* Preview */}
          {heroContent.url && (
            <div className="space-y-3">
              <Label className="text-[#f8f6f0]">Preview</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a24]/60 border border-[#c9a961]/20">
                {heroContent.type === 'video' ? (
                  <video src={heroContent.url} className="w-full h-full object-cover" autoPlay muted loop />
                ) : (
                  <img src={heroContent.url} alt="Hero preview" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 px-3 py-1 bg-[#1a1a24]/80 rounded-full text-xs text-[#c9a961] border border-[#c9a961]/30">
                  {heroContent.type === 'video' ? (
                    <><Video className="w-3 h-3 inline mr-1" /> Video</>
                  ) : (
                    <><ImageIcon className="w-3 h-3 inline mr-1" /> Image</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-4 pt-4 border-t border-[#c9a961]/10">
            <div className="space-y-3">
              <Label htmlFor="hero-heading" className="text-[#f8f6f0]">Main Heading</Label>
              <Input
                id="hero-heading"
                type="text"
                placeholder="Timeless Elegance"
                value={heroContent.heading}
                onChange={(e) => setHeroContent(prev => ({ ...prev, heading: e.target.value }))}
                className="bg-[#1a1a24]/60 border-[#c9a961]/20 text-[#f8f6f0] serif-heading text-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="hero-subheading" className="text-[#f8f6f0]">Subheading</Label>
              <Textarea
                id="hero-subheading"
                placeholder="Crafted with precision, designed for distinction"
                value={heroContent.subheading}
                onChange={(e) => setHeroContent(prev => ({ ...prev, subheading: e.target.value }))}
                className="bg-[#1a1a24]/60 border-[#c9a961]/20 text-[#f8f6f0] min-h-[80px]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="cta-primary" className="text-[#f8f6f0]">Primary Button Text</Label>
                <Input
                  id="cta-primary"
                  type="text"
                  placeholder="Explore Collection"
                  value={heroContent.ctaPrimary}
                  onChange={(e) => setHeroContent(prev => ({ ...prev, ctaPrimary: e.target.value }))}
                  className="bg-[#1a1a24]/60 border-[#c9a961]/20 text-[#f8f6f0]"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="cta-secondary" className="text-[#f8f6f0]">Secondary Button Text</Label>
                <Input
                  id="cta-secondary"
                  type="text"
                  placeholder="Our Story"
                  value={heroContent.ctaSecondary}
                  onChange={(e) => setHeroContent(prev => ({ ...prev, ctaSecondary: e.target.value }))}
                  className="bg-[#1a1a24]/60 border-[#c9a961]/20 text-[#f8f6f0]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveHero}
              disabled={isSavingHero}
              className="bg-[#c9a961] hover:bg-[#b8926a] text-[#0a0a0a] elegant-button"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingHero ? 'Saving…' : 'Save Hero Content'}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* ── CRAFTED FOR THE BOLD — COLLECTION IMAGES ── */}
      <Card className="glass-luxury border-[#c9a961]/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="serif-heading text-[#f8f6f0] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#c9a961]" />
                "Crafted for the Bold" — Collection Images
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Upload the 4 images displayed in the collections grid on the landing page.
                Each slot has a specific recommended aspect ratio — uploading the correct ratio ensures
                the image fills its tile perfectly without cropping important details.
              </CardDescription>
            </div>
          </div>

          {/* Ratio legend */}
          <div className="mt-4 p-3 rounded-xl border border-[#c9a961]/15 bg-[#c9a961]/5 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#c9a961]" /> <span>All images use <strong className="text-[#c9a961]">object-cover</strong> — the image fills its tile, cropping from the edges. Keep the main subject centred.</span></div>
            <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#c9a961]" /> <span>Images are uploaded to <strong className="text-white">Supabase Storage</strong> — only the URL is stored, not the raw file data.</span></div>
            <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#c9a961]" /> <span>Max file size per slot: <strong className="text-white">20 MB</strong></span></div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {COLLECTION_SLOTS.map((slot) => (
            <div
              key={slot.index}
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: slot.borderColor, background: slot.bgColor }}
            >
              {/* Slot header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-[#c9a961]/10">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#c9a961]/15 border border-[#c9a961]/30 flex items-center justify-center text-[#c9a961] text-xs font-bold">
                    {slot.index + 1}
                  </span>
                  <div>
                    <p className="text-[#f8f6f0] text-sm font-semibold">{slot.label}</p>
                    <p className="text-slate-500 text-xs">{slot.cols} · min-height {slot.minH}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-[#c9a961]/40 text-[#c9a961] text-xs px-3 py-0.5"
                  >
                    {slot.ratioLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-slate-600 text-slate-400 text-xs px-3 py-0.5"
                  >
                    {slot.recommended}
                  </Badge>
                  {uploadingSlot === slot.index && (
                    <Badge className="bg-blue-700/20 text-blue-400 border-blue-500/30 text-xs">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading…
                    </Badge>
                  )}
                  {loadedSlot === slot.index && uploadingSlot !== slot.index && (
                    <Badge className="bg-emerald-700/20 text-emerald-400 border-emerald-500/30 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
                    </Badge>
                  )}
                </div>
              </div>

              {/* Slot body */}
              <div className="p-5 grid md:grid-cols-2 gap-5">
                {/* Left — controls */}
                <div className="space-y-4">
                  {/* Ratio hint */}
                  <div className="p-3 rounded-xl bg-black/30 border border-[#c9a961]/10 text-xs text-slate-400 leading-relaxed">
                    <span className="text-[#c9a961] font-semibold">Recommended ratio:</span>{' '}
                    <span className="text-white font-bold">{slot.ratioLabel}</span>
                    {' · '}
                    <span className="text-white">{slot.recommended}</span>
                    <br />
                    <span className="mt-1 block">{slot.hint}</span>
                  </div>

                  {/* Upload button */}
                  <div>
                    <Label className="text-[#f8f6f0] text-xs mb-2 block">Upload Image</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-[#c9a961]/30 hover:bg-[#c9a961]/10 text-[#f8f6f0]"
                      onClick={() => document.getElementById(`collection-upload-${slot.index}`)?.click()}
                      disabled={uploadingSlot === slot.index}
                    >
                      {uploadingSlot === slot.index ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload className="w-3.5 h-3.5 mr-2" /> Choose Image</>
                      )}
                    </Button>
                    <input
                      id={`collection-upload-${slot.index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCollectionImageUpload(slot.index, e)}
                    />
                    <p className="text-xs text-slate-600 mt-1.5">
                      JPG, PNG, WEBP · max 20 MB · ratio {slot.ratio} · min {slot.recommended}
                    </p>
                  </div>

                  {/* URL input */}
                  <div>
                    <Label className="text-[#f8f6f0] text-xs mb-2 block">Or paste Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={collectionImages[slot.index] || ''}
                        onChange={(e) => handleCollectionUrlChange(slot.index, e.target.value)}
                        className="bg-[#1a1a24]/60 border-[#c9a961]/20 text-[#f8f6f0] text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-slate-500 hover:text-red-400"
                        onClick={() => clearCollectionSlot(slot.index)}
                        title="Reset to default"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right — preview */}
                <div className="space-y-2">
                  <Label className="text-[#f8f6f0] text-xs">Preview</Label>
                  <div
                    className="relative rounded-xl overflow-hidden bg-[#1a1a24]/60 border border-[#c9a961]/20 w-full"
                    style={{
                      aspectRatio: slot.ratio.replace(':', '/'),
                      maxHeight: '240px',
                    }}
                  >
                    {uploadingSlot === slot.index ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c9a961] gap-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs">Uploading to Storage…</span>
                      </div>
                    ) : collectionImages[slot.index] ? (
                      <img
                        src={collectionImages[slot.index]}
                        alt={`Preview ${slot.label}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs">No image uploaded</span>
                      </div>
                    )}

                    {/* Ratio watermark */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] text-[#c9a961] border border-[#c9a961]/30">
                      {slot.ratio}
                    </div>
                  </div>

                  {/* Visual grid position indicator */}
                  <div className="mt-2 p-2 rounded-lg bg-black/30 border border-[#c9a961]/10">
                    <p className="text-[10px] text-slate-500 mb-1.5">Grid position on landing page:</p>
                    <div className="grid grid-cols-4 gap-1 h-10">
                      {[0, 1, 2, 3].map((gi) => {
                        const isThis = gi === slot.index;
                        const isWide = gi === 0 || gi === 3;
                        if (gi === 1 && slot.index === 3) return null; // skip — slot 3 uses col-span-2 below
                        return (
                          <div
                            key={gi}
                            className={`rounded ${isThis ? 'bg-[#c9a961]/50 border border-[#c9a961]' : 'bg-[#c9a961]/08 border border-[#c9a961]/15'} ${isWide && gi === 0 ? 'col-span-2' : ''} flex items-center justify-center text-[9px] font-bold`}
                            style={{
                              gridColumn: gi === 3 ? 'span 2' : undefined,
                              color: isThis ? '#c9a961' : '#555',
                            }}
                          >
                            {gi + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Save all collection images */}
          <div className="flex items-center justify-between pt-4 border-t border-[#c9a961]/10">
            <p className="text-xs text-slate-500">
              Saving updates all 4 collection tiles on the landing page immediately.
            </p>
            <Button
              onClick={handleSaveCollection}
              disabled={isSavingCollection || uploadingSlot !== null}
              className="bg-[#c9a961] hover:bg-[#b8926a] text-[#0a0a0a] elegant-button"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingCollection ? 'Saving…' : 'Save Collection Images'}
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* ── BEST PRACTICES ── */}
      <Card className="glass-luxury border-[#c9a961]/20">
        <CardHeader>
          <CardTitle className="text-[#f8f6f0]">Image Upload Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[#c9a961] text-xs uppercase tracking-widest font-semibold">Hero Banner</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span>Use <strong className="text-white">1920×1080 px (16:9)</strong> for images or <strong className="text-white">4K (3840×2160)</strong> for videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span>Keep videos under 30 seconds &amp; under 50 MB for fast loading</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span>Ensure high contrast between the heading text and background</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span>Test on mobile — keep the focal point within the central 60%</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[#c9a961] text-xs uppercase tracking-widest font-semibold">Collection Grid</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span><strong className="text-white">Slot 1 (Hoodies):</strong> 4:5 portrait — min 800×1000 px, dark or neutral background</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span><strong className="text-white">Slots 2 &amp; 3 (T-Shirts / Streetwear):</strong> 1:1 square — min 600×600 px, centred subject</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span><strong className="text-white">Slot 4 (Custom Prints):</strong> 3:1 panoramic — min 1200×400 px, wide lifestyle or flat-lay</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span>Export as <strong className="text-white">WEBP</strong> for best quality-to-size ratio; JPEG at 85% quality also works</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5 shrink-0" />
                  <span>Files are uploaded to <strong className="text-white">Supabase Storage</strong> — only URLs are saved in the database (no base64 bloat)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}