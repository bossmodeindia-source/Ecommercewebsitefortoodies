import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Edit3, ShoppingCart, Download, Clock, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { designDB, DesignData } from '../utils/indexedDB';
import { storageUtils } from '../utils/storage';
import { DesignCheckoutModal } from './DesignCheckoutModal';
import { DesignRenderer, exportDesignFromCoordinates } from './design-export';
import { submitDesignToFigma } from '../utils/figmaSubmission';
import { designsApi } from '../utils/supabaseApi';
import { EnhancedPaymentDialog } from './EnhancedPaymentDialog';

interface StudioMyCustomDesignsProps {
  onEditDesign?: (designId: string) => void;
}

export function StudioMyCustomDesigns({ onEditDesign }: StudioMyCustomDesignsProps) {
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<DesignData | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const currentUser = storageUtils.getCurrentUser();

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      if (!currentUser) return;
      
      // ✅ NOW LOADING FROM SUPABASE instead of IndexedDB
      const supabaseDesigns = await designsApi.getMy();
      
      // Transform Supabase data to match component expectations
      const transformedDesigns: DesignData[] = supabaseDesigns.map((sd: any) => {
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
          basePrice: Number(sd.product_price || 0),
          timestamp: new Date(sd.created_at).getTime(),
          customerName: sd.user_name,
          userEmail: sd.user_email,
          userName: sd.user_name,
          designLayers: designUploads.layers || [],
          designUploads: designUploads.layers || [],
          modelUrl: designUploads.originalMockup || sd.design_snapshot || '',
          highResolutionExport: sd.canvas_snapshot || sd.thumbnail_url,
          previewSnapshot: sd.thumbnail_url || sd.design_snapshot,
          paymentStatus: sd.payment_status || 'unpaid',
          approvalStatus: sd.approval_status || 'pending',
          approvalDate: sd.approval_date,
          approvalNotes: sd.approval_notes,
          reviewedBy: sd.reviewed_by,
          adminSetPrice: sd.admin_set_price ? Number(sd.admin_set_price) : undefined,
          neckLabel: sd.neck_label_text,
          thankYouCard: sd.thank_you_card_text,
          box: sd.custom_box_text,
          isLocked: sd.payment_status === 'paid'
        } as DesignData;
      });
      
      // Sort by timestamp (newest first)
      transformedDesigns.sort((a, b) => b.timestamp - a.timestamp);
      
      setDesigns(transformedDesigns);
    } catch (error) {
      // Silently fall back to empty designs
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    try {
      // Delete from Supabase
      await designsApi.delete(designId);
      setDesigns(prev => prev.filter(d => d.id !== designId));
      toast.success('Design deleted');
    } catch (error) {

      toast.error('Failed to delete design');
    }
  };

  const handleBuyNow = (design: DesignData) => {
    // Check approval status first
    if (design.approvalStatus === 'pending') {
      toast.info('Design is awaiting admin approval', {
        description: 'You will be notified once reviewed'
      });
      return;
    }
    
    if (design.approvalStatus === 'rejected') {
      toast.error('Design was rejected by admin', {
        description: design.approvalNotes || 'Please check review notes'
      });
      return;
    }
    
    if (design.isLocked) {
      toast.error('This design has already been purchased');
      return;
    }
    
    // Only allow payment for approved designs
    if (design.approvalStatus === 'approved') {
      setSelectedDesign(design);
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentSuccess = async (paymentDetails: any) => {
    if (!selectedDesign || !currentUser) return;

    try {
      // Update design payment status in Supabase
      await designsApi.update(selectedDesign.id, {
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method: paymentDetails.paymentMethod,
        payment_id: paymentDetails.paymentId
      });

      // Refresh designs
      await loadDesigns();

      toast.success('Payment successful!', {
        description: 'Your order has been placed'
      });
    } catch (error) {

      toast.error('Failed to process payment');
    } finally {
      setShowPaymentDialog(false);
      setSelectedDesign(null);
    }
  };

  const handleDownload = async (design: DesignData) => {
    try {
      toast('🎨 Generating high-resolution export...', { duration: 2000 });
      
      // Generate 2400x2400 PNG from coordinates
      const dataUrl = await exportDesignFromCoordinates(
        design.modelUrl,
        design.designLayers,
        2400
      );
      
      // Download the file
      const fileName = `${design.productName}_${design.color}_${design.size}_${design.id}`;
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Design downloaded!', {
        description: '2400x2400 PNG ready for printing'
      });
    } catch (error) {

      toast.error('Failed to generate export');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading your designs...</div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg mb-2">No saved designs yet</p>
        <p className="text-slate-500 text-sm">Start creating your custom design!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {designs.map((design) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="glass-card border-cyan-500/20 overflow-hidden hover:border-cyan-500/40 transition-all">
                {/* Design Preview - Rendered from coordinates */}
                <div className="relative aspect-square bg-slate-900/50 group overflow-hidden">
                  <div className="flex items-center justify-center w-full h-full">
                    <DesignRenderer
                      modelUrl={design.modelUrl}
                      layers={design.designLayers}
                      canvasSize={300}
                      className="w-full h-full"
                    />
                  </div>
                  
                  {/* Status Badge */}
                  {design.paymentStatus === 'paid' && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                      ✓ PAID
                    </div>
                  )}
                  
                  {/* Approval Status Badge */}
                  {design.paymentStatus === 'unpaid' && design.approvalStatus === 'pending' && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                      ⏳ PENDING APPROVAL
                    </div>
                  )}
                  
                  {design.paymentStatus === 'unpaid' && design.approvalStatus === 'approved' && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                      ✓ APPROVED
                    </div>
                  )}
                  
                  {design.paymentStatus === 'unpaid' && design.approvalStatus === 'rejected' && (
                    <div className="absolute top-2 right-2 px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                      ✗ REJECTED
                    </div>
                  )}
                  
                  {design.isLocked && (
                    <div className="absolute top-2 left-2 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                      🔒 LOCKED
                    </div>
                  )}
                  
                  {/* Info badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs">
                    {design.designLayers.length} Layer{design.designLayers.length > 1 ? 's' : ''}
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 hover:bg-white/20 text-white border-0"
                      onClick={() => handleDownload(design)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold mb-2 truncate">{design.productName}</h3>
                  
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
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="text-lg font-bold text-[#d4af37]">
                        ₹{(design.adminSetPrice || (design.basePrice + design.printingCost)).toLocaleString()}
                      </p>
                      {design.adminSetPrice && design.adminSetPrice !== (design.basePrice + design.printingCost) && (
                        <>
                          <p className="text-xs text-slate-500 line-through">
                            ₹{(design.basePrice + design.printingCost).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-green-400 font-bold mt-0.5">
                            {design.adminSetPrice < (design.basePrice + design.printingCost) 
                              ? '✓ Admin Discount Applied' 
                              : 'Admin Price Updated'}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-sm font-medium text-cyan-400">
                        {design.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Clock className="w-3 h-3" />
                    {new Date(design.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  {/* Rejection Notes */}
                  {design.approvalStatus === 'rejected' && design.approvalNotes && (
                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400 font-semibold mb-1">Admin Review Notes:</p>
                      <p className="text-xs text-white">{design.approvalNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {design.paymentStatus === 'unpaid' ? (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white border-0"
                        onClick={() => handleBuyNow(design)}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Buy Now
                      </Button>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          onClick={() => handleDownload(design)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download Design
                        </Button>
                        <p className="text-xs text-slate-500 mt-1 text-center">
                          2400x2400 PNG
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {design.orderId && (
                        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-xs text-green-400 font-semibold">Order ID:</p>
                          <p className="text-xs text-white font-mono">{design.orderId}</p>
                        </div>
                      )}
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => handleDownload(design)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download High-Quality PNG
                        </Button>
                        <p className="text-xs text-slate-500 mt-1 text-center">
                          2400x2400 • 100% Quality
                        </p>
                      </div>
                      {design.figmaFileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          onClick={() => window.open(design.figmaFileUrl, '_blank')}
                        >
                          View in Figma
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Delete Button (only for unpaid) */}
                  {design.paymentStatus === 'unpaid' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(design.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Checkout Modal */}
      {selectedDesign && (
        <DesignCheckoutModal
          open={showCheckout}
          onClose={() => {
            setShowCheckout(false);
            setSelectedDesign(null);
          }}
          designData={{
            productName: selectedDesign.productName,
            productPrice: selectedDesign.basePrice,
            customizationCost: selectedDesign.printingCost,
            adminSetPrice: selectedDesign.adminSetPrice, // Pass admin price
            designSnapshot: selectedDesign.fullResolutionSnapshot,
            color: selectedDesign.color,
            size: selectedDesign.size,
            fabric: selectedDesign.fabric
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment Dialog */}
      {selectedDesign && (
        <EnhancedPaymentDialog
          open={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedDesign(null);
          }}
          designData={{
            productName: selectedDesign.productName,
            productPrice: selectedDesign.basePrice,
            customizationCost: selectedDesign.printingCost,
            adminSetPrice: selectedDesign.adminSetPrice, // Pass admin price
            designSnapshot: selectedDesign.fullResolutionSnapshot,
            color: selectedDesign.color,
            size: selectedDesign.size,
            fabric: selectedDesign.fabric
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}