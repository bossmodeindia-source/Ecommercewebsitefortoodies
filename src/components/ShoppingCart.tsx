import { CartItem, Product } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface ShoppingCartProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: string, variationId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variationId: string) => void;
  onCheckout: () => void;
}

export function ShoppingCart({ cart, products, onUpdateQuantity, onRemoveItem, onCheckout }: ShoppingCartProps) {
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
        <Button variant="outline" className="relative">
          <CartIcon className="w-5 h-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 px-2 py-1 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({totalItems} items)</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <CartIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              {cart.map((item) => {
                const { product, variation } = getCartItemDetails(item);
                if (!product || !variation) return null;

                return (
                  <div key={`${item.productId}-${item.variationId}`} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0">
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {variation.color} • {variation.size}
                      </p>
                      <p className="font-bold text-purple-600 mt-1">
                        ${variation.price.toFixed(2)}
                      </p>
                      {item.customDesignUrl && (
                        <p className="text-xs text-green-600 mt-1">Custom Design</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.productId, item.variationId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.productId, item.variationId, item.quantity + 1)}
                          disabled={item.quantity >= variation.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveItem(item.productId, item.variationId)}
                          className="ml-auto"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">Shipping calculated at checkout</p>
              </div>

              <Button className="w-full" size="lg" onClick={onCheckout}>
                Proceed to Checkout
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
