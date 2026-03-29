import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, Video, Image as ImageIcon, X, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { storageUtils } from '../utils/storage';

interface HeroContent {
  type: 'video' | 'image';
  url: string;
  heading: string;
  subheading: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function HeroContentSettings() {
  const [heroContent, setHeroContent] = useState<HeroContent>({
    type: 'image',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80',
    heading: 'Timeless Elegance',
    subheading: 'Crafted with precision, designed for distinction',
    ctaPrimary: 'Explore Collection',
    ctaSecondary: 'Our Story'
  });

  useEffect(() => {
    const saved = localStorage.getItem('heroContent');
    if (saved) {
      setHeroContent(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('heroContent', JSON.stringify(heroContent));
    toast.success('Hero content updated successfully');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Please upload a valid image or video file');
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setHeroContent(prev => ({
        ...prev,
        type: isVideo ? 'video' : 'image',
        url: event.target?.result as string
      }));
      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = (url: string) => {
    // Detect if URL is video or image
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    
    setHeroContent(prev => ({
      ...prev,
      type: isVideo ? 'video' : 'image',
      url
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="glass-luxury border-[#c9a961]/20">
        <CardHeader>
          <CardTitle className="serif-heading text-[#f8f6f0]">Hero Section Content</CardTitle>
          <CardDescription className="text-slate-400">
            Upload a video or image for the landing page hero section. Videos create a cinematic experience.
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
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <input
                id="hero-file-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-xs text-slate-500">Max 50MB. Recommended: 1920x1080px or higher for images, MP4 format for videos</p>
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
                  <video
                    src={heroContent.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={heroContent.url}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                  />
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

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              className="bg-[#c9a961] hover:bg-[#b8926a] text-[#0a0a0a] elegant-button"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Hero Content
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="glass-luxury border-[#c9a961]/20">
        <CardHeader>
          <CardTitle className="text-[#f8f6f0]">Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5" />
              <span>Use high-quality videos (1920x1080 or 4K) for the best impression</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5" />
              <span>Keep videos under 30 seconds for optimal loading</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5" />
              <span>Ensure good contrast between text and background</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961] mt-1.5" />
              <span>Test on mobile devices - videos should have a clear focal point</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
