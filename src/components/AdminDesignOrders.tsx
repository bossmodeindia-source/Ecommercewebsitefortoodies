import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, FileText, Package, Check, X, Image, FolderArchive, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { designsApi } from '../utils/supabaseApi';
import { generateDesignPDF, downloadPDF } from '../utils/pdfGenerator';
import { 
  downloadDesignFilesAsZip, 
  downloadLayer, 
  downloadFinalDesign, 
  downloadOriginalMockup 
} from '../utils/fileDownloader';

// Type for transformed design data
interface DesignData {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  fabric: string;
  printingMethod: string;
  printingCost: number;
  basePrice: number;
  totalCost: number;
  paymentStatus: 'paid' | 'unpaid';
  orderId?: string;
  orderNumber?: string;
  timestamp: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  designLayers: any[];
  fullResolutionSnapshot?: string;
  previewSnapshot?: string;
  originalMockup?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  printableArea?: any;
  mockupBounds?: any;
  deliveryAddress?: string;
  figmaFileUrl?: string;
  name?: string;
}

export function AdminDesignOrders() {
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedDesignId, setExpandedDesignId] = useState<string | null>(null);

  useEffect(() => {
    loadAllDesigns();
  }, []);

  const loadAllDesigns = async () => {
    try {
      // ✅ NOW USING SUPABASE DATABASE
      const supabaseDesigns = await designsApi.getAll();
      
      // Transform Supabase data structure to match component expectations
      const transformedDesigns: DesignData[] = supabaseDesigns.map((sd: any) => {
        // Parse design_uploads JSONB field
        const designUploads = typeof sd.design_uploads === 'string' 
          ? JSON.parse(sd.design_uploads) 
          : sd.design_uploads || {};
        
        return {
          id: sd.id,
          userId: sd.user_id,
          productId: sd.product_id,
          productName: sd.product_name,
          color: sd.color,
          size: sd.size,
          fabric: sd.fabric,
          printingMethod: sd.printing_method,
          printingCost: Number(sd.printing_cost || 0),
          basePrice: Number(sd.total_cost || 0) - Number(sd.printing_cost || 0),
          totalCost: Number(sd.total_cost || 0),
          paymentStatus: sd.payment_status || 'unpaid',
          orderId: sd.order_id,
          orderNumber: sd.order_id,
          timestamp: new Date(sd.created_at).getTime(),
          customerName: sd.user_name,
          customerEmail: sd.user_email,
          customerPhone: '',
          designLayers: designUploads.layers || [],
          fullResolutionSnapshot: sd.canvas_snapshot || sd.thumbnail_url,
          previewSnapshot: sd.thumbnail_url,
          originalMockup: designUploads.originalMockup || '',
          canvasWidth: designUploads.canvasWidth || 600,
          canvasHeight: designUploads.canvasHeight || 600,
          printableArea: designUploads.printableArea,
          mockupBounds: designUploads.mockupBounds,
          deliveryAddress: '',
          figmaFileUrl: '',
          name: sd.product_name
        };
      });
      
      // Sort: paid first, then by timestamp
      transformedDesigns.sort((a, b) => {
        if (a.paymentStatus === 'paid' && b.paymentStatus !== 'paid') return -1;
        if (a.paymentStatus !== 'paid' && b.paymentStatus === 'paid') return 1;
        return b.timestamp - a.timestamp;
      });
      
      setDesigns(transformedDesigns);
      
      toast.success(`Loaded ${transformedDesigns.length} customer designs from database`, {
        description: `${transformedDesigns.filter(d => d.paymentStatus === 'paid').length} paid orders ready for manufacturing`
      });
    } catch (error) {
      // Silently fall back to empty designs - don't show error toast
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (design: DesignData) => {
    setDownloadingId(design.id);
    
    try {
      // Generate order number if not exists
      const orderNumber = design.orderNumber || `TDS${Date.now().toString().slice(-8)}`;
      
      const pdfData = {
        finalDesignImage: design.fullResolutionSnapshot,
        originalMockup: design.originalMockup,
        layers: design.designLayers.map(layer => ({
          id: layer.id,
          originalImage: layer.originalImage,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          rotation: layer.rotation,
          relativeX: layer.relativeX,
          relativeY: layer.relativeY,
          relativeWidth: layer.relativeWidth,
          relativeHeight: layer.relativeHeight,
          printingMethodName: layer.printingMethodName,
          printingCost: layer.printingCost
        })),
        productName: design.productName,
        color: design.color,
        size: design.size,
        fabric: design.fabric,
        basePrice: design.basePrice,
        printingCost: design.printingCost,
        totalPrice: design.basePrice + design.printingCost,
        orderId: design.orderId,
        orderNumber: orderNumber,
        customerName: design.customerName || design.userId,
        customerEmail: design.customerEmail || design.userId,
        customerPhone: design.customerPhone || '',
        orderDate: new Date(design.timestamp).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        canvasWidth: design.canvasWidth,
        canvasHeight: design.canvasHeight,
        printableArea: design.printableArea,
        mockupBounds: design.mockupBounds,
        deliveryAddress: design.deliveryAddress
      };

      const pdfBlob = await generateDesignPDF(pdfData);
      
      const fileName = `TOODIES_ORDER_${orderNumber}_${design.productName.replace(/\s+/g, '_')}.pdf`;
      
      downloadPDF(pdfBlob, fileName);
      
      // ✅ Supabase: Order number is already stored in database
      toast.success('Manufacturing PDF Downloaded!', {
        description: `Order #${orderNumber} ready for production`
      });
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllFiles = async (design: DesignData) => {
    try {
      const orderNumber = design.orderNumber || design.orderId || `TDS${Date.now().toString().slice(-8)}`;
      
      await downloadDesignFilesAsZip({
        orderNumber,
        productName: design.productName,
        finalDesign: design.fullResolutionSnapshot,
        originalMockup: design.originalMockup,
        layers: design.designLayers.map(layer => ({
          id: layer.id,
          originalImage: layer.originalImage,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          rotation: layer.rotation,
          printingMethodName: layer.printingMethodName
        }))
      });
      
      toast.success('All Design Files Downloaded!', {
        description: 'ZIP file contains all customer uploaded images'
      });
    } catch (error) {
      toast.error('Failed to download design files');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading customer designs...</div>
      </div>
    );
  }

  const paidDesigns = designs.filter(d => d.paymentStatus === 'paid');
  const unpaidDesigns = designs.filter(d => d.paymentStatus === 'unpaid');

  return (
    <div className="space-y-8">
      {/* Paid Orders */}
      {paidDesigns.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Paid Orders ({paidDesigns.length})</h3>
              <p className="text-sm text-slate-500">Ready for manufacturing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {paidDesigns.map((design) => (
              <Card key={design.id} className="glass-card border-green-500/20 overflow-hidden">
                {/* Design Preview */}
                <div className="relative aspect-square bg-slate-900/50">
                  <img
                    src={design.previewSnapshot || design.fullResolutionSnapshot}
                    alt={design.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                    ✓ PAID
                  </div>
                  
                  {/* Info badge showing it's a merged image */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs">
                    Merged: Model + {design.designLayers.length} Layer{design.designLayers.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <h4 className="text-white font-bold mb-2 truncate">{design.productName}</h4>
                  
                  {/* Order Number - Prominent */}
                  {(design.orderNumber || design.orderId) && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg">
                      <p className="text-xs text-green-300 font-semibold">Order Number:</p>
                      <p className="text-sm text-white font-bold font-mono">
                        #{design.orderNumber || design.orderId}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-slate-500">Color:</span>
                      <span className="text-cyan-400 ml-1">{design.color}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Size:</span>
                      <span className="text-cyan-400 ml-1">{design.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Fabric:</span>
                      <span className="text-cyan-400 ml-1">{design.fabric}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Layers:</span>
                      <span className="text-cyan-400 ml-1">{design.designLayers.length}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3 p-2 bg-slate-900/50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-green-400 font-bold">
                        ₹{design.basePrice + design.printingCost}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-slate-500 mb-3">
                    {new Date(design.timestamp).toLocaleString('en-IN')}
                  </p>

                  {/* Download Button */}
                  <Button
                    onClick={() => handleDownloadPDF(design)}
                    disabled={downloadingId === design.id}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                  >
                    {downloadingId === design.id ? (
                      <>Generating PDF...</>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Manufacturing PDF
                      </>
                    )}
                  </Button>

                  {/* Download All Files as ZIP */}
                  <div className="mt-2">
                    <Button
                      onClick={() => handleDownloadAllFiles(design)}
                      variant="outline"
                      className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <FolderArchive className="w-4 h-4 mr-2" />
                      Download All Files (ZIP)
                    </Button>
                    <p className="text-xs text-slate-500 mt-1 text-center">
                      2400x2400 PNG • 100% Quality • No Compression
                    </p>
                  </div>

                  {/* Toggle Layer Details */}
                  <Button
                    onClick={() => setExpandedDesignId(expandedDesignId === design.id ? null : design.id)}
                    variant="outline"
                    className="w-full mt-2 border-slate-500/30 text-slate-400 hover:bg-slate-500/10"
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    {expandedDesignId === design.id ? 'Hide' : 'View'} Customer Files ({design.designLayers.length})
                  </Button>

                  {/* Expanded Layer Details */}
                  {expandedDesignId === design.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <div className="p-3 bg-slate-900/50 border border-cyan-500/20 rounded-lg space-y-3">
                        <p className="text-xs font-bold text-cyan-300 mb-2">CUSTOMER UPLOADED FILES:</p>
                        
                        {/* Final Design */}
                        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-green-500/20">
                          <Image className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-white flex-1 font-mono">Final Design</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFinalDesign(
                              design.fullResolutionSnapshot,
                              design.orderNumber || design.orderId || 'TDS',
                              design.productName
                            )}
                            className="h-6 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Original Mockup */}
                        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-blue-500/20">
                          <Image className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-white flex-1 font-mono">Original Mockup</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadOriginalMockup(
                              design.originalMockup,
                              design.orderNumber || design.orderId || 'TDS',
                              design.productName
                            )}
                            className="h-6 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Individual Layers */}
                        {design.designLayers.map((layer, index) => (
                          <div key={layer.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-cyan-500/20">
                            <Image className="w-4 h-4 text-cyan-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-mono truncate">
                                Layer {index + 1}
                              </p>
                              {layer.printingMethodName && (
                                <p className="text-[10px] text-cyan-400">{layer.printingMethodName}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadLayer(layer.originalImage, index + 1, layer.printingMethodName)}
                              className="h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Figma Link */}
                  {design.figmaFileUrl && (
                    <Button
                      onClick={() => window.open(design.figmaFileUrl, '_blank')}
                      variant="outline"
                      className="w-full mt-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View in Figma
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Unpaid Designs */}
      {unpaidDesigns.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pending Payment ({unpaidDesigns.length})</h3>
              <p className="text-sm text-slate-500">Waiting for customer payment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {unpaidDesigns.map((design) => (
              <Card key={design.id} className="glass-card border-amber-500/20 overflow-hidden opacity-60">
                <div className="relative aspect-square bg-slate-900/50">
                  <img
                    src={design.fullResolutionSnapshot}
                    alt={design.name}
                    className="w-full h-full object-cover grayscale"
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                    UNPAID
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="text-white font-bold mb-2 truncate">{design.productName}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-slate-500">Layers:</span>
                      <span className="text-cyan-400 ml-1">{design.designLayers.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Price:</span>
                      <span className="text-cyan-400 ml-1">₹{design.basePrice + design.printingCost}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    {new Date(design.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {designs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg mb-2">No customer designs yet</p>
          <p className="text-slate-500 text-sm">Designs will appear here when customers create them</p>
        </div>
      )}
    </div>
  );
}