import { CartItem, Product } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from './ui/sheet';
import { Button } from './ui/button';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, ShoppingBag, ArrowRight, X, Zap } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface ShoppingCartProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: string, variationId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variationId: string) => void;
  onCheckout: () => void;
  onBuyNow: (productId: string, variationId: string) => void;
}

export function ShoppingCart({ cart, products, onUpdateQuantity, onRemoveItem, onCheckout, onBuyNow }: ShoppingCartProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCartItemDetails = (item: CartItem) => {
    const product = products.find(p => p.id === item.productId);
    const variation = product?.variations.find(v => v.id === item.variationId);
    return { product, variation };
  };

  const subtotal = cart.reduce((sum, item) => {
    const { variation } = getCartItemDetails(item);
    return sum + (variation?.price || 0) * item.quantity;
  }, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative h-11 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 rounded-xl px-4 group transition-all duration-300">
          <CartIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] bg-[#d4af37] text-black font-black border-0 shadow-lg shadow-[#d4af37]/20 min-w-[20px] justify-center">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-black border-l border-white/5 p-0 overflow-hidden selection:bg-[#d4af37]/30">
        <SheetHeader className="p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#d4af37]/10 p-3 rounded-2xl border border-[#d4af37]/20">
                <ShoppingBag className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div className="text-left">
                <SheetTitle className="text-white text-2xl font-black uppercase tracking-tight">Your Cart</SheetTitle>
                <SheetDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[2px]">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} ready for curation
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse" />
                <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center relative z-10">
                  <CartIcon className="w-10 h-10 text-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-black text-xl uppercase tracking-tight">Your cart is empty</p>
                <p className="text-slate-500 text-sm max-w-[240px] mx-auto font-light leading-relaxed">
                  The gallery of your selections is currently vacant. Begin your design journey.
                </p>
              </div>
              <SheetTrigger asChild>
                <Button className="glow-button h-14 px-10 rounded-2xl font-black uppercase tracking-[2px] text-xs">
                  Start Shopping
                </Button>
              </SheetTrigger>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {cart.map((item) => {
                  const { product, variation } = getCartItemDetails(item);
                  if (!product || !variation) return null;

                  return (
                    <motion.div 
                      key={`${item.productId}-${item.variationId}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative flex gap-5 bg-white/[0.02] border border-white/5 p-5 rounded-[24px] hover:border-[#d4af37]/30 transition-all duration-500 luxury-glow-hover"
                    >
                      <div className="w-24 h-24 bg-black rounded-2xl flex-shrink-0 overflow-hidden border border-white/5">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-white text-sm uppercase tracking-tight truncate pr-4">{product.name}</h4>
                            <button
                              onClick={() => onRemoveItem(item.productId, item.variationId)}
                              className="text-slate-600 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-[10px] text-[#d4af37] font-bold mt-1 uppercase tracking-[2px]">
                            {variation.color} <span className="text-slate-700 mx-1">/</span> {variation.size}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <p className="font-black text-white text-base">
                            ₹{variation.price.toLocaleString('en-IN')}
                          </p>
                          <div className="flex items-center bg-black rounded-xl border border-white/10 p-1.5">
                            <button
                              onClick={() => onUpdateQuantity(item.productId, item.variationId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 disabled:opacity-20 transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-10 text-center text-xs font-black text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.productId, item.variationId, item.quantity + 1)}
                              disabled={item.quantity >= variation.stock}
                              className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 disabled:opacity-20 transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {item.customDesignUrl && (
                          <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#d4af37]/5 border border-[#d4af37]/20 w-fit">
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse shadow-[0_0_8px_#d4af37]" />
                            <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-[1px]">Bespoke Masterpiece</p>
                          </div>
                        )}
                        
                        {/* Buy Now Button for Individual Item */}
                        <Button
                          onClick={() => onBuyNow(item.productId, item.variationId)}
                          className="mt-3 w-full h-10 bg-white/5 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] font-black text-[10px] uppercase tracking-[2px] rounded-xl transition-all duration-300 group/buy"
                        >
                          <Zap className="w-3.5 h-3.5 mr-2 transition-transform group-hover/buy:scale-110" />
                          Buy Now
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <SheetFooter className="p-8 bg-black border-t border-white/5 sm:flex-col space-y-6">
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px] uppercase tracking-[3px] font-bold">Consolidated Total</span>
                <span className="text-white font-black text-2xl tracking-tight">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
                <span className="text-[#d4af37] text-[9px] uppercase tracking-[2px] font-bold">Logistics & Taxes</span>
                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-[1px]">Curation pending</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full h-16 bg-[#d4af37] hover:bg-[#c9a227] text-black font-black text-base uppercase tracking-[4px] border-0 shadow-2xl shadow-[#d4af37]/20 rounded-[20px] group transition-all duration-500 active:scale-[0.98]"
                onClick={onCheckout}
              >
                Checkout All Items
                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2" />
              </Button>
              
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <p className="text-[9px] text-center text-slate-600 uppercase tracking-[2px] font-bold">
                  Bespoke fulfillment verified
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}