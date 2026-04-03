import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Package, Plus, Edit, Trash2, LogOut, ShoppingBag, Settings, Upload, X, Ticket, Users, Tag, MessageSquare, Bell, LayoutDashboard, TrendingUp, AlertTriangle, DollarSign, HeadphonesIcon, Building2, Palette, CheckCircle, Smartphone, Gift, Sparkles, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, ProductVariation } from '../types';
import { storageUtils } from '../utils/storage';
import { productsApi, ordersApi, userApi, authApi, categoriesApi } from '../utils/supabaseApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { OrderManagement } from './OrderManagement';
import { AdminSettings } from './AdminSettings';
import { CategoryManagement } from './CategoryManagement';
import { CouponManagement } from './CouponManagement';
import { CustomerManagement } from './CustomerManagement';
import { MessageTemplateManagement } from './MessageTemplateManagement';
import { PopupManagement } from './PopupManagement';
import { HelpCenterManagement } from './HelpCenterManagement';
import { GiftingManagement } from './GiftingManagement';
import { BusinessSettings } from './BusinessSettings';
import { DesignIntegrationInfo } from './DesignIntegrationInfo';
import { CustomerDesignsManagement } from './CustomerDesignsManagement';
import { AdminDesignOrders } from './AdminDesignOrders';
import { AdminDesignApproval } from './AdminDesignApproval';
import { ThreeDModelManager } from './ThreeDModelManager';
import { ThreeDWebsiteSettings } from './ThreeDWebsiteSettings';
import { PrintingMethodsManagement } from './PrintingMethodsManagement';
import { BillingCalculationSettings } from './BillingCalculationSettings';
import { SupabasePhoneAuthSettings } from './SupabasePhoneAuthSettings';
import { ProductModelStatus } from './ProductModelStatus';
import { AIIntegrationSettings } from './AIIntegrationSettings';
import { SupabaseSetupGuide } from './SupabaseSetupGuide';
import { SupabaseDiagnostic } from './SupabaseDiagnostic';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [basePrice, setBasePrice] = useState('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [printingMethods, setPrintingMethods] = useState<string[]>([]);

  // Variation form
  const [varColor, setVarColor] = useState('#000000');
  const [varColorName, setVarColorName] = useState('');
  const [varSize, setVarSize] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('');

  // Printing method
  const [newPrintMethod, setNewPrintMethod] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Payment settings
  const [allowPrepaid, setAllowPrepaid] = useState(true);
  const [allowPostpaid, setAllowPostpaid] = useState(true);
  const [partialPaymentPercentage, setPartialPaymentPercentage] = useState('30');
  const [codExtraCharge, setCodExtraCharge] = useState('50');
  const [customDesignAllowPostpaid, setCustomDesignAllowPostpaid] = useState(false);
  const [customDesignPartialPaymentPercentage, setCustomDesignPartialPaymentPercentage] = useState('100');

  useEffect(() => {
    loadProducts();
    loadStats();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoriesApi.getAll();
      if (cats && cats.length > 0) {
        setDbCategories(cats.map((c: any) => c.name));
        return;
      }
    } catch {}
    setDbCategories(storageUtils.getCategories());
  };

  // Map Supabase product format → local Product type
  const mapDbProduct = (dbProd: any): Product => {
    const variations = dbProd.product_variations?.length
      ? dbProd.product_variations.map((v: any) => ({
          id: v.id,
          color: v.color || '',
          size: v.size || '',
          price: (parseFloat(dbProd.base_price) || 0) + (parseFloat(v.additional_price) || 0),
          stock: v.stock_quantity ?? v.stock ?? 0,
          sku: v.sku,
        }))
      : (Array.isArray(dbProd.variations) ? dbProd.variations : []);

    const imgs = Array.isArray(dbProd.images) ? dbProd.images
      : (dbProd.image_url ? [dbProd.image_url] : []);

    return {
      id: dbProd.id,
      name: dbProd.name || '',
      description: dbProd.description || '',
      category: dbProd.category || dbProd.category_id || '',
      basePrice: parseFloat(dbProd.base_price) || 0,
      variations,
      images: imgs,
      image: dbProd.image || imgs[0] || '',
      gender: dbProd.gender || 'unisex',
      printingMethods: dbProd.printing_methods || dbProd.printingMethods || [],
      isActive: dbProd.is_active ?? true,
      createdAt: dbProd.created_at || dbProd.createdAt || new Date().toISOString(),
      allowPrepaid: dbProd.allow_prepaid ?? true,
      allowPostpaid: dbProd.allow_postpaid ?? true,
      partialPaymentPercentage: dbProd.partial_payment_percentage || 30,
      codExtraCharge: dbProd.cod_extra_charge || 50,
      customDesignAllowPostpaid: dbProd.custom_design_allow_postpaid ?? false,
      customDesignPartialPaymentPercentage: dbProd.custom_design_partial_payment_percentage || 100,
    };
  };

  const loadProducts = async () => {
    try {
      const dbProds = await productsApi.getAll();
      if (dbProds && dbProds.length > 0) {
        setProducts(dbProds.map(mapDbProduct));
        return;
      }
    } catch (e: any) {
      // Only show warning if it's NOT a connection error
      if (!e.message?.includes('Failed to fetch')) {
        console.warn('Supabase products fetch failed, using localStorage:', e);
      }
    }
    setProducts(storageUtils.getProducts());
  };

  const loadStats = async () => {
    try {
      const [dbProds, dbOrders, dbCustomers] = await Promise.allSettled([
        productsApi.getAll(),
        ordersApi.getAll(),
        userApi.getAllCustomers(),
      ]);

      const prods = dbProds.status === 'fulfilled' ? dbProds.value : storageUtils.getProducts();
      const orders = dbOrders.status === 'fulfilled' ? dbOrders.value : storageUtils.getOrders();
      const customers = dbCustomers.status === 'fulfilled' ? dbCustomers.value : storageUtils.getUsers();

      const totalRevenue = orders.reduce((acc: number, o: any) => acc + (o.total || o.total_amount || 0), 0);
      const pendingOrders = orders.filter((o: any) => (o.status || '').includes('pending')).length;
      const lowStockProducts = prods.filter((p: any) =>
        (p.product_variations || p.variations || []).some((v: any) => (v.stock_quantity || v.stock || 0) < 10)
      ).length;

      setStats({
        totalProducts: prods.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue,
        pendingOrders,
        lowStockProducts,
      });
    } catch {
      // Full localStorage fallback
      const totalProducts = storageUtils.getProducts().length;
      const totalOrders = storageUtils.getOrders().length;
      const totalCustomers = storageUtils.getUsers().length;
      const totalRevenue = storageUtils.getOrders().reduce((acc: number, order: any) => acc + order.total, 0);
      const pendingOrders = storageUtils.getOrders().filter((o: any) => o.status === 'pending').length;
      const lowStockProducts = storageUtils.getProducts().filter((p: any) => p.variations.some((v: any) => v.stock < 10)).length;
      setStats({ totalProducts, totalOrders, totalCustomers, totalRevenue, pendingOrders, lowStockProducts });
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setGender('unisex');
    setBasePrice('');
    setImage('');
    setImages([]);
    setVariations([]);
    setPrintingMethods([]);
    setEditingProduct(null);
    setAllowPrepaid(true);
    setAllowPostpaid(true);
    setPartialPaymentPercentage('30');
    setCodExtraCharge('50');
    setCustomDesignAllowPostpaid(false);
    setCustomDesignPartialPaymentPercentage('100');
  };

  const handleAddVariation = () => {
    if (!varColor || !varSize || !varPrice || !varStock) {
      toast.error('Please fill all variation fields');
      return;
    }

    const newVariation: ProductVariation = {
      id: Date.now().toString(),
      color: varColor,
      size: varSize,
      price: parseFloat(varPrice),
      stock: parseInt(varStock)
    };

    setVariations([...variations, newVariation]);
    setVarColor('#000000');
    setVarColorName('');
    setVarSize('');
    setVarPrice('');
    setVarStock('');
    toast.success('Variation added');
  };

  const handleRemoveVariation = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const handleAddPrintingMethod = () => {
    if (!newPrintMethod) return;
    if (!printingMethods.includes(newPrintMethod)) {
      setPrintingMethods([...printingMethods, newPrintMethod]);
      setNewPrintMethod('');
      toast.success('Printing method added');
    }
  };

  const handleRemovePrintingMethod = (method: string) => {
    setPrintingMethods(printingMethods.filter(m => m !== method));
  };

  const handleAddImage = () => {
    if (!newImageUrl) return;
    if (images.length >= 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    if (!images.includes(newImageUrl)) {
      setImages([...images, newImageUrl]);
      setNewImageUrl('');
      toast.success('Image added');
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setImages(images.filter(img => img !== imageUrl));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setImages((prev) => [...prev, result]);
          toast.success(`${file.name} uploaded`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || !basePrice || variations.length === 0) {
      toast.error('Please fill all required fields and add at least one variation');
      return;
    }

    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name,
      description,
      category,
      gender,
      basePrice: parseFloat(basePrice),
      image,
      images,
      variations,
      printingMethods,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      allowPrepaid,
      allowPostpaid,
      partialPaymentPercentage: parseFloat(partialPaymentPercentage),
      codExtraCharge: parseFloat(codExtraCharge),
      customDesignAllowPostpaid,
      customDesignPartialPaymentPercentage: parseFloat(customDesignPartialPaymentPercentage),
    };

    // Try Supabase first
    try {
      const supabasePayload = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        gender: productData.gender,
        base_price: productData.basePrice,
        images: productData.images,
        image: productData.image,
        printing_methods: productData.printingMethods,
        is_active: true,
        allow_prepaid: productData.allowPrepaid,
        allow_postpaid: productData.allowPostpaid,
        partial_payment_percentage: productData.partialPaymentPercentage,
        cod_extra_charge: productData.codExtraCharge,
        custom_design_allow_postpaid: productData.customDesignAllowPostpaid,
        custom_design_partial_payment_percentage: productData.customDesignPartialPaymentPercentage,
        variations: variations.map(v => ({
          color: v.color,
          size: v.size,
          additional_price: v.price - productData.basePrice,
          stock_quantity: v.stock,
          sku: v.sku,
        })),
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, supabasePayload);
        toast.success('Product updated in Supabase ✓');
      } else {
        await productsApi.create(supabasePayload);
        toast.success('Product added to Supabase ✓');
      }
    } catch (supabaseErr: any) {
      console.warn('Supabase save failed, using localStorage:', supabaseErr.message);
      // Fallback to localStorage
      if (editingProduct) {
        storageUtils.updateProduct(editingProduct.id, productData);
        toast.success('Product updated (localStorage)');
      } else {
        storageUtils.addProduct(productData);
        toast.success('Product added (localStorage)');
      }
    }

    await loadProducts();
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setGender(product.gender || 'unisex');
    setBasePrice(product.basePrice.toString());
    setImage(product.image || '');
    setImages(product.images || []);
    setVariations([...(product.variations || [])]);
    setPrintingMethods([...(product.printingMethods || [])]);
    setAllowPrepaid(product.allowPrepaid ?? true);
    setAllowPostpaid(product.allowPostpaid ?? true);
    setPartialPaymentPercentage((product.partialPaymentPercentage ?? 30).toString());
    setCodExtraCharge((product.codExtraCharge ?? 50).toString());
    setCustomDesignAllowPostpaid(product.customDesignAllowPostpaid ?? false);
    setCustomDesignPartialPaymentPercentage((product.customDesignPartialPaymentPercentage ?? 100).toString());
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productsApi.delete(productId);
        toast.success('Product deleted from Supabase ✓');
      } catch {
        storageUtils.deleteProduct(productId);
        toast.success('Product deleted');
      }
      await loadProducts();
    }
  };

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    storageUtils.logoutAdmin();
    onLogout();
  };

  const navTabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'diagnostic', label: 'Diagnostic', icon: AlertTriangle },
    { value: 'products', label: 'Catalog', icon: Package },
    { value: 'orders', label: 'Orders', icon: ShoppingBag },
    { value: 'customers', label: 'Customers', icon: Users },
    { value: 'categories', label: 'Categories', icon: Tag },
    { value: 'coupons', label: 'Coupons', icon: Ticket },
    { value: 'printingmethods', label: 'Printing', icon: Palette },
    { value: 'customerdesigns', label: 'Designs', icon: Palette },
    { value: 'designapproval', label: 'Approval', icon: CheckCircle },
    { value: 'designorders', label: 'D-Orders', icon: Package },
    { value: '3dmodels', label: '2D Models', icon: Palette },
    { value: '3dwebsite', label: '2D Site', icon: Palette },
    { value: '3dintegration', label: 'Integration', icon: Palette },
    { value: 'billingsettings', label: 'Billing', icon: DollarSign },
    { value: 'mobileverification', label: 'Mobile', icon: Smartphone },
    { value: 'popups', label: 'Popups', icon: Bell },
    { value: 'messages', label: 'Messages', icon: MessageSquare },
    { value: 'helpcenter', label: 'Support', icon: HeadphonesIcon },
    { value: 'gifting', label: 'Gifting', icon: Gift },
    { value: 'business', label: 'Enterprise', icon: Building2 },
    { value: 'settings', label: 'Security', icon: Settings },
    { value: 'ai', label: 'AI Keys', icon: Sparkles },
    { value: 'dbsetup', label: 'DB Setup', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden selection:bg-[#d4af37]/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4af37]/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white glow-text tracking-wider uppercase">Admin Studio</h1>
            <p className="text-slate-500 font-light">Bespoke Enterprise Management</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="glow-button font-bold px-6 rounded-xl border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-[#d4af37]/30 bg-black">
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl font-bold tracking-tight">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-light">
                    {editingProduct ? 'Refine the bespoke product details' : 'Integrate a new canvas into the Toodies catalog'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Product Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Monarch Heavy Hoodie"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#d4af37]/50 h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#d4af37]/50 h-12">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10 text-white">
                          {storageUtils.getCategories().concat(dbCategories.filter(c => !storageUtils.getCategories().includes(c))).map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Product description"
                      rows={3}
                      className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#d4af37]/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Gender</Label>
                      <Select value={gender} onValueChange={(value: any) => setGender(value)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#d4af37]/50 h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10 text-white">
                          <SelectItem value="men">Men</SelectItem>
                          <SelectItem value="women">Women</SelectItem>
                          <SelectItem value="unisex">Unisex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="basePrice" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Base Price *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="1999"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#d4af37]/50 h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Main Image URL</Label>
                      <Input
                        id="image"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:border-[#d4af37]/50 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Product Variations *</Label>
                    <Card className="glass-card border-white/10 bg-white/5">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-6 gap-2 mb-3">
                          <div className="col-span-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={varColor}
                                onChange={(e) => setVarColor(e.target.value)}
                                className="w-12 h-10 rounded cursor-pointer bg-transparent border border-white/10"
                                title="Pick a color"
                              />
                              <Input
                                placeholder="Hex Code"
                                value={varColor}
                                onChange={(e) => setVarColor(e.target.value)}
                                className="bg-white/5 border-white/10 text-white font-mono text-xs flex-1 h-10"
                              />
                            </div>
                          </div>
                          <Input
                            placeholder="Size"
                            value={varSize}
                            onChange={(e) => setVarSize(e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-10"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={varPrice}
                            onChange={(e) => setVarPrice(e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-10"
                          />
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={varStock}
                            onChange={(e) => setVarStock(e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-10"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddVariation}
                            className="glow-button h-10 font-bold"
                          >
                            Add
                          </Button>
                        </div>
                        {variations.length > 0 && (
                          <div className="space-y-2">
                            {variations.map((v) => (
                              <div key={v.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded-lg border border-white/20"
                                    style={{ backgroundColor: v.color }}
                                  />
                                  <span className="text-sm text-slate-300">
                                    <span className="font-mono text-xs text-[#d4af37]">{v.color}</span> - {v.size} - ₹{v.price} ({v.stock} in stock)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveVariation(v.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Printing Methods</Label>
                    <Card className="glass-card border-white/10 bg-white/5">
                      <CardContent className="pt-6">
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="e.g., Screen Print, DTG, Embroidery"
                            value={newPrintMethod}
                            onChange={(e) => setNewPrintMethod(e.target.value)}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-10"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddPrintingMethod}
                            className="glow-button h-10 font-bold"
                          >
                            Add
                          </Button>
                        </div>
                        {printingMethods.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {printingMethods.map((method) => (
                              <div key={method} className="bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] px-3 py-1 rounded-full flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest">{method}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrintingMethod(method)}
                                  className="hover:bg-[#d4af37]/20 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Product Images</Label>
                    <Card className="glass-card border-white/10 bg-white/5">
                      <CardContent className="pt-6">
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Image URL"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-10"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddImage}
                            className="glow-button h-10 font-bold"
                          >
                            Add URL
                          </Button>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageFileUpload}
                            className="bg-white/5 border-white/10 text-slate-400 h-10"
                          />
                        </div>
                        {images.length > 0 && (
                          <div className="space-y-2">
                            {images.map((imageUrl, index) => (
                              <div key={index} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="text-[10px] text-[#d4af37] font-bold font-mono">#{index + 1}</span>
                                  <span className="text-xs text-slate-300 truncate">{imageUrl.substring(0, 50)}...</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveImage(imageUrl)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Fiscal Configuration
                    </Label>
                    <Card className="glass-card border-white/10 bg-white/5">
                      <CardContent className="pt-6 space-y-4">
                        <div className="space-y-3 pb-4 border-b border-white/5">
                          <div className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Ready-to-Wear</div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-300">Allow Full Prepaid</Label>
                            <input
                              type="checkbox"
                              checked={allowPrepaid}
                              onChange={(e) => setAllowPrepaid(e.target.checked)}
                              className="w-5 h-5 rounded border-white/10 bg-white/5 text-[#d4af37]"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-300">Allow COD/Postpaid</Label>
                            <input
                              type="checkbox"
                              checked={allowPostpaid}
                              onChange={(e) => setAllowPostpaid(e.target.checked)}
                              className="w-5 h-5 rounded border-white/10 bg-white/5 text-[#d4af37]"
                            />
                          </div>
                          {allowPostpaid && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deposit (%)</Label>
                                <Input
                                  type="number"
                                  value={partialPaymentPercentage}
                                  onChange={(e) => setPartialPaymentPercentage(e.target.value)}
                                  className="bg-white/5 border-white/10 text-white h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">COD Premium (₹)</Label>
                                <Input
                                  type="number"
                                  value={codExtraCharge}
                                  onChange={(e) => setCodExtraCharge(e.target.value)}
                                  className="bg-white/5 border-white/10 text-white h-10"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Bespoke Creations</div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-300">Allow Bespoke Postpaid</Label>
                            <input
                              type="checkbox"
                              checked={customDesignAllowPostpaid}
                              onChange={(e) => setCustomDesignAllowPostpaid(e.target.checked)}
                              className="w-5 h-5 rounded border-white/10 bg-white/5 text-[#d4af37]"
                            />
                          </div>
                          {customDesignAllowPostpaid && (
                            <div className="space-y-2">
                              <Label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Bespoke Deposit (%)</Label>
                              <Input
                                type="number"
                                value={customDesignPartialPaymentPercentage}
                                onChange={(e) => setCustomDesignPartialPaymentPercentage(e.target.value)}
                                className="bg-white/5 border-white/10 text-white h-10"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button 
                    type="submit" 
                    className="glow-button w-full h-16 rounded-2xl font-black text-lg border-0"
                  >
                    {editingProduct ? 'Update Masterpiece' : 'Integrate Canvas'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 rounded-xl px-6 h-12 transition-all font-bold uppercase tracking-widest text-[10px]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Terminate Session
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-white/5 border border-white/10 p-1.5 rounded-2xl h-auto flex flex-wrap gap-2 justify-start backdrop-blur-xl">
            {navTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value}
                className="rounded-xl px-6 py-3 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-slate-400 font-bold text-[10px] uppercase tracking-[2px] transition-all whitespace-nowrap"
              >
                {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Total Products', value: stats.totalProducts, icon: Package },
                  { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag },
                  { label: 'Total Customers', value: stats.totalCustomers, icon: Users },
                  { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign },
                  { label: 'Pending Orders', value: stats.pendingOrders, icon: AlertTriangle },
                  { label: 'Low Stock', value: stats.lowStockProducts, icon: Package },
                ].map((stat, i) => (
                  <Card key={i} className="glass-card border-white/5 bg-white/[0.02] rounded-3xl group hover:border-[#d4af37]/30 transition-all duration-500">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-[2px] font-bold mb-2">{stat.label}</p>
                          <h2 className="text-3xl font-black text-white">{stat.value}</h2>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 group-hover:scale-110 transition-transform">
                          <stat.icon className="w-6 h-6 text-[#d4af37]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ProductModelStatus />
            </div>
          </TabsContent>
          
          <TabsContent value="products">
            <Card className="glass-card border-white/5 bg-white/[0.02] rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-white text-2xl font-bold">Catalog Management ({products.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {products.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 font-light">The catalog is currently empty.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent h-16">
                          <TableHead className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px] pl-8">Name</TableHead>
                          <TableHead className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Category</TableHead>
                          <TableHead className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Base Price</TableHead>
                          <TableHead className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px]">Variations</TableHead>
                          <TableHead className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px] pr-8 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className="border-white/5 hover:bg-white/[0.02] h-20 group">
                            <TableCell className="font-bold text-white pl-8 group-hover:text-[#d4af37] transition-colors">{product.name}</TableCell>
                            <TableCell className="text-slate-400 font-light">{product.category}</TableCell>
                            <TableCell className="text-white font-bold">₹{product.basePrice.toLocaleString()}</TableCell>
                            <TableCell className="text-slate-400 font-light">{product.variations.length} items</TableCell>
                            <TableCell className="pr-8 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(product)}
                                  className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 border border-white/10"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(product.id)}
                                  className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-white/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>
          
          <TabsContent value="coupons">
            <CouponManagement />
          </TabsContent>
          
          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
          
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
          
          <TabsContent value="messages">
            <MessageTemplateManagement />
          </TabsContent>
          
          <TabsContent value="popups">
            <PopupManagement />
          </TabsContent>
          
          <TabsContent value="helpcenter">
            <HelpCenterManagement />
          </TabsContent>
          
          <TabsContent value="gifting">
            <GiftingManagement />
          </TabsContent>

          <TabsContent value="business">
            <BusinessSettings />
          </TabsContent>
          
          <TabsContent value="3dintegration">
            <DesignIntegrationInfo />
          </TabsContent>
          
          <TabsContent value="customerdesigns">
            <CustomerDesignsManagement />
          </TabsContent>
          
          <TabsContent value="designapproval">
            <AdminDesignApproval />
          </TabsContent>
          
          <TabsContent value="3dmodels">
            <ThreeDModelManager />
          </TabsContent>
          
          <TabsContent value="3dwebsite">
            <ThreeDWebsiteSettings />
          </TabsContent>
          
          <TabsContent value="printingmethods">
            <PrintingMethodsManagement />
          </TabsContent>
          
          <TabsContent value="billingsettings">
            <BillingCalculationSettings />
          </TabsContent>
          
          <TabsContent value="mobileverification">
            <SupabasePhoneAuthSettings />
          </TabsContent>
          
          <TabsContent value="designorders">
            <AdminDesignOrders />
          </TabsContent>

          <TabsContent value="ai">
            <AIIntegrationSettings />
          </TabsContent>

          <TabsContent value="dbsetup">
            <SupabaseSetupGuide />
          </TabsContent>

          <TabsContent value="diagnostic">
            <SupabaseDiagnostic />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}