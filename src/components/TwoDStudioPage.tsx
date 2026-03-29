import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Home, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { Advanced2DDesigner } from './Advanced2DDesigner';
import { storageUtils } from '../utils/storage';
import { Product, User, ThreeDModelConfig } from '../types';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { designsApi } from '../utils/supabaseApi';

interface TwoDStudioPageProps {
  onBack: () => void;
  user: User;
  onUserUpdate: (user: User) => void;
}

export function TwoDStudioPage({ onBack, user, onUserUpdate }: TwoDStudioPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modelConfig, setModelConfig] = useState<ThreeDModelConfig | null>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, selectedBrand, products]);

  const loadProducts = () => {
    const allProducts = storageUtils.getProducts();
    const productsWithModels = allProducts.filter(p => {
      const config = storageUtils.get3DModelConfigByProductId(p.id);
      return config !== null;
    });
    setProducts(productsWithModels);

    console.log('=== 2D STUDIO PAGE LOADED ===');
    console.log('Total products in store:', allProducts.length);
    console.log('Products with 2D models:', productsWithModels.length);
    console.log('Products with models:', productsWithModels.map(p => ({ id: p.id, name: p.name, category: p.category })));
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Brand filtering could be added here if you have a brand field in products
    // For now, we'll keep it simple with just category filtering

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (product: Product) => {
    const config = storageUtils.get3DModelConfigByProductId(product.id);
    if (!config) {
      toast.error('2D configuration not found for this product');
      return;
    }

    // Validate configuration has required fields
    const errors: string[] = [];
    
    if (!config.availableColors || config.availableColors.length === 0) {
      errors.push('colors');
    }
    if (!config.availableSizes || config.availableSizes.length === 0) {
      errors.push('sizes');
    }
    if (!config.availableFabrics || config.availableFabrics.length === 0) {
      errors.push('fabrics');
    }
    if (!config.printingMethods || config.printingMethods.length === 0) {
      errors.push('printing methods');
    }

    if (errors.length > 0) {
      toast.error(
        `Configuration incomplete: Missing ${errors.join(', ')}`,
        {
          description: 'Please complete the model configuration in Admin Panel → 2D Model Manager'
        }
      );
      return;
    }

    // All validations passed, open designer
    setSelectedProduct(product);
    setModelConfig(config);
    setIsDesignerOpen(true);
  };

  const handleSaveDesign = (design: any) => {
    const updatedUser = { ...user };
    updatedUser.savedCustomerDesigns = updatedUser.savedCustomerDesigns || [];
    
    const savedDesign = {
      id: Date.now().toString(),
      name: `${selectedProduct?.name} - Custom Design`,
      productId: selectedProduct!.id,
      color: design.color,
      size: design.size,
      fabric: design.fabric,
      printingMethod: design.printingMethod,
      printingCost: design.printingCost,
      designUploads: design.designUploads,
      createdAt: new Date().toISOString(),
      thumbnailUrl: design.thumbnailUrl,
      category: selectedProduct?.category
    };

    updatedUser.savedCustomerDesigns.push(savedDesign);
    storageUtils.updateCurrentUser(updatedUser);
    onUserUpdate(updatedUser);

    toast.success('Design saved successfully!', {
      description: 'Your custom design has been saved to your profile.'
    });

    setIsDesignerOpen(false);
    setSelectedProduct(null);
  };

  // Get unique categories from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  
  // Count products per category
  const getCategoryCount = (category: string) => {
    if (category === 'All') return products.length;
    return products.filter(p => p.category === category).length;
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    loadProducts();
    toast.info('Viewing all models');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#d4af37]/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-[#d4af37]/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-slate-300 hover:text-[#d4af37] hover:bg-[#d4af37]/5 nav-link"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37] hover:text-black glow-button rounded-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {!isDesignerOpen ? (
          <div className="space-y-12">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-white via-white to-[#d4af37] bg-clip-text text-transparent glow-text">
                2D Mockup Studio
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                Premium customization experience. Select a mockup, visualize your vision, and create your statement.
              </p>
            </motion.div>

            {/* Category Filter Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-3 bg-[#111] p-2 rounded-2xl border border-[#d4af37]/10">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-8 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all ${
                      selectedCategory === category
                        ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                        : 'bg-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-12"
              >
                {filteredProducts.map((product, index) => {
                  const config = storageUtils.get3DModelConfigByProductId(product.id);
                  const mockupImage = config?.mockupImageUrl || config?.modelUrl;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                      onClick={() => handleProductSelect(product)}
                    >
                      <Card className="overflow-hidden border border-[#d4af37]/10 hover:border-[#d4af37]/50 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(212,175,55,0.15)] bg-[#0a0a0a] rounded-[30px]">
                        <div className="aspect-[3/4] relative overflow-hidden bg-[#111]">
                          <div className="absolute inset-0 bg-black/40 z-10" />
                          {mockupImage ? (
                            <img
                              src={mockupImage}
                              alt={product.name}
                              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Palette className="w-20 h-20 text-[#d4af37]/20" />
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-20">
                            <div className="text-center space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                              <Button className="glow-button font-bold px-10 py-7 text-lg rounded-2xl">
                                <Palette className="w-5 h-5 mr-2" />
                                Start Designing
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <CardContent className="p-6 bg-[#0a0a0a] relative z-20">
                          <div className="space-y-3">
                            <h3 className="font-bold text-white text-xl tracking-wide group-hover:text-[#d4af37] transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-[#d4af37] font-bold text-2xl">
                                ₹{Math.min(...product.variations.map(v => v.price))}
                              </span>
                              <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30 font-bold tracking-widest text-[10px] uppercase px-3 py-1 rounded-full">
                                {product.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <Card className="max-w-md mx-auto border border-[#d4af37]/10 bg-[#0a0a0a] rounded-[40px] p-12">
                  <div className="w-24 h-24 rounded-full bg-[#d4af37]/5 flex items-center justify-center mx-auto mb-8 border border-[#d4af37]/10">
                    <Palette className="w-10 h-10 text-[#d4af37] opacity-40" />
                  </div>
                  <h3 className="text-white text-3xl font-bold mb-4 tracking-tight">No Models Found</h3>
                  <p className="text-slate-500 mb-8 font-light leading-relaxed">
                    We're currently updating our catalog with premium custom pieces. Please check back soon or try another category.
                  </p>
                  <Button
                    onClick={resetFilters}
                    className="glow-button w-full py-7 rounded-2xl font-bold text-lg"
                  >
                    View All Collection
                  </Button>
                </Card>
              </motion.div>
            )}
          </div>
        ) : null}
      </div>

      {/* 2D Designer Modal */}
      {isDesignerOpen && selectedProduct && modelConfig && (
        <Advanced2DDesigner
          isOpen={isDesignerOpen}
          modelConfig={modelConfig}
          productName={selectedProduct.name}
          productId={selectedProduct.id}
          onClose={() => {
            setIsDesignerOpen(false);
            setSelectedProduct(null);
            setModelConfig(null);
          }}
          onSaveDesign={(design) => {
            console.log('Design saved from studio page:', design);
            toast.success('Design saved successfully!');
            setIsDesignerOpen(false);
            setSelectedProduct(null);
            setModelConfig(null);
            // Refresh user data
            const updatedUser = storageUtils.getCurrentUser();
            if (updatedUser) {
              onUserUpdate(updatedUser);
            }
          }}
        />
      )}
    </div>
  );
}