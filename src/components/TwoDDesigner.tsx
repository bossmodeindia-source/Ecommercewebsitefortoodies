import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { 
  Upload, 
  Trash2, 
  Download, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Save,
  Layers,
  Palette,
  X,
  Plus,
  Minus,
  Move,
  Maximize2,
  Image as ImageIcon,
  ShoppingCart,
  Sparkles,
  Settings,
  Type,
  Circle,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ThreeDModelConfig } from '../types';
import { storageUtils } from '../utils/storage';
import { DesignCheckoutModal } from './DesignCheckoutModal';

interface TwoDDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  modelConfig: ThreeDModelConfig;
  productName: string;
  productId: string;
  onSaveDesign?: (design: any) => void;
}

interface DesignElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
}

export function TwoDDesigner({
  isOpen,
  onClose,
  modelConfig,
  productName,
  productId,
  onSaveDesign
}: TwoDDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedColor, setSelectedColor] = useState(modelConfig.defaultColor || modelConfig.availableColors[0]);
  const [selectedSize, setSelectedSize] = useState(modelConfig.defaultSize || modelConfig.availableSizes[0]);
  const [selectedFabric, setSelectedFabric] = useState(modelConfig.defaultFabric || modelConfig.availableFabrics[0]);
  const [selectedPrintingMethod, setSelectedPrintingMethod] = useState(
    modelConfig.printingMethods.find(m => m.isActive)?.id || modelConfig.printingMethods[0]?.id
  );
  
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'shapes'>('upload');
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [designSnapshot, setDesignSnapshot] = useState<string>('');

  const printingMethod = modelConfig.printingMethods.find(m => m.id === selectedPrintingMethod);
  const totalPrintingCost = printingMethod ? printingMethod.costPerUnit : 0;

  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas();
    }
  }, [elements, selectedElement, zoom, showGrid, selectedColor]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      
      for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    }
    
    // Draw product background based on color
    ctx.fillStyle = selectedColor.toLowerCase();
    ctx.fillRect(100, 100, 600, 600);
    
    // Draw elements
    elements.forEach(element => {
      ctx.save();
      ctx.translate(element.x, element.y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      
      if (element.type === 'text') {
        ctx.font = '48px Arial';
        ctx.fillStyle = element.color || '#FFFFFF';
        ctx.fillText(element.content, 0, 0);
      }
      
      ctx.restore();
      
      // Highlight selected element
      if (element.id === selectedElement) {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10);
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const newElement: DesignElement = {
        id: Date.now().toString(),
        type: 'image',
        content: imageUrl,
        x: 300,
        y: 300,
        width: 200,
        height: 200,
        rotation: 0
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
      toast.success('Image added to canvas');
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Your Text',
      x: 300,
      y: 300,
      width: 200,
      height: 60,
      rotation: 0,
      color: '#FFFFFF'
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    toast.success('Text element added');
  };

  const handleDeleteElement = () => {
    if (!selectedElement) return;
    setElements(elements.filter(e => e.id !== selectedElement));
    setSelectedElement(null);
    toast.success('Element removed');
  };

  const handleSave = () => {
    if (elements.length === 0) {
      toast.error('Please add at least one design element');
      return;
    }

    if (canvasRef.current) {
      const snapshot = canvasRef.current.toDataURL('image/png');
      setDesignSnapshot(snapshot);
      setIsCheckoutOpen(true);
    }
  };

  const handleCheckoutComplete = async (designData: any) => {
    if (onSaveDesign) {
      onSaveDesign({
        ...designData,
        color: selectedColor,
        size: selectedSize,
        fabric: selectedFabric,
        printingMethod: selectedPrintingMethod,
        printingCost: totalPrintingCost,
        thumbnailUrl: designSnapshot
      });
    }
    setIsCheckoutOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[95vh] bg-black border-[#d4af37]/30 text-white p-0 overflow-hidden rounded-[32px]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">
                    2D Design Studio
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {productName} - {selectedColor} / {selectedSize}
                  </DialogDescription>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar - Tools & Controls */}
              <div className="w-80 border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col">
                {/* Tool Tabs */}
                <div className="p-4 border-b border-white/10">
                  <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-xl">
                    {[
                      { id: 'upload', icon: Upload, label: 'Upload' },
                      { id: 'text', icon: Type, label: 'Text' },
                      { id: 'shapes', icon: Square, label: 'Shapes' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all ${
                          activeTab === tab.id
                            ? 'bg-[#d4af37] text-black'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 mx-auto mb-1" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tool Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'upload' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">Upload Design</h3>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-white/5 border-2 border-dashed border-white/20 hover:border-[#d4af37] hover:bg-[#d4af37]/5 text-white h-32 rounded-2xl group"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-[#d4af37] group-hover:scale-110 transition-transform" />
                            <span className="font-black text-xs uppercase tracking-wider">Upload Image</span>
                            <span className="text-[10px] text-slate-500">PNG, JPG, SVG</span>
                          </div>
                        </Button>
                      </motion.div>
                    )}

                    {activeTab === 'text' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">Add Text</h3>
                        <Button
                          onClick={handleAddText}
                          className="w-full bg-[#d4af37] hover:bg-[#c9a227] text-black font-black h-14 rounded-xl"
                        >
                          <Type className="w-5 h-5 mr-2" />
                          Add Text Element
                        </Button>
                      </motion.div>
                    )}

                    {activeTab === 'shapes' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">Shapes</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[Circle, Square].map((Shape, i) => (
                            <Button
                              key={i}
                              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-20 rounded-xl"
                            >
                              <Shape className="w-8 h-8 text-slate-400" />
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Product Options */}
                  <Card className="bg-white/[0.02] border-white/10 rounded-2xl p-5 space-y-4">
                    <h3 className="text-[10px] font-black text-[#d4af37] uppercase tracking-[3px]">Product Options</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Color</Label>
                        <Select value={selectedColor} onValueChange={setSelectedColor}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modelConfig.availableColors.map(color => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Size</Label>
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modelConfig.availableSizes.map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Fabric</Label>
                        <Select value={selectedFabric} onValueChange={setSelectedFabric}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modelConfig.availableFabrics.map(fabric => (
                              <SelectItem key={fabric} value={fabric}>{fabric}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Printing</Label>
                        <Select value={selectedPrintingMethod} onValueChange={setSelectedPrintingMethod}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modelConfig.printingMethods.map(method => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name} - ₹{method.costPerUnit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Center - Canvas Area */}
              <div className="flex-1 flex flex-col bg-slate-900/50">
                {/* Canvas Toolbar */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      className="border-white/10 text-white hover:bg-white/5 rounded-lg"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-bold text-slate-400 min-w-[60px] text-center">{zoom}%</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      className="border-white/10 text-white hover:bg-white/5 rounded-lg"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={showGrid ? 'default' : 'outline'}
                      onClick={() => setShowGrid(!showGrid)}
                      className={showGrid ? 'bg-[#d4af37] text-black hover:bg-[#c9a227]' : 'border-white/10 text-white hover:bg-white/5'}
                    >
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Grid
                    </Button>
                    {selectedElement && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeleteElement}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                  <div 
                    className="relative shadow-2xl rounded-3xl overflow-hidden border-2 border-white/10"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="bg-white/5"
                      width={800}
                      height={800}
                    />
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Layers & Properties */}
              <div className="w-72 border-l border-white/10 bg-black/50 backdrop-blur-xl overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Layers
                    </h3>
                    
                    {elements.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No elements yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {elements.map((element, index) => (
                          <motion.div
                            key={element.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-xl cursor-pointer transition-all ${
                              selectedElement === element.id
                                ? 'bg-[#d4af37]/20 border border-[#d4af37]'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }`}
                            onClick={() => setSelectedElement(element.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                {element.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                                 element.type === 'text' ? <Type className="w-4 h-4" /> :
                                 <Square className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {element.type === 'text' ? element.content : `${element.type} ${index + 1}`}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                  {element.type}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Printing Cost</p>
                  <p className="text-xl font-black text-[#d4af37]">₹{totalPrintingCost.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Elements</p>
                  <p className="text-xl font-black text-white">{elements.length}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/10 text-white hover:bg-white/5 h-14 px-8 rounded-xl font-black uppercase tracking-wider text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={elements.length === 0}
                  className="bg-[#d4af37] hover:bg-[#c9a227] text-black h-14 px-8 rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Continue to Checkout
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isCheckoutOpen && (
        <DesignCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          productName={productName}
          productId={productId}
          designSnapshot={designSnapshot}
          color={selectedColor}
          size={selectedSize}
          fabric={selectedFabric}
          printingMethod={selectedPrintingMethod}
          printingCost={totalPrintingCost}
          onCheckoutComplete={handleCheckoutComplete}
        />
      )}
    </>
  );
}
