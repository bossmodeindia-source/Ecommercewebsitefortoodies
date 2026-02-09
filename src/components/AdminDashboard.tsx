import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Edit, Trash2, LogOut, X, Package, ShoppingBag, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { Product, ProductVariation } from '../types';
import { OrderManagement } from './OrderManagement';
import { AdminSettings } from './AdminSettings';
import { toast } from 'sonner@2.0.3';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [basePrice, setBasePrice] = useState('');
  const [image, setImage] = useState('');
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [printingMethods, setPrintingMethods] = useState<string[]>([]);

  // Variation form
  const [varColor, setVarColor] = useState('');
  const [varSize, setVarSize] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('');

  // Printing method
  const [newPrintMethod, setNewPrintMethod] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(storageUtils.getProducts());
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setGender('unisex');
    setBasePrice('');
    setImage('');
    setVariations([]);
    setPrintingMethods([]);
    setEditingProduct(null);
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
    setVarColor('');
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

  const handleSubmit = (e: React.FormEvent) => {
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
      variations,
      printingMethods,
      createdAt: editingProduct?.createdAt || new Date().toISOString()
    };

    if (editingProduct) {
      storageUtils.updateProduct(editingProduct.id, productData);
      toast.success('Product updated successfully');
    } else {
      storageUtils.addProduct(productData);
      toast.success('Product added successfully');
    }

    loadProducts();
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setGender(product.gender);
    setBasePrice(product.basePrice.toString());
    setImage(product.image);
    setVariations([...product.variations]);
    setPrintingMethods([...product.printingMethods]);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      storageUtils.deleteProduct(productId);
      loadProducts();
      toast.success('Product deleted');
    }
  };

  const handleLogout = () => {
    storageUtils.logoutAdmin();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-cyan-100 glow-text">Admin Dashboard</h1>
            <p className="text-slate-400">Manage Toodies Products & Orders</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-cyan-500/30 bg-[#0f172a]">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Classic T-Shirt"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., T-Shirts, Hoodies"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={(value: any) => setGender(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="men">Men</SelectItem>
                          <SelectItem value="women">Women</SelectItem>
                          <SelectItem value="unisex">Unisex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Base Price *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="29.99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Variations */}
                  <div className="space-y-3">
                    <Label>Product Variations *</Label>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          <Input
                            placeholder="Color"
                            value={varColor}
                            onChange={(e) => setVarColor(e.target.value)}
                          />
                          <Input
                            placeholder="Size"
                            value={varSize}
                            onChange={(e) => setVarSize(e.target.value)}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={varPrice}
                            onChange={(e) => setVarPrice(e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={varStock}
                            onChange={(e) => setVarStock(e.target.value)}
                          />
                          <Button type="button" onClick={handleAddVariation}>
                            Add
                          </Button>
                        </div>
                        {variations.length > 0 && (
                          <div className="space-y-2">
                            {variations.map((v) => (
                              <div key={v.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">
                                  {v.color} - {v.size} - ${v.price} ({v.stock} in stock)
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveVariation(v.id)}
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

                  {/* Printing Methods */}
                  <div className="space-y-3">
                    <Label>Printing Methods</Label>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="e.g., Screen Print, DTG, Embroidery"
                            value={newPrintMethod}
                            onChange={(e) => setNewPrintMethod(e.target.value)}
                          />
                          <Button type="button" onClick={handleAddPrintingMethod}>
                            Add
                          </Button>
                        </div>
                        {printingMethods.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {printingMethods.map((method) => (
                              <div key={method} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
                                <span className="text-sm">{method}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrintingMethod(method)}
                                  className="hover:bg-purple-200 rounded-full p-0.5"
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

                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-[#0f172a]/50 border border-cyan-500/20">
            <TabsTrigger 
              value="products"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
            >
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <Card className="glass-card border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-100">Products ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No products yet. Add your first product!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-cyan-500/20 hover:bg-transparent">
                          <TableHead className="text-cyan-300">Name</TableHead>
                          <TableHead className="text-cyan-300">Category</TableHead>
                          <TableHead className="text-cyan-300">Gender</TableHead>
                          <TableHead className="text-cyan-300">Base Price</TableHead>
                          <TableHead className="text-cyan-300">Variations</TableHead>
                          <TableHead className="text-cyan-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                            <TableCell className="font-medium text-cyan-100">{product.name}</TableCell>
                            <TableCell className="text-slate-300">{product.category}</TableCell>
                            <TableCell className="capitalize text-slate-300">{product.gender}</TableCell>
                            <TableCell className="text-teal-400">${product.basePrice.toFixed(2)}</TableCell>
                            <TableCell className="text-slate-300">{product.variations.length}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(product.id)}
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/20"
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
          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}