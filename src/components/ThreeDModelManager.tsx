import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save,
  X,
  ExternalLink,
  Palette,
  Ruler,
  Layers,
  DollarSign,
  Upload,
  FileUp,
  CheckSquare,
  Square,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { ThreeDModelConfig, PrintingMethod, Product } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { storageUtils } from '../utils/storage';

export function ThreeDModelManager() {
  const [modelConfigs, setModelConfigs] = useState<ThreeDModelConfig[]>([]);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModel, setEditingModel] = useState<ThreeDModelConfig | null>(null);
  
  // Load available printing methods from admin panel
  const [availablePrintingMethods, setAvailablePrintingMethods] = useState<PrintingMethod[]>([]);

  const [formData, setFormData] = useState({
    productId: '',
    modelUrl: '',
    mockupImage: null as File | null,
    mockupImageUrl: '',
    availableColors: [] as string[],
    availableSizes: [] as string[],
    availableFabrics: [] as string[],
    printingMethods: [] as PrintingMethod[],
    defaultColor: '',
    defaultSize: '',
    defaultFabric: '',
    modelPrice: 0
  });

  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [fabricInput, setFabricInput] = useState('');
  const mockupImageInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    loadModelConfigs();
    loadPrintingMethods();
    setProducts(storageUtils.getProducts());
  }, []);

  const loadModelConfigs = () => {
    const configs = storageUtils.get3DModelConfigs();
    setModelConfigs(configs);
  };

  const loadPrintingMethods = () => {
    const stored = localStorage.getItem('printingMethods');
    
    if (stored) {
      try {
        const methods = JSON.parse(stored) as PrintingMethod[];
        const activeMethods = methods.filter(m => m.isActive);
        setAvailablePrintingMethods(activeMethods);
        
        if (activeMethods.length > 0) {
          toast.success(`Loaded ${activeMethods.length} printing method(s) from admin panel`);
        } else {
          toast('No active printing methods found', {
            description: 'Please activate printing methods in the Printing Methods Management section.'
          });
        }
      } catch (error) {
        toast.error('Failed to load printing methods');
      }
    } else {
      toast('No printing methods configured', {
        description: 'Please add printing methods in the admin panel first.'
      });
    }
  };

  const handleSaveModel = () => {
    if (!formData.productId) {
      toast.error('Please select a Product from the dropdown', {
        description: 'You must select a product before saving the 2D design configuration'
      });
      return;
    }

    if (!formData.modelUrl) {
      toast.error('Please upload a 2D mockup image', {
        description: 'A mockup image is required for the design configuration'
      });
      return;
    }

    if (formData.availableColors.length === 0) {
      toast('No colors added - using default colors', {
        description: 'Add colors later by editing the model'
      });
      formData.availableColors = ['#000000', '#FFFFFF', '#FF0000'];
    }

    if (formData.availableSizes.length === 0) {
      toast('No sizes added - using default sizes', {
        description: 'Add sizes later by editing the model'
      });
      formData.availableSizes = ['S', 'M', 'L', 'XL'];
    }

    const newModel: ThreeDModelConfig = {
      id: editingModel?.id || Date.now().toString(),
      ...formData,
      modelUrl: formData.modelUrl || '',
      createdAt: editingModel?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingModel) {
        storageUtils.update3DModelConfig(newModel);
        toast.success('3D model updated successfully!');
      } else {
        storageUtils.add3DModelConfig(newModel);
        toast.success('3D model added successfully!');
      }

      loadModelConfigs();
      resetForm();
    } catch (error) {
      toast.error('Failed to save 3D model configuration.');
    }
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('Are you sure you want to delete this 3D model configuration?')) {
      storageUtils.delete3DModelConfig(id);
      loadModelConfigs();
      toast.success('3D model deleted');
    }
  };

  const handleEditModel = (model: ThreeDModelConfig) => {
    setEditingModel(model);
    setFormData({
      productId: model.productId,
      modelUrl: model.modelUrl,
      mockupImage: null,
      mockupImageUrl: model.mockupImageUrl || '',
      availableColors: [...model.availableColors],
      availableSizes: [...model.availableSizes],
      availableFabrics: [...model.availableFabrics],
      printingMethods: [...model.printingMethods],
      defaultColor: model.defaultColor || '',
      defaultSize: model.defaultSize || '',
      defaultFabric: model.defaultFabric || '',
      modelPrice: model.modelPrice || 0
    });
    setIsAddingModel(true);
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      modelUrl: '',
      mockupImage: null,
      mockupImageUrl: '',
      availableColors: [],
      availableSizes: [],
      availableFabrics: [],
      printingMethods: [],
      defaultColor: '',
      defaultSize: '',
      defaultFabric: '',
      modelPrice: 0
    });
    setIsAddingModel(false);
    setEditingModel(null);
    setColorInput('');
    setSizeInput('');
    setFabricInput('');
  };

  const addColor = () => {
    if (colorInput.trim()) {
      setFormData({
        ...formData,
        availableColors: [...formData.availableColors, colorInput.trim()]
      });
      setColorInput('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({
      ...formData,
      availableColors: formData.availableColors.filter(c => c !== color)
    });
  };

  const addSize = () => {
    if (sizeInput.trim()) {
      setFormData({
        ...formData,
        availableSizes: [...formData.availableSizes, sizeInput.trim()]
      });
      setSizeInput('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({
      ...formData,
      availableSizes: formData.availableSizes.filter(s => s !== size)
    });
  };

  const addFabric = () => {
    if (fabricInput.trim()) {
      setFormData({
        ...formData,
        availableFabrics: [...formData.availableFabrics, fabricInput.trim()]
      });
      setFabricInput('');
    }
  };

  const removeFabric = (fabric: string) => {
    setFormData({
      ...formData,
      availableFabrics: formData.availableFabrics.filter(f => f !== fabric)
    });
  };

  const togglePrintingMethodSelection = (method: PrintingMethod) => {
    const isAlreadySelected = formData.printingMethods.some(m => m.id === method.id);
    
    if (isAlreadySelected) {
      // Remove the method
      setFormData({
        ...formData,
        printingMethods: formData.printingMethods.filter(m => m.id !== method.id)
      });
    } else {
      // Add the method
      setFormData({
        ...formData,
        printingMethods: [...formData.printingMethods, method]
      });
    }
  };

  const clearAllData = () => {
    if (confirm('⚠️ This will delete ALL 3D model configurations. This cannot be undone. Are you sure?')) {
      try {
        localStorage.removeItem('toodies_3d_model_configs');
        loadModelConfigs();
        toast.success('All 3D model data cleared successfully!');
      } catch (error) {
        toast.error('Failed to clear data');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">2D Design Configuration</h2>
          <p className="text-slate-400 text-sm">
            Manage 2D designs, colors, sizes, fabrics, and printing methods
          </p>
        </div>
        <div className="flex gap-2">
          {modelConfigs.length > 0 && (
            <>
              <Button
                onClick={() => toast.success(`${modelConfigs.length} configurations found`)}
                variant="outline"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Package className="w-4 h-4 mr-2" />
                Configs ({modelConfigs.length})
              </Button>
              <Button
                onClick={clearAllData}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </>
          )}
          <Button
            onClick={() => setIsAddingModel(true)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add 2D Design
          </Button>
        </div>
      </div>

      {/* Model List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modelConfigs.map(model => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card border-cyan-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold">Product ID: {model.productId}</h3>
                    <a 
                      href={model.modelUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-xs hover:underline flex items-center gap-1 mt-1"
                    >
                      View 3D Model <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditModel(model)}
                      className="text-cyan-400"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteModel(model.id)}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Colors ({model.availableColors.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {model.availableColors.slice(0, 5).map(color => (
                        <Badge key={color} className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">
                          {color}
                        </Badge>
                      ))}
                      {model.availableColors.length > 5 && (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                          +{model.availableColors.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sizes ({model.availableSizes.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {model.availableSizes.map(size => (
                        <Badge key={size} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Printing Methods ({model.printingMethods.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {model.printingMethods.map(method => (
                        <Badge 
                          key={method.id} 
                          className={`${method.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'} text-xs`}
                        >
                          {method.name} - ₹{method.costPerSquareInch}/inch²
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {modelConfigs.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <Palette className="w-16 h-16 text-cyan-500/30 mx-auto mb-4" />
            <p className="text-slate-400">No 2D designs configured yet</p>
            <p className="text-slate-500 text-sm mt-2">Click "Add 2D Design" to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Model Dialog */}
      <Dialog open={isAddingModel} onOpenChange={(open) => {
        if (!open) {
          resetForm();
        } else {
          // Reload products when dialog opens
          setProducts(storageUtils.getProducts());
        }
      }}>
        <DialogContent aria-describedby={undefined} className="glass-card border-cyan-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-cyan-100 text-xl">
              {editingModel ? 'Edit 3D Model' : 'Add New 3D Model'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <Card className="glass-card border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-cyan-300 text-xs flex items-center gap-2">
                    Select Product * 
                    {!formData.productId && (
                      <span className="text-red-400 text-[10px] animate-pulse">⚠ Required</span>
                    )}
                  </Label>
                  <select
                    value={formData.productId}
                    onChange={(e) => {
                      const selectedProd = products.find(p => p.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        productId: e.target.value,
                        // Optionally auto-fill name if needed, though ThreeDModelConfig doesn't have productName field in the interface
                      });
                    }}
                    className={`w-full h-10 px-3 rounded-md bg-slate-800/50 border ${
                      !formData.productId ? 'border-red-500/50' : 'border-cyan-500/30'
                    } text-white focus:outline-none focus:ring-1 focus:ring-cyan-500`}
                  >
                    <option value="">Select a product...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (ID: {product.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {products.length === 0 ? (
                      <span className="text-yellow-400">⚠ No products available. Please add products first in the Product Management section.</span>
                    ) : (
                      'Matching the correct Product ID is essential for the 2D Studio to display the model.'
                    )}
                  </p>
                </div>

                <div>
                  <Label className="text-cyan-300 text-xs flex items-center gap-2">
                    2D Mockup Image Upload *
                    {!formData.mockupImageUrl && !formData.modelUrl && (
                      <span className="text-red-400 text-[10px] animate-pulse">⚠ Required</span>
                    )}
                  </Label>
                  <div className="space-y-3">
                    <div 
                      onClick={() => mockupImageInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 hover:border-cyan-500/60 transition-all cursor-pointer ${
                        !formData.mockupImageUrl && !formData.modelUrl
                          ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                          : 'border-cyan-500/30 bg-slate-800/30 hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        ref={mockupImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File size must be less than 5MB');
                              return;
                            }
                            
                            // Load image and convert to perfect square
                            const img = new Image();
                            const reader = new FileReader();
                            
                            reader.onload = (e) => {
                              img.onload = () => {
                                // Create square canvas
                                const maxDimension = Math.max(img.width, img.height);
                                const canvas = document.createElement('canvas');
                                canvas.width = maxDimension;
                                canvas.height = maxDimension;
                                
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                  toast.error('Failed to process image');
                                  return;
                                }
                                
                                // Fill with white background
                                ctx.fillStyle = '#FFFFFF';
                                ctx.fillRect(0, 0, maxDimension, maxDimension);
                                
                                // Calculate position to center the image
                                const x = (maxDimension - img.width) / 2;
                                const y = (maxDimension - img.height) / 2;
                                
                                // Draw image centered in square
                                ctx.drawImage(img, x, y, img.width, img.height);
                                
                                // Convert to base64
                                const squareBase64 = canvas.toDataURL('image/png', 1.0);
                                
                                setFormData({
                                  ...formData,
                                  mockupImage: file,
                                  mockupImageUrl: squareBase64,
                                  modelUrl: squareBase64
                                });
                                
                                toast.success(`Image converted to ${maxDimension}x${maxDimension} square!`);
                              };
                              
                              img.onerror = () => {
                                toast.error('Failed to load image');
                              };
                              
                              img.src = e.target?.result as string;
                            };
                            
                            reader.onerror = () => {
                              toast.error('Failed to read file');
                            };
                            
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="w-12 h-12 text-cyan-400 mb-3" />
                        <p className="text-cyan-300 font-semibold mb-1">
                          {formData.mockupImage || formData.mockupImageUrl ? 'Change Mockup Image' : 'Upload 2D Mockup Image'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          Click to select PNG, JPG, or JPEG (Max 5MB)
                        </p>
                        <p className="text-gold-400 text-xs mt-2 font-semibold">
                          ✨ Auto-converts to perfect square for easy positioning
                        </p>
                      </div>
                    </div>
                    
                    {(formData.mockupImageUrl || formData.mockupImage) && (
                      <div className="relative rounded-xl overflow-hidden border border-cyan-500/30">
                        <img 
                          src={formData.mockupImageUrl || (formData.mockupImage ? URL.createObjectURL(formData.mockupImage) : '')}
                          alt="Mockup preview" 
                          className="w-full h-48 object-contain bg-slate-900"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-gold-400 text-xs px-2 py-1 rounded">
                          📐 Perfect Square
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              mockupImage: null,
                              mockupImageUrl: '',
                              modelUrl: ''
                            });
                            if (mockupImageInputRef.current) {
                              mockupImageInputRef.current.value = '';
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Upload a high-quality 2D mockup image. It will be automatically converted to a perfect square for optimal positioning.
                  </p>
                </div>

                <div>
                  <Label className="text-cyan-300 text-xs">Model Base Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.modelPrice}
                    onChange={(e) => setFormData({ ...formData, modelPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 499"
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Base price for this product. Total = Model Price + Printing Cost
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card className="glass-card border-pink-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-400" />
                  Available Colors *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="color"
                      value={colorInput.startsWith('#') ? colorInput : '#000000'}
                      onChange={(e) => setColorInput(e.target.value)}
                      className="bg-slate-800/50 border-pink-500/30 h-10 cursor-pointer"
                      style={{ width: '60px' }}
                    />
                  </div>
                  <Input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addColor();
                      }
                    }}
                    placeholder="e.g., #FF5733, #000000"
                    className="bg-slate-800/50 border-pink-500/30 text-white flex-1"
                  />
                  <Button onClick={addColor} className="bg-pink-500 text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.availableColors.map(color => (
                    <Badge key={color} className="bg-pink-500/20 text-pink-400 border-pink-500/30 pr-1 flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border border-white/30" 
                        style={{ backgroundColor: color }}
                      />
                      {color}
                      <button
                        type="button"
                        className="ml-1 hover:bg-pink-500/30 rounded transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeColor(color);
                        }}
                      >
                        <X className="w-3 h-3 cursor-pointer hover:text-pink-200" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div>
                  <Label className="text-pink-300 text-xs">Default Color (Hex Code)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={formData.defaultColor.startsWith('#') ? formData.defaultColor : '#000000'}
                      onChange={(e) => setFormData({ ...formData, defaultColor: e.target.value })}
                      className="bg-slate-800/50 border-pink-500/30 h-10 cursor-pointer"
                      style={{ width: '60px' }}
                    />
                    <Input
                      value={formData.defaultColor}
                      onChange={(e) => setFormData({ ...formData, defaultColor: e.target.value })}
                      placeholder="e.g., #000000"
                      className="bg-slate-800/50 border-pink-500/30 text-white flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sizes */}
            <Card className="glass-card border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-400" />
                  Available Sizes *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSize();
                      }
                    }}
                    placeholder="e.g., S, M, L, XL"
                    className="bg-slate-800/50 border-blue-500/30 text-white"
                  />
                  <Button onClick={addSize} className="bg-blue-500 text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.availableSizes.map(size => (
                    <Badge key={size} className="bg-blue-500/20 text-blue-400 border-blue-500/30 pr-1 flex items-center gap-1">
                      {size}
                      <button
                        type="button"
                        className="ml-1 hover:bg-blue-500/30 rounded transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeSize(size);
                        }}
                      >
                        <X className="w-3 h-3 cursor-pointer hover:text-blue-200" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div>
                  <Label className="text-blue-300 text-xs">Default Size</Label>
                  <Input
                    value={formData.defaultSize}
                    onChange={(e) => setFormData({ ...formData, defaultSize: e.target.value })}
                    placeholder="Default size"
                    className="bg-slate-800/50 border-blue-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fabrics */}
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Available Fabrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={fabricInput}
                    onChange={(e) => setFabricInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFabric();
                      }
                    }}
                    placeholder="e.g., Cotton, Polyester, Blend"
                    className="bg-slate-800/50 border-purple-500/30 text-white"
                  />
                  <Button onClick={addFabric} className="bg-purple-500 text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.availableFabrics.map(fabric => (
                    <Badge key={fabric} className="bg-purple-500/20 text-purple-400 border-purple-500/30 pr-1 flex items-center gap-1">
                      {fabric}
                      <button
                        type="button"
                        className="ml-1 hover:bg-purple-500/30 rounded transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFabric(fabric);
                        }}
                      >
                        <X className="w-3 h-3 cursor-pointer hover:text-purple-200" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div>
                  <Label className="text-purple-300 text-xs">Default Fabric</Label>
                  <Input
                    value={formData.defaultFabric}
                    onChange={(e) => setFormData({ ...formData, defaultFabric: e.target.value })}
                    placeholder="Default fabric"
                    className="bg-slate-800/50 border-purple-500/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Printing Methods */}
            <Card className="glass-card border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Printing Methods (Optional) ({formData.printingMethods.length} selected)
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Select printing methods from the admin panel configuration. You can add these later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Printing Methods */}
                <div>
                  <Label className="text-green-300 text-xs mb-2 block">Available Methods</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availablePrintingMethods.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-4">
                        No printing methods configured. Please add printing methods in the Printing Methods Management section first.
                      </p>
                    ) : (
                      availablePrintingMethods.map(method => {
                        const isSelected = formData.printingMethods.some(m => m.id === method.id);
                        return (
                          <div 
                            key={method.id} 
                            onClick={() => togglePrintingMethodSelection(method)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-green-500/20 border-green-500/50 ring-2 ring-green-500/30' 
                                : 'bg-slate-800/50 border-slate-700 hover:border-green-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-green-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                              <div className="flex-1">
                                <p className="text-white font-bold text-sm">{method.name}</p>
                                <p className="text-slate-400 text-xs">{method.description}</p>
                                <p className="text-green-400 text-xs mt-1">₹{method.costPerSquareInch}/inch² {method.minimumCharge ? `(min: ₹${method.minimumCharge})` : ''}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Printing Methods Summary */}
                {formData.printingMethods.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <Label className="text-green-300 text-xs mb-2 block">Selected Methods ({formData.printingMethods.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.printingMethods.map(method => (
                        <Badge key={method.id} className="bg-green-500/20 text-green-400 border-green-500/30 text-xs flex items-center gap-2 pr-1">
                          {method.name} - ₹{method.costPerSquareInch}/inch²
                          <button
                            type="button"
                            className="ml-1 hover:bg-green-500/30 rounded transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              togglePrintingMethodSelection(method);
                            }}
                          >
                            <X className="w-3 h-3 cursor-pointer hover:text-green-200" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveModel}
                disabled={!formData.productId || !formData.modelUrl}
                className={`flex-1 ${
                  !formData.productId || !formData.modelUrl
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600'
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingModel ? 'Update Model' : 'Save Model'}
              </Button>
            </div>
            
            {/* Validation Warning */}
            {(!formData.productId || !formData.modelUrl) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-400 font-semibold text-sm mb-1">Required Fields Missing</p>
                    <ul className="text-red-300 text-xs space-y-1">
                      {!formData.productId && (
                        <li>• Please select a Product from the dropdown above</li>
                      )}
                      {!formData.modelUrl && (
                        <li>• Please upload a 2D mockup image</li>
                      )}
                    </ul>
                    {products.length === 0 && (
                      <p className="text-yellow-400 text-xs mt-2 font-semibold">
                        💡 Tip: Create products first in the "Product Management" section, then come back here.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}