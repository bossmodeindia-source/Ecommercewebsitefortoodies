import { Product } from '../types';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const minPrice = Math.min(...product.variations.map(v => v.price));
  const maxPrice = Math.max(...product.variations.map(v => v.price));

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden glass-card glass-card-hover border-cyan-500/20">
        <div className="aspect-square overflow-hidden bg-[#0f172a]/30 relative">
          {product.image ? (
            <>
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              No Image
            </div>
          )}
          <div className="absolute top-3 right-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-cyan-500/30 to-teal-500/30 p-2 rounded-lg backdrop-blur-sm border border-cyan-500/30"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.div>
          </div>
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-1 text-cyan-100">{product.name}</h3>
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-xl bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                ${minPrice.toFixed(2)}
                {minPrice !== maxPrice && ` - $${maxPrice.toFixed(2)}`}
              </p>
              <p className="text-xs text-slate-500 capitalize">{product.gender}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {product.variations.slice(0, 3).map((v) => (
                <motion.div
                  key={v.id}
                  whileHover={{ scale: 1.2 }}
                  className="w-5 h-5 rounded-full border-2 border-cyan-500/40 shadow-lg"
                  style={{ backgroundColor: v.color.toLowerCase() }}
                  title={v.color}
                />
              ))}
              {product.variations.length > 3 && (
                <span className="text-xs text-slate-400 flex items-center">+{product.variations.length - 3}</span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0 rounded-xl"
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
