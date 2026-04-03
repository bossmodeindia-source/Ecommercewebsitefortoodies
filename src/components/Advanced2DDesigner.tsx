import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Upload, 
  Type, 
  Square, 
  Trash2, 
  Save, 
  Undo, 
  Redo, 
  Download, 
  Grid3x3, 
  Lock, 
  Unlock,
  Maximize2,
  Minimize2,
  Copy,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  ChevronLeft,
  ChevronRight,
  Move,
  ImageIcon,
  X,
  Send,
  Check,
  Eraser,
  Palette,
  ArrowUp,
  ArrowDown,
  FileText,
  Home,
  ArrowLeft,
  HelpCircle,
  Gift,
  Tag,
  Circle,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  Wand2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ThreeDModelConfig } from '../types';
import { storageUtils } from '../utils/storage';
import { DesignCheckoutModal } from './DesignCheckoutModal';
import { generateWithPaperspaceSD } from '../utils/aiDesignGenerator';
import { aiConfigApi } from '../utils/supabaseApi';

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
  fontSize?: number;
  fontFamily?: string;
  flipH?: boolean;
  flipV?: boolean;
  opacity?: number;       // 0–1, default 1 (fully opaque)
  isAIGenerated?: boolean; // true for Paperspace SD / AI layers
}

interface HistoryState {
  elements: DesignElement[];
  selectedElement: string | null;
}

const GOOGLE_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Avant Garde',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Bebas Neue',
  'Playfair Display',
  'Merriweather',
  'Dancing Script'
];

const DESIGN_TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Quote',
    elements: [
      { id: '1', type: 'text', content: 'Stay Focused', x: 600, y: 450, width: 400, height: 100, rotation: 0, color: '#FFFFFF', fontSize: 56, fontFamily: 'Montserrat' }
    ]
  },
  {
    id: 'badge',
    name: 'Vintage Badge',
    elements: [
      { id: '1', type: 'shape', content: 'circle', x: 600, y: 400, width: 250, height: 250, rotation: 0, color: '#d4af37' },
      { id: '2', type: 'text', content: 'PREMIUM', x: 650, y: 490, width: 150, height: 50, rotation: 0, color: '#000000', fontSize: 28, fontFamily: 'Impact' }
    ]
  },
  {
    id: 'geometric',
    name: 'Geometric',
    elements: [
      { id: '1', type: 'shape', content: 'square', x: 550, y: 400, width: 200, height: 200, rotation: 45, color: '#d4af37' },
      { id: '2', type: 'shape', content: 'square', x: 625, y: 475, width: 130, height: 130, rotation: 45, color: '#FFFFFF' }
    ]
  }
];

