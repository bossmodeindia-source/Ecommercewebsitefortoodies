import { useState } from 'react';
import { Product, ProductVariation } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, variationId: string, quantity: number) => void;
}

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    if (selectedVariation) {
      onAddToCart(product.id, selectedVariation.id, quantity);
      onClose();
    }
  };

  const uniqueColors = [...new Set(product.variations.map(v => v.color))];
  const uniqueSizes = [...new Set(product.variations.map(v => v.size))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image ? (
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-purple-600">${product.basePrice.toFixed(2)}</p>
              <p className="text-sm text-gray-600 capitalize mt-1">For {product.gender}</p>
            </div>

            <p className="text-gray-700">{product.description}</p>

            <div className="space-y-3">
              <div>
                <Label>Select Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-full border-2 hover:border-purple-500 transition-colors"
                      style={{ 
                        backgroundColor: color.toLowerCase(),
                        borderColor: selectedVariation?.color === color ? '#9333ea' : '#d1d5db'
                      }}
                      onClick={() => {
                        const variation = product.variations.find(v => v.color === color);
                        if (variation) setSelectedVariation(variation);
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="size">Select Size</Label>
                <Select
                  value={selectedVariation?.size || ''}
                  onValueChange={(size) => {
                    const variation = product.variations.find(v => v.size === size && (!selectedVariation || v.color === selectedVariation.color));
                    if (variation) setSelectedVariation(variation);
                  }}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Choose size" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVariation && (
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Select
                    value={quantity.toString()}
                    onValueChange={(val) => setQuantity(parseInt(val))}
                  >
                    <SelectTrigger id="quantity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(selectedVariation.stock, 10) }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">{selectedVariation.stock} available</p>
                </div>
              )}

              {product.printingMethods.length > 0 && (
                <div>
                  <Label>Available Printing Methods</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.printingMethods.map((method) => (
                      <span key={method} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={!selectedVariation}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart - ${selectedVariation?.price.toFixed(2) || '0.00'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
