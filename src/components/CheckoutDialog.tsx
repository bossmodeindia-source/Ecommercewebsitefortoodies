import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { ShoppingCart, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { CartItem, Product } from '../types';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: (shippingAddress: string) => void;
  cart: CartItem[];
  products: Product[];
  total: number;
  discount?: number;
  couponCode?: string;
  shippingAddress?: string;
}

export function CheckoutDialog({ 
  isOpen, 
  onClose, 
  onProceedToPayment, 
  cart, 
  products, 
  total,
  discount = 0,
  couponCode,
  shippingAddress: initialAddress = ''
}: CheckoutDialogProps) {
  const [shippingAddress, setShippingAddress] = useState(initialAddress);

  // Update when initial values change
  useEffect(() => {
    setShippingAddress(initialAddress);
  }, [initialAddress, isOpen]);

  const handleProceed = () => {
    if (!shippingAddress.trim()) {
      toast.error('Please enter your shipping address');
      return;
    }

    onProceedToPayment(shippingAddress);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-2 border-cyan-500/30 bg-[#0a0e1a] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-100 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-cyan-400" />
            Checkout
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Review your order and provide delivery details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Order Summary */}
          <Card className="glass-card border border-cyan-500/20">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-cyan-100 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Order Summary
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cart.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  const variation = product.variations.find(v => v.id === item.variationId);
                  const price = variation?.price || product.basePrice;

                  return (
                    <div key={`${item.productId}-${item.variationId}`} className="flex items-center gap-3 p-3 bg-[#0f172a]/30 rounded-lg border border-cyan-500/10">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="text-cyan-100 font-medium">{product.name}</h4>
                        <p className="text-sm text-slate-400">
                          {variation?.color} • {variation?.size}
                        </p>
                        <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-100 font-bold">₹{(price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>₹{(total + discount).toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount {couponCode && `(${couponCode})`}</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-cyan-100 pt-2 border-t border-cyan-500/20">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="glass-card border border-cyan-500/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-cyan-100">Shipping Address</h3>
              </div>
              
              <div className="space-y-2">
                <Label className="text-cyan-100">Full Address *</Label>
                <Textarea
                  placeholder="Enter your complete shipping address including street, city, state, and PIN code"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 min-h-24"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Info Message */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-sm text-cyan-200">
              💡 After clicking "Proceed to Payment", you'll be able to choose your preferred payment method 
              (Razorpay, UPI, or Cash on Delivery)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleProceed}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0 py-6 text-lg"
            >
              Proceed to Payment
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 py-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