export function Advanced2DDesigner({
  isOpen,
  onClose,
  modelConfig,
  productName,
  productId,
  onSaveDesign
}: TwoDDesignerProps) {
  const canvasRef = useRef<any>(null);
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Image cache: keyed by content (src URL / data-URL) → decoded HTMLImageElement
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // PERFECT SQUARE CANVAS - 1200x1200 pixels (no conversion, exact coordinates)
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 1200;
  
  const [selectedColor, setSelectedColor] = useState(modelConfig.defaultColor || modelConfig.availableColors[0]);
  const [selectedSize, setSelectedSize] = useState(modelConfig.defaultSize || modelConfig.availableSizes[0]);
  const [selectedFabric, setSelectedFabric] = useState(modelConfig.defaultFabric || modelConfig.availableFabrics[0]);
  const [selectedPrintingMethod, setSelectedPrintingMethod] = useState(
    modelConfig.printingMethods.find(m => m.isActive)?.id || modelConfig.printingMethods[0]?.id
  );
  
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(80);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'shapes' | 'templates' | 'ai'>('upload');
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [designSnapshot, setDesignSnapshot] = useState<string>('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  // AI Design Generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedImages, setAiGeneratedImages] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGenerationStep, setAiGenerationStep] = useState('');

  // Check if AI Design feature is enabled by admin
  const [isAIFeatureEnabled, setIsAIFeatureEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ai_design_feature_enabled');
      return stored === null ? true : stored === 'true';
    } catch { return true; }
  });

  // Sync AI feature flag from Supabase on mount
  useEffect(() => {
    aiConfigApi.getFeatureEnabled().then(enabled => {
      setIsAIFeatureEnabled(enabled);
      localStorage.setItem('ai_design_feature_enabled', String(enabled));
    }).catch(() => {/* keep localStorage value */});
  }, []);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], selectedElement: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  const printingMethod = modelConfig.printingMethods.find(m => m.id === selectedPrintingMethod);
  const totalPrintingCost = printingMethod?.costPerUnit ?? 0;

  const selectedElementData = elements.find(e => e.id === selectedElement);

  // Save to history
  const saveToHistory = (newElements: DesignElement[], newSelected: string | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: JSON.parse(JSON.stringify(newElements)), selectedElement: newSelected });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements(JSON.parse(JSON.stringify(prevState.elements)));
      setSelectedElement(prevState.selectedElement);
      setHistoryIndex(historyIndex - 1);
      toast.success('Undo');
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(JSON.parse(JSON.stringify(nextState.elements)));
      setSelectedElement(nextState.selectedElement);
      setHistoryIndex(historyIndex + 1);
      toast.success('Redo');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Copy: Ctrl/Cmd + C
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElement) {
        e.preventDefault();
        handleCopy();
      }
      // Duplicate: Ctrl/Cmd + D
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElement) {
        e.preventDefault();
        handleDuplicate();
      }
      // Delete: Delete or Backspace
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        handleDeleteElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedElement, historyIndex, elements]);

  // Auto-save draft
  useEffect(() => {
    if (elements.length === 0) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem('toodies_draft_design', JSON.stringify({
        elements,
        color: selectedColor,
        size: selectedSize,
        fabric: selectedFabric,
        productId,
        timestamp: Date.now()
      }));
      console.log('✅ Draft auto-saved');
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [elements, selectedColor, selectedSize, selectedFabric]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('toodies_draft_design');
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.productId === productId && Date.now() - parsed.timestamp < 86400000) { // 24 hours
        const shouldLoad = window.confirm('Found a saved draft. Load it?');
        if (shouldLoad) {
          setElements(parsed.elements);
          setSelectedColor(parsed.color);
          setSelectedSize(parsed.size);
          setSelectedFabric(parsed.fabric);
          toast.success('Draft loaded');
        }
      }
    }
  }, [productId]);

  useEffect(() => {
    drawCanvas();
  }, [elements, selectedElement, zoom, showGrid, selectedColor, isModelLoaded]);

  // Helper: draw a rounded rectangle path
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
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
    
    // Product background - Draw admin-uploaded 2D model image
    // Perfect square canvas: Fill the entire 1200x1200 area (no percentage conversion)
    const printArea = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
    
    if (isModelLoaded && stageRef.current) {
      // Draw the admin-uploaded 2D mockup image to fill entire canvas
      ctx.drawImage(
        stageRef.current,
        printArea.x,
        printArea.y,
        printArea.width,
        printArea.height
      );
    } else {
      // Fallback: Draw colored rectangle if image not loaded
      ctx.fillStyle = selectedColor.toLowerCase();
      ctx.fillRect(printArea.x, printArea.y, printArea.width, printArea.height);
      
      // Show loading message if model is being loaded
      if (!isModelLoaded && modelConfig.modelUrl) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(printArea.x, printArea.y, printArea.width, printArea.height);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading 2D Model...', printArea.x + printArea.width / 2, printArea.y + printArea.height / 2);
      }
    }
    
    // Optional: Show canvas border for reference (can be removed for production)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(printArea.x + 2, printArea.y + 2, printArea.width - 4, printArea.height - 4);
    ctx.setLineDash([]);
    
    // Elements
    elements.forEach(element => {
      ctx.save();
      
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((element.rotation * Math.PI) / 180);
      
      if (element.flipH) ctx.scale(-1, 1);
      if (element.flipV) ctx.scale(1, -1);
      
      // Apply layer opacity (default 1)
      ctx.globalAlpha = element.opacity ?? 1;

      if (element.type === 'text') {
        ctx.font = `bold ${element.fontSize || 48}px ${element.fontFamily || 'Arial'}`;
        ctx.fillStyle = element.color || '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.content, 0, 0);
      } else if (element.type === 'image') {
        // Use image cache for reliable rendering (especially for new AI-generated data-URLs)
        const cached = imageCache.current.get(element.content);
        if (cached && cached.complete && cached.naturalWidth > 0) {
          ctx.drawImage(cached, -element.width / 2, -element.height / 2, element.width, element.height);
        } else if (!cached) {
          // Load and cache, then re-draw canvas once loaded
          const img = new Image();
          img.onload = () => {
            imageCache.current.set(element.content, img);
            drawCanvas();
          };
          img.src = element.content;
          imageCache.current.set(element.content, img); // store placeholder
        }
      } else if (element.type === 'shape') {
        ctx.fillStyle = element.color || '#d4af37';
        if (element.content === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, element.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (element.content === 'square') {
          ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
        }
      }
      
      ctx.globalAlpha = 1; // reset before restore
      ctx.restore();
      
      // Selection highlight
      if (element.id === selectedElement) {
        // AI-generated layers get a purple accent; regular elements gold
        const accentColor = element.isAIGenerated ? '#a855f7' : '#d4af37';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10);
        
        const handleSize = 10;
        const handles = [
          { x: element.x - handleSize/2, y: element.y - handleSize/2 },
          { x: element.x + element.width - handleSize/2, y: element.y - handleSize/2 },
          { x: element.x - handleSize/2, y: element.y + element.height - handleSize/2 },
          { x: element.x + element.width - handleSize/2, y: element.y + element.height - handleSize/2 },
        ];
        
        ctx.fillStyle = accentColor;
        handles.forEach(handle => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        });

        // ✦ AI badge above the selection box
        if (element.isAIGenerated) {
          const badgeX = element.x + element.width / 2;
          const badgeY = element.y - 22;
          ctx.fillStyle = 'rgba(168,85,247,0.85)';
          const badgeW = 64;
          const badgeH = 18;
          roundRect(ctx, badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✦ AI Layer', badgeX, badgeY);
        }
      }
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    for (let i = elements.length - 1; i >= 0; i--) {
      const elem = elements[i];
      if (x >= elem.x && x <= elem.x + elem.width && 
          y >= elem.y && y <= elem.y + elem.height) {
        setSelectedElement(elem.id);
        setIsDragging(true);
        setDragOffset({ x: x - elem.x, y: y - elem.y });
        return;
      }
    }
    
    setSelectedElement(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const newElements = elements.map(elem => {
      if (elem.id === selectedElement) {
        return {
          ...elem,
          x: Math.max(0, Math.min(canvas.width - elem.width, x - dragOffset.x)),
          y: Math.max(0, Math.min(canvas.height - elem.height, y - dragOffset.y))
        };
      }
      return elem;
    });
    setElements(newElements);
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      saveToHistory(elements, selectedElement);
    }
    setIsDragging(false);
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
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(imageUrl, img); // pre-warm cache
        const newElement: DesignElement = {
          id: Date.now().toString(),
          type: 'image',
          content: imageUrl,
          x: 600,
          y: 450,
          width: Math.min(img.width, 350),
          height: Math.min(img.height, 350),
          rotation: 0,
          opacity: 1,
          isAIGenerated: false
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        setSelectedElement(newElement.id);
        saveToHistory(newElements, newElement.id);
        toast.success('Image added to canvas');
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element || element.type !== 'image') {
      toast.error('Please select an image element');
      return;
    }

    // Get admin settings for background removal API from Supabase
    try {
      setIsRemovingBackground(true);
      const { settingsApi } = await import('../utils/supabaseApi');
      
      const settings = await settingsApi.getAdminSettings();

      if (!settings?.background_removal_enabled || !settings?.background_removal_api_key) {
        toast.error('Background removal is not configured', {
          description: 'Please ask admin to enable and configure the API'
        });
        setIsRemovingBackground(false);
        return;
      }

      const backgroundRemovalApiKey = settings.background_removal_api_key;

      toast.info('Removing background...', { description: 'This may take a few seconds' });

      // Convert image data URL to blob
      const response = await fetch(element.content);
      const blob = await response.blob();

      // Create FormData for API request
      const formData = new FormData();
      formData.append('image_file', blob);
      formData.append('size', 'auto');

      // Call Remove.bg API
      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': backgroundRemovalApiKey
        },
        body: formData
      });

      if (!removeBgResponse.ok) {
        const errorData = await removeBgResponse.json();
        throw new Error(errorData.errors?.[0]?.title || 'Background removal failed');
      }

      // Convert response to blob and then to data URL
      const resultBlob = await removeBgResponse.blob();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const processedImageUrl = event.target?.result as string;

        // Pre-warm cache with the new processed image
        const cachedImg = new Image();
        cachedImg.onload = () => imageCache.current.set(processedImageUrl, cachedImg);
        cachedImg.src = processedImageUrl;
        
        // Update the element with the processed image
        const updatedElements = elements.map(el =>
          el.id === elementId ? { ...el, content: processedImageUrl } : el
        );
        
        setElements(updatedElements);
        saveToHistory(updatedElements, selectedElement);
        toast.success('Background removed successfully!');
      };
      
      reader.readAsDataURL(resultBlob);

    } catch (error: any) {
      console.error('Background removal error:', error);
      toast.error('Failed to remove background', {
        description: error.message || 'Please try again or check your API key'
      });
      setIsRemovingBackground(false);
    }
  };

  const handleAddText = () => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Your Text',
      x: 600,
      y: 450,
      width: 350,
      height: 100,
      rotation: 0,
      color: '#FFFFFF',
      fontSize: 56,
      fontFamily: 'Montserrat'
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    saveToHistory(newElements, newElement.id);
    toast.success('Text element added');
  };

  const handleAddShape = (shape: 'circle' | 'square') => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type: 'shape',
      content: shape,
      x: 600,
      y: 450,
      width: 180,
      height: 180,
      rotation: 0,
      color: '#d4af37'
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    saveToHistory(newElements, newElement.id);
    toast.success('Shape added');
  };

  const handleDeleteElement = () => {
    if (!selectedElement) return;
    const newElements = elements.filter(e => e.id !== selectedElement);
    setElements(newElements);
    setSelectedElement(null);
    saveToHistory(newElements, null);
    toast.success('Element removed');
  };

  const handleCopy = () => {
    if (!selectedElement) return;
    const elem = elements.find(e => e.id === selectedElement);
    if (elem) {
      localStorage.setItem('toodies_clipboard', JSON.stringify(elem));
      toast.success('Copied to clipboard');
    }
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const elem = elements.find(e => e.id === selectedElement);
    if (elem) {
      const newElement = {
        ...elem,
        id: Date.now().toString(),
        x: elem.x + 20,
        y: elem.y + 20
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedElement(newElement.id);
      saveToHistory(newElements, newElement.id);
      toast.success('Element duplicated');
    }
  };

  // AI Design Generation handler - generates image via Paperspace SD and adds it as a layer
  const handleGenerateAIDesign = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe your design first');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);
    setAiGenerationStep('Connecting to Stable Diffusion...');

    try {
      setAiGenerationStep('Sending prompt to Paperspace AI...');
      const imageDataUrl = await generateWithPaperspaceSD(aiPrompt.trim(), productName);

      setAiGenerationStep('Processing generated image...');

      // Add generated image to canvas as a layer (same as uploaded images)
      const img = new Image();
      img.onload = () => {
        // Pre-warm the image cache so it renders on first drawCanvas call
        imageCache.current.set(imageDataUrl, img);
        const newElement: DesignElement = {
          id: `ai_${Date.now()}`,
          type: 'image',
          content: imageDataUrl,
          x: Math.round((CANVAS_WIDTH - Math.min(img.width, 600)) / 2),
          y: Math.round((CANVAS_HEIGHT - Math.min(img.height, 600)) / 2),
          width: Math.min(img.width, 600),
          height: Math.min(img.height, 600),
          rotation: 0,
          opacity: 1,
          isAIGenerated: true
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        setSelectedElement(newElement.id);
        saveToHistory(newElements, newElement.id);
        setAiGeneratedImages(prev => [imageDataUrl, ...prev.slice(0, 4)]);
        toast.success('AI design generated and added as a layer!', {
          description: 'Move, resize, or use "Remove Background" on this layer.'
        });
        setIsGeneratingAI(false);
        setAiGenerationStep('');
      };
      img.onerror = () => {
        setAiError('Failed to load the generated image onto canvas.');
        setIsGeneratingAI(false);
        setAiGenerationStep('');
      };
      img.src = imageDataUrl;

    } catch (error: any) {
      console.error('AI generation error:', error);
      setAiError(error.message || 'Generation failed. Please check your Paperspace API settings.');
      setIsGeneratingAI(false);
      setAiGenerationStep('');
    }
  };

  // Re-add a previously generated AI image to canvas
  const handleAddGeneratedImageToCanvas = (imageDataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      imageCache.current.set(imageDataUrl, img); // pre-warm cache
      const newElement: DesignElement = {
        id: `ai_re_${Date.now()}`,
        type: 'image',
        content: imageDataUrl,
        x: Math.round((CANVAS_WIDTH - Math.min(img.width, 500)) / 2) + 30,
        y: Math.round((CANVAS_HEIGHT - Math.min(img.height, 500)) / 2) + 30,
        width: Math.min(img.width, 500),
        height: Math.min(img.height, 500),
        rotation: 0,
        opacity: 1,
        isAIGenerated: true
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedElement(newElement.id);
      saveToHistory(newElements, newElement.id);
      toast.success('Image added to canvas as a layer');
    };
    img.src = imageDataUrl;
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printArea = { x: 300, y: 150, width: 800, height: 900 };
    const newElements = elements.map(elem => {
      if (elem.id === selectedElement) {
        let newX = elem.x;
        let newY = elem.y;

        if (type === 'left') newX = printArea.x;
        if (type === 'center') newX = printArea.x + printArea.width / 2 - elem.width / 2;
        if (type === 'right') newX = printArea.x + printArea.width - elem.width;
        if (type === 'top') newY = printArea.y;
        if (type === 'middle') newY = printArea.y + printArea.height / 2 - elem.height / 2;
        if (type === 'bottom') newY = printArea.y + printArea.height - elem.height;

        return { ...elem, x: newX, y: newY };
      }
      return elem;
    });
    setElements(newElements);
    saveToHistory(newElements, selectedElement);
    toast.success('Aligned');
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (!selectedElement) return;
    const newElements = elements.map(elem => {
      if (elem.id === selectedElement) {
        if (direction === 'horizontal') {
          return { ...elem, flipH: !elem.flipH };
        } else {
          return { ...elem, flipV: !elem.flipV };
        }
      }
      return elem;
    });
    setElements(newElements);
    saveToHistory(newElements, selectedElement);
    toast.success(`Flipped ${direction}`);
  };

  const handleLayerOrder = (direction: 'forward' | 'backward') => {
    if (!selectedElement) return;
    const index = elements.findIndex(e => e.id === selectedElement);
    if (index === -1) return;

    const newElements = [...elements];
    if (direction === 'forward' && index < elements.length - 1) {
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    } else if (direction === 'backward' && index > 0) {
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    }
    setElements(newElements);
    saveToHistory(newElements, selectedElement);
    toast.success(`Moved ${direction}`);
  };

  const loadTemplate = (template: typeof DESIGN_TEMPLATES[0]) => {
    const newElements = template.elements.map((elem, i) => ({
      ...elem,
      id: `${Date.now()}_${i}`
    })) as DesignElement[];
    setElements(newElements);
    saveToHistory(newElements, null);
    toast.success(`Template "${template.name}" loaded`);
  };

  const updateSelectedElement = (updates: Partial<DesignElement>) => {
    if (!selectedElement) return;
    const newElements = elements.map(elem => 
      elem.id === selectedElement ? { ...elem, ...updates } : elem
    );
    setElements(newElements);
  };

  const updateSelectedElementWithHistory = (updates: Partial<DesignElement>) => {
    if (!selectedElement) return;
    const newElements = elements.map(elem => 
      elem.id === selectedElement ? { ...elem, ...updates } : elem
    );
    setElements(newElements);
    saveToHistory(newElements, selectedElement);
  };

  const handleSave = () => {
    if (elements.length === 0) {
      toast.error('Please add at least one design element');
      return;
    }

    if (canvasRef.current) {
      // Create a temporary canvas for export - PERFECT SQUARE 1200x1200
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1200;
      exportCanvas.height = 1200;
      const exportCtx = exportCanvas.getContext('2d');
      
      if (exportCtx) {
        // Draw the current canvas at exact 1:1 scale (NO CONVERSION)
        // This preserves all x,y coordinates exactly as designed
        exportCtx.drawImage(canvasRef.current, 0, 0, 1200, 1200);
        
        // Export as perfect 1200x1200 PNG
        const snapshot = exportCanvas.toDataURL('image/png');
        setDesignSnapshot(snapshot);
        setIsCheckoutOpen(true);
        localStorage.removeItem('toodies_draft_design');
        toast.success('Design exported as 1200×1200 perfect square');
      }
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

  // Load the 2D model image from admin upload
  useEffect(() => {
    if (modelConfig.modelUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Convert the uploaded image to a perfect square format
        // Create a temporary canvas to resize/crop to square
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1200;
        tempCanvas.height = 1200;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Calculate dimensions to fit image into square while maintaining aspect ratio
          const aspectRatio = img.width / img.height;
          let drawWidth = 1200;
          let drawHeight = 1200;
          let offsetX = 0;
          let offsetY = 0;
          
          if (aspectRatio > 1) {
            // Image is wider - fit to height
            drawHeight = 1200;
            drawWidth = 1200 * aspectRatio;
            offsetX = -(drawWidth - 1200) / 2;
          } else {
            // Image is taller - fit to width
            drawWidth = 1200;
            drawHeight = 1200 / aspectRatio;
            offsetY = -(drawHeight - 1200) / 2;
          }
          
          // Draw the image centered and fitted to the square canvas
          tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          // Create a new image from the square canvas
          const squareImg = new Image();
          squareImg.onload = () => {
            stageRef.current = squareImg;
            setIsModelLoaded(true);
            toast.success('2D Model loaded as 1200×1200 square');
            drawCanvas();
          };
          squareImg.src = tempCanvas.toDataURL('image/png');
        }
      };
      img.onerror = () => {
        console.error('Failed to load 2D model image:', modelConfig.modelUrl);
        toast.error('Failed to load product model image');
        setIsModelLoaded(false);
      };
      img.src = modelConfig.modelUrl;
    } else {
      console.warn('No modelUrl configured for this product');
      setIsModelLoaded(false);
    }
  }, [modelConfig.modelUrl]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-none !w-screen !h-screen bg-black border-none text-white !p-0 overflow-hidden !rounded-none !m-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !inset-0">
          <div className="flex flex-col h-screen w-screen">
            {/* Top Navigation Bar - Compact */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black shrink-0">
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-white/10 text-xs gap-2 h-9"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-white uppercase tracking-tight leading-none">
                    ADVANCED 2D DESIGN
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                    {productName} - {selectedColor} / {selectedSize}
                  </DialogDescription>
                </div>
              </div>

              <Button
                variant="outline"
                className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 gap-2 px-4 h-9 text-xs"
                onClick={onClose}
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </Button>
            </div>

            {/* Horizontal Tool Tabs - Compact */}
            <div className="px-6 py-2.5 border-b border-white/10 bg-black/50 shrink-0">
              <div className="flex items-center justify-center gap-1.5">
                {[
                  { id: 'upload', icon: Upload, label: 'UPLOAD' },
                  { id: 'text', icon: Type, label: 'TEXT' },
                  { id: 'shapes', icon: Square, label: 'SHAPES' },
                  { id: 'templates', icon: FileText, label: 'TEMPLATES' },
                  { id: 'ai', icon: Sparkles, label: 'AI DESIGN' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all min-w-[100px] ${
                      activeTab === tab.id
                        ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mb-0.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area - Full Height */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Sidebar - Compact Width */}
              <div className="w-[320px] border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col overflow-y-auto custom-scrollbar shrink-0">
                <div className="p-4 space-y-4">
                  <AnimatePresence mode="wait">
                    {/* Upload Tab */}
                    {activeTab === 'upload' && (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <h3 className="text-base font-black text-[#d4af37] uppercase tracking-wider">UPLOAD DESIGN</h3>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-white/5 border-2 border-dashed border-white/20 hover:border-[#d4af37] hover:bg-[#d4af37]/5 text-white h-48 rounded-2xl group"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Upload className="w-12 h-12 text-[#d4af37] group-hover:scale-110 transition-transform" />
                            <span className="font-black text-base uppercase tracking-wider">UPLOAD IMAGE</span>
                            <span className="text-sm text-slate-500">PNG, JPG, SVG</span>
                          </div>
                        </Button>

                        {/* Product Options */}
                        <Card className="bg-white/[0.02] border-white/10 rounded-2xl p-6 space-y-5 mt-6">
                          <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">PRODUCT OPTIONS</h3>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Color</Label>
                              <Select value={selectedColor} onValueChange={setSelectedColor}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-sm">
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
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-sm">
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
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-sm">
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
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Printing Method</Label>
                              <Select value={selectedPrintingMethod} onValueChange={setSelectedPrintingMethod}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-sm">
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

                            <div className="pt-4 border-t border-white/10">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 uppercase font-bold">Printing Cost</span>
                                <span className="text-xl font-black text-[#d4af37]">₹{totalPrintingCost.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    {/* Text Tab */}
                    {activeTab === 'text' && (
                      <motion.div
                        key="text"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <h3 className="text-base font-black text-[#d4af37] uppercase tracking-wider">ADD TEXT</h3>
                        <Button
                          onClick={handleAddText}
                          className="w-full bg-[#d4af37] hover:bg-[#c9a227] text-black font-black h-20 rounded-2xl text-base"
                        >
                          <Type className="w-6 h-6 mr-3" />
                          Add Text Element
                        </Button>

                        {selectedElementData?.type === 'text' && (
                          <div className="space-y-5 pt-5 border-t border-white/10">
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Text Content</Label>
                              <Input
                                value={selectedElementData.content}
                                onChange={(e) => updateSelectedElement({ content: e.target.value })}
                                onBlur={() => saveToHistory(elements, selectedElement)}
                                className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Font Family</Label>
                              <Select value={selectedElementData.fontFamily || 'Arial'} onValueChange={(value) => updateSelectedElementWithHistory({ fontFamily: value })}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                  {GOOGLE_FONTS.map(font => (
                                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                      {font}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Font Size</Label>
                              <Slider
                                value={[selectedElementData.fontSize || 48]}
                                onValueChange={([value]) => updateSelectedElement({ fontSize: value })}
                                onValueCommit={([value]) => updateSelectedElementWithHistory({ fontSize: value })}
                                min={12}
                                max={120}
                                step={1}
                                className="py-4"
                              />
                              <p className="text-xs text-slate-500 text-center font-bold">{selectedElementData.fontSize || 48}px</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Text Color</Label>
                              <Input
                                type="color"
                                value={selectedElementData.color || '#FFFFFF'}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                onBlur={() => saveToHistory(elements, selectedElement)}
                                className="bg-black/40 border-white/10 h-12 rounded-xl"
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Shapes Tab */}
                    {activeTab === 'shapes' && (
                      <motion.div
                        key="shapes"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <h3 className="text-base font-black text-[#d4af37] uppercase tracking-wider">SHAPES</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => handleAddShape('circle')}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-28 rounded-2xl"
                          >
                            <Circle className="w-12 h-12 text-slate-400" />
                          </Button>
                          <Button
                            onClick={() => handleAddShape('square')}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-28 rounded-2xl"
                          >
                            <Square className="w-12 h-12 text-slate-400" />
                          </Button>
                        </div>

                        {selectedElementData?.type === 'shape' && (
                          <div className="space-y-5 pt-5 border-t border-white/10">
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Shape Color</Label>
                              <Input
                                type="color"
                                value={selectedElementData.color || '#d4af37'}
                                onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                onBlur={() => saveToHistory(elements, selectedElement)}
                                className="bg-black/40 border-white/10 h-12 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Size</Label>
                              <Slider
                                value={[selectedElementData.width]}
                                onValueChange={([value]) => updateSelectedElement({ width: value, height: value })}
                                onValueCommit={([value]) => updateSelectedElementWithHistory({ width: value, height: value })}
                                min={50}
                                max={400}
                                step={10}
                                className="py-4"
                              />
                              <p className="text-xs text-slate-500 text-center font-bold">{selectedElementData.width}px</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === 'templates' && (
                      <motion.div
                        key="templates"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <h3 className="text-base font-black text-[#d4af37] uppercase tracking-wider">DESIGN TEMPLATES</h3>
                        
                        {/* Admin-Uploaded Gifting Templates */}
                        {(() => {
                          const businessInfo = storageUtils.getBusinessInfo();
                          const hasNeckLabel = businessInfo.neckLabelTemplate;
                          const hasThankYouCard = businessInfo.thankYouCardTemplate;
                          
                          if (hasNeckLabel || hasThankYouCard) {
                            return (
                              <div className="space-y-3 pb-4 border-b border-white/10">
                                <h4 className="text-xs font-black text-[#d4af37]/70 uppercase tracking-wider flex items-center gap-2">
                                  <Gift className="w-3 h-3" />
                                  Gifting Templates
                                </h4>
                                {hasNeckLabel && (
                                  <Button
                                    onClick={() => {
                                      const img = new Image();
                                      img.onload = () => {
                                        const newElement: DesignElement = {
                                          id: Date.now().toString(),
                                          type: 'image',
                                          content: businessInfo.neckLabelTemplate!,
                                          x: 500,
                                          y: 350,
                                          width: 250,
                                          height: 150,
                                          rotation: 0
                                        };
                                        const newElements = [...elements, newElement];
                                        setElements(newElements);
                                        setSelectedElement(newElement.id);
                                        saveToHistory(newElements, newElement.id);
                                        toast.success('Neck Label template added');
                                      };
                                      img.src = businessInfo.neckLabelTemplate!;
                                    }}
                                    className="w-full bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 h-16 rounded-2xl justify-start text-white text-sm"
                                  >
                                    <Tag className="w-5 h-5 mr-3 text-[#d4af37]" />
                                    <span>Neck Label</span>
                                  </Button>
                                )}
                                {hasThankYouCard && (
                                  <Button
                                    onClick={() => {
                                      const img = new Image();
                                      img.onload = () => {
                                        const newElement: DesignElement = {
                                          id: Date.now().toString(),
                                          type: 'image',
                                          content: businessInfo.thankYouCardTemplate!,
                                          x: 400,
                                          y: 300,
                                          width: 400,
                                          height: 300,
                                          rotation: 0
                                        };
                                        const newElements = [...elements, newElement];
                                        setElements(newElements);
                                        setSelectedElement(newElement.id);
                                        saveToHistory(newElements, newElement.id);
                                        toast.success('Thank You Card template added');
                                      };
                                      img.src = businessInfo.thankYouCardTemplate!;
                                    }}
                                    className="w-full bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 h-16 rounded-2xl justify-start text-white text-sm"
                                  >
                                    <Gift className="w-5 h-5 mr-3 text-[#d4af37]" />
                                    <span>Thank You Card</span>
                                  </Button>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Default Design Templates */}
                        <div>
                          <h4 className="text-xs font-black text-[#d4af37]/70 uppercase tracking-wider mb-3">Pre-made Designs</h4>
                          <div className="space-y-4">
                            {DESIGN_TEMPLATES.map(template => (
                              <Button
                                key={template.id}
                                onClick={() => loadTemplate(template)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-16 rounded-2xl justify-start text-white text-sm"
                              >
                                <FileText className="w-5 h-5 mr-3" />
                                {template.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {/* AI Design Tab */}
                    {activeTab === 'ai' && (
                      <motion.div
                        key="ai"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-5"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-[#d4af37]/20 border border-purple-500/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#d4af37]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">AI DESIGN GENERATOR</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Powered by Stable Diffusion</p>
                          </div>
                        </div>

                        {/* ── AI FEATURE DISABLED: Coming Soon Screen ── */}
                        {!isAIFeatureEnabled ? (
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-5">
                            {/* Animated sparkle icon */}
                            <div className="relative">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center mx-auto">
                                <Sparkles className="w-9 h-9 text-[#d4af37]/50" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-3 h-3 text-slate-500" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-white font-black uppercase tracking-[3px] text-base">AI Design</h4>
                              <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full px-4 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                                <span className="text-[#d4af37] font-black text-xs uppercase tracking-widest">Coming Soon</span>
                              </div>
                            </div>

                            <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
                              AI-powered design generation is currently unavailable. Check back soon for an exciting update.
                            </p>

                            <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3">
                              <p className="text-[10px] text-slate-600 leading-relaxed">
                                Our team is fine-tuning the AI to deliver premium print-ready designs tailored for Toodies custom apparel.
                              </p>
                            </div>
                          </div>
                        ) : (
                        <>
                        {/* Info banner */}
                        <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-xl p-3">
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Describe your design. AI generates it as a <span className="text-[#d4af37] font-bold">transparent layer</span> added directly to your canvas — move, resize, or remove background just like any uploaded image.
                          </p>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-2">
                          <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Design Description</label>
                          <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g. A fierce dragon made of golden flames, Japanese ink brush style, centered graphic, bold black outlines..."
                            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl p-3 resize-none focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 placeholder:text-slate-600"
                            rows={5}
                            disabled={isGeneratingAI}
                          />
                          <p className="text-[10px] text-slate-600">
                            "No background" is added to every prompt automatically.
                          </p>
                        </div>

                        {/* Quick prompt suggestions */}
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Quick Ideas</label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'Minimalist lion head',
                              'Geometric mountain',
                              'Rose skull tattoo',
                              'Abstract wave',
                              'Retro sun burst',
                              'Space astronaut',
                              'Phoenix bird',
                              'Samurai mask'
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => setAiPrompt(prev => prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion)}
                                disabled={isGeneratingAI}
                                className="text-[10px] bg-white/5 hover:bg-[#d4af37]/10 border border-white/10 hover:border-[#d4af37]/30 text-slate-400 hover:text-[#d4af37] px-2 py-1 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Generate Button */}
                        <button
                          onClick={handleGenerateAIDesign}
                          disabled={isGeneratingAI || !aiPrompt.trim()}
                          className="w-full h-14 rounded-xl font-black uppercase tracking-wider text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
                          style={{
                            background: isGeneratingAI
                              ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d4af37 100%)'
                              : 'linear-gradient(135deg, #7c3aed 0%, #d4af37 100%)',
                            boxShadow: isGeneratingAI
                              ? '0 0 20px rgba(139,92,246,0.4)'
                              : '0 4px 12px rgba(212,175,55,0.25)'
                          }}
                        >
                          {isGeneratingAI ? (
                            <span className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span className="truncate">{aiGenerationStep || 'Generating...'}</span>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Wand2 className="w-5 h-5" />
                              Generate with AI
                            </span>
                          )}
                        </button>

                        {/* Error Display */}
                        {aiError && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-red-400 font-bold mb-1">Generation Failed</p>
                                <p className="text-[11px] text-red-300/80 leading-relaxed">{aiError}</p>
                                {(aiError.includes('not configured') || aiError.includes('API key') || aiError.includes('active')) && (
                                  <p className="text-[10px] text-red-300/50 mt-1.5">
                                    Admin: Go to Admin Dashboard → AI Integration Settings → enable "Paperspace (Stable Diffusion)" and add your API key + endpoint URL.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Previously Generated Images */}
                        {aiGeneratedImages.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                              Generated Designs — click to add as layer
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {aiGeneratedImages.map((imgUrl, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleAddGeneratedImageToCanvas(imgUrl)}
                                  className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-[#d4af37]/50 transition-all group"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`AI generated design ${idx + 1}`}
                                    className="w-full h-full object-contain bg-slate-900/80"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <Plus className="w-5 h-5 text-[#d4af37]" />
                                    <span className="text-[10px] text-[#d4af37] font-bold">ADD</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin setup note */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1">
                          <p className="text-[10px] text-[#d4af37] font-black uppercase tracking-wider">⚙ Admin Setup Required</p>
                          <p className="text-[10px] text-slate-600 leading-relaxed">
                            Configure Paperspace API key in:<br />
                            Admin Panel → AI Integration Settings → Paperspace (Stable Diffusion)
                          </p>
                        </div>
                        </>
                        )} {/* end isAIFeatureEnabled */}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Element Controls - Always show when element is selected */}
                  {selectedElementData && (
                    <Card className="bg-white/[0.02] border-white/10 rounded-2xl p-5 space-y-5 mt-6">
                      {/* Header with AI badge */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">ELEMENT CONTROLS</h3>
                        {selectedElementData.isAIGenerated && (
                          <span className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Layer
                          </span>
                        )}
                      </div>
                      
                      {/* Background Removal Button - Only for images */}
                      {selectedElementData.type === 'image' && (
                        <Button
                          onClick={() => handleRemoveBackground(selectedElement!)}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 h-12"
                        >
                          <Eraser className="w-4 h-4 mr-2" />
                          Remove Background
                        </Button>
                      )}
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Rotation</Label>
                          <Slider
                            value={[selectedElementData.rotation]}
                            onValueChange={([value]) => updateSelectedElement({ rotation: value })}
                            onValueCommit={([value]) => updateSelectedElementWithHistory({ rotation: value })}
                            min={0}
                            max={360}
                            step={1}
                            className="py-3"
                          />
                          <p className="text-xs text-slate-500 text-center font-bold">{selectedElementData.rotation}°</p>
                        </div>

                        {/* Opacity slider — available for all layer types */}
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Opacity</Label>
                          <Slider
                            value={[Math.round((selectedElementData.opacity ?? 1) * 100)]}
                            onValueChange={([value]) => updateSelectedElement({ opacity: value / 100 })}
                            onValueCommit={([value]) => updateSelectedElementWithHistory({ opacity: value / 100 })}
                            min={5}
                            max={100}
                            step={1}
                            className="py-3"
                          />
                          <p className="text-xs text-slate-500 text-center font-bold">
                            {Math.round((selectedElementData.opacity ?? 1) * 100)}%
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleAlign('left')} className="border-white/10 text-white text-xs h-10" title="Align Left">
                            <AlignLeft className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAlign('center')} className="border-white/10 text-white text-xs h-10" title="Align Center">
                            <AlignCenter className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAlign('right')} className="border-white/10 text-white text-xs h-10" title="Align Right">
                            <AlignRight className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleFlip('horizontal')} className="border-white/10 text-white text-xs h-10" title="Flip H">
                            <FlipHorizontal className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleFlip('vertical')} className="border-white/10 text-white text-xs h-10" title="Flip V">
                            <FlipVertical className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" onClick={handleDuplicate} className="border-white/10 text-white text-xs h-10" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleDeleteElement} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-10" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Layers Panel - always visible, shows all canvas layers */}
                  {elements.length > 0 && (
                    <Card className="bg-white/[0.02] border-white/10 rounded-2xl p-4 space-y-2 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                        <h3 className="text-xs font-black text-[#d4af37] uppercase tracking-wider">Layers</h3>
                        <span className="ml-auto text-[10px] text-slate-600 font-bold">{elements.length}</span>
                      </div>
                      <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar">
                        {[...elements].reverse().map((el, idx) => {
                          const isSelected = el.id === selectedElement;
                          const layerLabel =
                            el.type === 'text' ? el.content.substring(0, 18) || 'Text'
                            : el.type === 'shape' ? `Shape (${el.content})`
                            : el.isAIGenerated ? '✦ AI Image'
                            : 'Image';
                          return (
                            <button
                              key={el.id}
                              onClick={() => setSelectedElement(el.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                                isSelected
                                  ? el.isAIGenerated
                                    ? 'bg-purple-500/20 border border-purple-500/40'
                                    : 'bg-[#d4af37]/15 border border-[#d4af37]/40'
                                  : 'hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              {/* Type icon */}
                              <span className={`w-5 h-5 flex items-center justify-center rounded flex-shrink-0 ${
                                el.isAIGenerated ? 'text-purple-400' : 'text-slate-400'
                              }`}>
                                {el.type === 'text' ? (
                                  <Type className="w-3 h-3" />
                                ) : el.type === 'shape' ? (
                                  <Square className="w-3 h-3" />
                                ) : el.isAIGenerated ? (
                                  <Sparkles className="w-3 h-3" />
                                ) : (
                                  <ImageIcon className="w-3 h-3" />
                                )}
                              </span>
                              <span className={`text-[11px] truncate flex-1 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                {layerLabel}
                              </span>
                              {/* Opacity indicator */}
                              {(el.opacity ?? 1) < 1 && (
                                <span className="text-[9px] text-slate-600 font-bold">
                                  {Math.round((el.opacity ?? 1) * 100)}%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Right - Large Canvas Area */}
              <div className="flex-1 flex flex-col bg-slate-900/50 relative">
                {/* Canvas Toolbar */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold text-white min-w-[50px] text-center">{zoom}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="text-white hover:bg-white/10 h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Help Button */}
                <div className="absolute bottom-4 right-4 z-10">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-black/80 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </div>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                  <div 
                    className="relative shadow-2xl rounded-2xl overflow-hidden border border-white/10"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="bg-slate-950 cursor-move"
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    />
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="px-8 py-5 border-t border-white/10 bg-black/90 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleUndo}
                        disabled={historyIndex === 0}
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5 disabled:opacity-30 h-10"
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo className="w-4 h-4 mr-2" />
                        Undo
                      </Button>
                      <Button
                        onClick={handleRedo}
                        disabled={historyIndex === history.length - 1}
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5 disabled:opacity-30 h-10"
                        title="Redo (Ctrl+Y)"
                      >
                        <Redo className="w-4 h-4 mr-2" />
                        Redo
                      </Button>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-xs text-slate-400">
                      <span className="font-bold">{elements.length}</span> elements
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSave}
                    disabled={elements.length === 0}
                    className="bg-[#d4af37] hover:bg-[#c9a227] text-black h-12 px-8 rounded-xl font-black uppercase tracking-wider text-sm shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Continue to Checkout
                  </Button>
                </div>

                {/* Admin Notice */}
                <div className="px-8 py-3 border-t border-white/10 bg-[#d4af37]/5 backdrop-blur-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-full bg-[#d4af37] rounded-full mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        The 2D designs are managed by human so don't worry if the designs are misplaced, the confirmation 3D view of your product will be sent to your WhatsApp.
                      </p>
                      <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-wider mt-1">— BY ADMIN</p>
                    </div>
                  </div>
                </div>
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