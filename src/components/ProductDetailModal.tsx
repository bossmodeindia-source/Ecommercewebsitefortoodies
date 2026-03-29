import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Minus, Plus, ShoppingCart, Heart, Share2, Star, Truck, Shield, RefreshCw, X, Sparkles, Package, Ruler, Palette, Check, Info } from 'lucide-react';
import { Product, ProductVariation, ThreeDModelConfig } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { Advanced2DDesigner } from './Advanced2DDesigner';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variationId: string, quantity: number) => void;
  onBuyNow?: (productId: string, variationId: string, quantity: number) => void;
}

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart, onBuyNow }: ProductDetailModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [is2DDesignerOpen, setIs2DDesignerOpen] = useState(false);
  const [modelConfig, setModelConfig] = useState<ThreeDModelConfig | null>(null);

  // Initialize selected variation based on color and size
  useEffect(() => {
    if (product) {
      if (selectedColor && selectedSize) {
        const variation = product.variations.find(v => v.color === selectedColor && v.size === selectedSize);
        setSelectedVariation(variation || null);
      } else if (selectedColor) {
        const variation = product.variations.find(v => v.color === selectedColor);
        // Don't auto-set variation yet, wait for size
      }
    }
  }, [selectedColor, selectedSize, product]);

  // Reset state when opening a new product
  useEffect(() => {
    if (isOpen) {
      setSelectedVariation(null);
      setQuantity(1);
      setSelectedColor(null);
      setSelectedSize(null);
    }
  }, [isOpen, product]);

  // Load 3D model config for this product
  useEffect(() => {
    if (product) {
      const config = storageUtils.get3DModelConfigByProductId(product.id);
      setModelConfig(config);
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (selectedVariation) {
      onAddToCart(product.id, selectedVariation.id, quantity);
      onClose();
    }
  };

  const handleBuyNow = () => {
    if (selectedVariation && onBuyNow) {
      onBuyNow(product.id, selectedVariation.id, quantity);
      onClose();
    }
  };

  const handle2DDesignerClick = () => {
    // Check if external 3D website integration is enabled
    const integration = storageUtils.get3DWebsiteIntegration();
    
    if (integration.isEnabled && integration.websiteUrl) {
      // Open external 3D designer website in new tab
      window.open(integration.websiteUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening 3D Designer...', {
        description: 'Create your design and it will be saved to your account'
      });
      return;
    }
    
    // Fallback to internal 3D designer
    if (!modelConfig) {
      toast.error('3D Designer not configured for this product', {
        description: 'Please contact admin to set up 3D customization'
      });
      return;
    }
    setIs2DDesignerOpen(true);
  };

  const handleSaveDesign = (design: any) => {
    const currentUser = storageUtils.getCurrentUser();
    if (!currentUser) {
      toast.error('Please login to save designs');
      return;
    }

    const savedDesign = {
      id: Date.now().toString(),
      name: `${product.name} - Custom Design`,
      productId: product.id,
      color: design.color,
      size: design.size,
      fabric: design.fabric,
      printingMethod: design.printingMethod,
      printingCost: design.printingCost,
      designUploads: design.designUploads,
      createdAt: new Date().toISOString(),
      thumbnailUrl: design.thumbnailUrl,
      category: product.category,
      canvasSnapshot: design.canvasSnapshot,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name || currentUser.email,
      paymentStatus: 'unpaid' as const
    };

    currentUser.savedCustomerDesigns = currentUser.savedCustomerDesigns || [];
    currentUser.savedCustomerDesigns.push(savedDesign);
    storageUtils.updateCurrentUser(currentUser);

    toast.success('Design saved to your Studio!');
    setIs2DDesignerOpen(false);
  };

  const uniqueColors = [...new Set(product.variations.map(v => v.color))];
  const uniqueSizes = [...new Set(product.variations.map(v => v.size))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] bg-black border-2 border-cyan-500/30 p-0 rounded-3xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0 h-full max-h-[90vh]">
          {/* Left Side: Image Gallery */}
          <div className="relative bg-[#0f172a] p-8 flex items-center justify-center border-r border-cyan-500/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full aspect-[4/5] relative rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/30"
              >
                <ImageWithFallback
                  src={product.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </motion.div>
            </AnimatePresence>
            
            <div className="absolute top-6 left-6">
              <span className="px-4 py-2 rounded-full bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold tracking-widest uppercase">
                Premium Collection
              </span>
            </div>
          </div>

          {/* Right Side: Product Info - Scrollable */}
          <div className="overflow-y-auto bg-black">
            <div className="p-8 space-y-6">
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <span>{product.category}</span>
                  <span>•</span>
                  <span className="text-cyan-400">{product.gender}</span>
                </div>
                <DialogTitle className="text-4xl font-bold text-white tracking-tight leading-tight">
                  {product.name}
                </DialogTitle>
                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    ₹{selectedVariation ? selectedVariation.price.toLocaleString('en-IN') : product.basePrice.toLocaleString('en-IN')}
                  </span>
                  {selectedVariation && selectedVariation.price > product.basePrice && (
                    <span className="text-slate-500 line-through text-lg">₹{product.basePrice.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </DialogHeader>

              {/* Description */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-slate-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    Color: <span className="text-cyan-400">{selectedColor || 'Select'}</span>
                  </Label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`group relative w-12 h-12 rounded-full border-2 transition-all p-0.5 ${ 
                        selectedColor === color ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-500/50' : 'border-white/20 hover:border-white/40'
                      }`}
                      title={color}
                    >
                      <div 
                        className="w-full h-full rounded-full shadow-inner" 
                        style={{ backgroundColor: color.toLowerCase() }} 
                      />
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className={`w-5 h-5 ${['white', 'yellow', 'beige'].includes(color.toLowerCase()) ? 'text-black' : 'text-white'}`} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-cyan-400" />
                    Size: <span className="text-cyan-400">{selectedSize || 'Select'}</span>
                  </Label>
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 underline uppercase tracking-wider transition-colors font-bold">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uniqueSizes.map((size) => {
                    const isAvailable = product.variations.some(v => v.size === size && (selectedColor ? v.color === selectedColor : true));
                    return (
                      <button
                        key={size}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[60px] h-12 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                          selectedSize === size
                            ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/30'
                            : isAvailable
                            ? 'bg-white/5 border-white/20 text-white hover:border-cyan-500/50 hover:bg-white/10'
                            : 'bg-transparent border-white/10 text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & Stock Info */}
              {selectedVariation && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-white uppercase tracking-wider">
                      Quantity
                    </Label>
                    <p className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      selectedVariation.stock < 10 
                        ? 'text-orange-300 bg-orange-500/20 border border-orange-500/30' 
                        : 'text-green-300 bg-green-500/20 border border-green-500/30'
                    }`}>
                      {selectedVariation.stock < 10 ? `Only ${selectedVariation.stock} left!` : 'In Stock'}
                    </p>
                  </div>
                  <Select
                    value={quantity.toString()}
                    onValueChange={(val) => setQuantity(parseInt(val))}
                  >
                    <SelectTrigger className="bg-[#0f172a] border-2 border-cyan-500/30 text-white h-12 rounded-xl hover:border-cyan-500/50 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f172a] border-cyan-500/30 text-white">
                      {Array.from({ length: Math.min(selectedVariation.stock, 10) }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Printing Methods */}
              {product.printingMethods && product.printingMethods.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                    Available Print Methods
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {product.printingMethods.map((method) => (
                      <span 
                        key={method} 
                        className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 space-y-3 border-t border-white/10">
                {/* 3D Designer Button */}
                {modelConfig && (
                  <Button
                    className="w-full py-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-base border-0 shadow-xl transition-all active:scale-[0.98]"
                    onClick={handle2DDesignerClick}
                  >
                    <Palette className="w-5 h-5 mr-3" />
                    Create Custom Design
                  </Button>
                )}
                
                {/* Add to Cart Button */}
                <Button
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-base border-0 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={!selectedVariation}
                >
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  {selectedVariation 
                    ? `Add to Cart • ₹${(selectedVariation.price * quantity).toLocaleString('en-IN')}` 
                    : 'Select Color & Size'}
                </Button>
                
                {/* Buy Now Button */}
                {onBuyNow && (
                  <Button
                    className="w-full py-6 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-white font-bold text-base border-0 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    onClick={handleBuyNow}
                    disabled={!selectedVariation}
                  >
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    {selectedVariation 
                      ? `Buy Now • ₹${(selectedVariation.price * quantity).toLocaleString('en-IN')}` 
                      : 'Select Color & Size'}
                  </Button>
                )}
                
                {/* Info Footer */}
                <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest pt-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>10-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 3D Designer Modal */}
      {modelConfig && (
        <Advanced2DDesigner
          isOpen={is2DDesignerOpen}
          onClose={() => setIs2DDesignerOpen(false)}
          modelConfig={modelConfig}
          productName={product.name}
          productId={product.id}
          onSaveDesign={handleSaveDesign}
        />
      )}
    </Dialog>
  );
}