export interface ProductVariation {
  id: string;
  color: string;
  size: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  gender: 'men' | 'women' | 'unisex';
  basePrice: number;
  image: string;
  variations: ProductVariation[];
  printingMethods: string[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variationId: string;
  quantity: number;
  customDesignUrl?: string;
}

export interface User {
  id: string;
  email: string;
  mobile: string;
  password: string;
  cart: CartItem[];
  orders: Order[];
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
  trackingUrl?: string;
  userId: string;
  userEmail: string;
  userMobile: string;
  shippingAddress?: string;
  notificationSent?: boolean;
}