import { Product } from '../types';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ShoppingCart, Sparkles, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { storageUtils } from '../utils/storage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDesigner?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onOpenDesigner }: ProductCardProps) {
  const minPrice = Math.min(...product.variations.map(v => v.price));
  const maxPrice = Math.max(...product.variations.map(v => v.price));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [has2DModel, setHas2DModel] = useState(false);

  useEffect(() => {
    const config = storageUtils.get3DModelConfigByProductId(product.id);
    setHas2DModel(!!config);
  }, [product.id]);
  
  // Use multiple images if available, otherwise fall back to single image
  const displayImages = product.images && product.images.length > 0 
    ? product.images 
    : product.image 
    ? [product.image] 
    : [];

  // Auto-rotate images on hover
  useEffect(() => {
    if (!isHovered || displayImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 1000); // Change image every 1 second

    return () => clearInterval(interval);
  }, [isHovered, displayImages.length]);

  // Reset to first image when not hovering
  useEffect(() => {
    if (!isHovered) {
      setCurrentImageIndex(0);
    }
  }, [isHovered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -12 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="group overflow-hidden glass-card glass-card-hover luxury-border rounded-[32px] border-[#d4af37]/10 hover:border-[#d4af37]/40 transition-all duration-500">
        <div className="aspect-square overflow-hidden bg-black/40 relative">
          {displayImages.length > 0 ? (
            <>
              <motion.div
                animate={{ scale: isHovered ? 1.15 : 1 }}
                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                className="w-full h-full"
              >
                <ImageWithFallback
                  src={displayImages[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              {/* Gold overlay on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-black/20"
              />
              {/* Image indicators */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {displayImages.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'w-8 bg-[#d4af37]'
                          : 'w-2 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 uppercase tracking-widest text-[10px] font-bold">
              No Image
            </div>
          )}
          <motion.div
            className="absolute top-4 right-4"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-black/60 p-2.5 rounded-xl backdrop-blur-md border border-[#d4af37]/30">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
            </div>
          </motion.div>
        </div>
        <CardContent className="pt-6">
          <h3 className="font-bold text-xl mb-2 text-white group-hover:text-[#d4af37] transition-colors tracking-wide">{product.name}</h3>
          <p className="text-sm text-slate-500 mb-4 line-clamp-2 font-light leading-relaxed">{product.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-2xl text-white">
                ₹{minPrice.toFixed(0)}
                {minPrice !== maxPrice && ` - ₹${maxPrice.toFixed(0)}`}
              </p>
              <p className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold mt-1">{product.gender}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.variations.slice(0, 3).map((v) => (
                <motion.div
                  key={v.id}
                  whileHover={{ scale: 1.2 }}
                  className="w-5 h-5 rounded-full border border-white/20 shadow-md"
                  style={{ backgroundColor: v.color.toLowerCase() }}
                  title={v.color}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 p-6 pt-0">
          {has2DModel && onOpenDesigner && (
            <Button
              className="w-full glow-button font-bold rounded-2xl h-14"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDesigner(product);
              }}
            >
              <Palette className="w-4 h-4 mr-2" />
              Launch Studio
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded-2xl h-14 font-bold transition-all duration-300"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}