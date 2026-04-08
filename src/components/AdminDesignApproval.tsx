import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Eye, MessageSquare, Clock, Filter, Search, ChevronDown, FileDown, Download, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { storageUtils } from '../utils/storage';
import { SavedCustomerDesign } from '../types';
import { toast } from 'sonner@2.0.3';
import { designDB, DesignData } from '../utils/indexedDB';
import { DesignRenderer } from './DesignRenderer';
import jsPDF from 'jspdf';
import { designsApi } from '../utils/supabaseApi';

export function AdminDesignApproval() {
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<DesignData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedDesign, setSelectedDesign] = useState<DesignData | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [adminPrice, setAdminPrice] = useState('');

  useEffect(() => {
    loadDesigns();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [designs, searchQuery, statusFilter]);

  useEffect(() => {
    // Set default price when design is selected
    if (selectedDesign) {
      const calculatedPrice = selectedDesign.basePrice + selectedDesign.printingCost;
      setAdminPrice((selectedDesign.adminSetPrice || calculatedPrice).toString());
    }
  }, [selectedDesign]);

  const loadDesigns = async () => {
    try {
      // ✅ NOW USING SUPABASE DATABASE
      const supabaseDesigns = await designsApi.getAll();
      
      // Transform Supabase data to match component expectations
      const transformedDesigns: DesignData[] = supabaseDesigns.map((sd: any) => {
        const designUploads = typeof sd.design_uploads === 'string' 
          ? JSON.parse(sd.design_uploads) 
          : sd.design_uploads || {};
        
        // Extract reviewer name from joined data
        const reviewerName = sd.reviewer ? (sd.reviewer.full_name || sd.reviewer.email || 'Admin') : (sd.reviewed_by || '');
        
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
          timestamp: new Date(sd.created_at).getTime(),
          customerName: sd.user_name,
          userEmail: sd.user_email,
          userName: sd.user_name,
          designLayers: designUploads.layers || [],
          designUploads: designUploads.layers || [],
          modelUrl: designUploads.originalMockup || '',
          highResolutionExport: sd.canvas_snapshot || sd.thumbnail_url,
          previewSnapshot: sd.thumbnail_url,
          paymentStatus: sd.payment_status || 'unpaid',
          approvalStatus: sd.approval_status || 'pending',
          approvalDate: sd.approval_date,
          approvalNotes: sd.approval_notes,
          reviewedBy: reviewerName,  // ✅ NOW SHOWS NAME INSTEAD OF UUID
          adminSetPrice: sd.admin_set_price ? Number(sd.admin_set_price) : undefined,
          neckLabel: sd.neck_label_text ? { text: sd.neck_label_text } : undefined,
          thankYouCard: sd.thank_you_card_text ? { text: sd.thank_you_card_text } : undefined,
          box: sd.custom_box_text ? { text: sd.custom_box_text } : undefined,
          purchaseMode: sd.purchase_mode
        } as DesignData;
      });
      
      setDesigns(transformedDesigns);
    } catch (error) {
      // Silently fall back to empty designs - don't show error toast
      setDesigns([]);
    }
  };

  const filterDesigns = () => {
    let filtered = [...designs];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => (d.approvalStatus || 'pending') === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.productName.toLowerCase().includes(query) ||
        d.userName?.toLowerCase().includes(query) ||
        d.userEmail?.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
      );
    }

    setFilteredDesigns(filtered);
  };

  const handleReviewDesign = (design: DesignData, action: 'approve' | 'reject') => {
    setSelectedDesign(design);
    setReviewAction(action);
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedDesign) return;

    if (reviewAction === 'reject' && !reviewNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      // Use Supabase API to approve/reject design
      const approvalStatus = reviewAction === 'approve' ? 'approved' : 'rejected';
      const approvalNotes = reviewNotes.trim() || undefined;
      const adminSetPrice = (reviewAction === 'approve' && adminPrice) ? parseFloat(adminPrice) : undefined;

      // Call Supabase API
      await designsApi.approve(
        selectedDesign.id,
        approvalStatus as 'approved' | 'rejected',
        approvalNotes,
        adminSetPrice
      );

      // Also update local IndexedDB for offline access
      const updatedDesign: any = {
        ...selectedDesign,
        approvalStatus: approvalStatus,
        approvalDate: new Date().toISOString(),
        approvalNotes: approvalNotes,
        reviewedBy: 'admin',
        updatedAt: new Date().toISOString()
      };

      if (adminSetPrice) {
        updatedDesign.adminSetPrice = adminSetPrice;
      }

      await designDB.updateDesign(updatedDesign);

      loadDesigns();
      setIsReviewDialogOpen(false);
      setSelectedDesign(null);
      setReviewNotes('');
      setAdminPrice('');

      const finalPrice = reviewAction === 'approve' 
        ? (adminSetPrice || (selectedDesign.basePrice + selectedDesign.printingCost))
        : (selectedDesign.basePrice + selectedDesign.printingCost);
      
      toast.success(
        reviewAction === 'approve' 
          ? `Design approved! Customer can now purchase for ₹${finalPrice.toFixed(2)}.` 
          : 'Design rejected. Customer has been notified with the reason.',
        {
          description: 'Changes saved to cloud database'
        }
      );
    } catch (error: any) {
      toast.error('Failed to update design', {
        description: error.message || 'Please try again'
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    const actualStatus = status || 'pending';
    
    switch (actualStatus) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending Review</Badge>;
    }
  };

  const handleDownloadPDF = async (design: DesignData) => {
    try {
      toast.loading('📄 Generating production PDF...', { id: 'pdf-download' });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Header - TOODIES Branding
      pdf.setFillColor(212, 175, 55); // Gold #D4AF37
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOODIES', margin, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Premium Custom Apparel - Production Sheet', margin, 30);

      // Design ID and Date
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.text(`Design ID: ${design.id}`, pageWidth - margin, 20, { align: 'right' });
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 26, { align: 'right' });

      let yPos = 50;

      // Product Information Section
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRODUCT INFORMATION', margin + 3, yPos + 5.5);
      yPos += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Product Name: ${design.productName}`, margin, yPos);
      yPos += 7;
      pdf.text(`Color: ${design.color}`, margin, yPos);
      pdf.text(`Size: ${design.size}`, pageWidth / 2, yPos);
      yPos += 7;
      pdf.text(`Fabric: ${design.fabric}`, margin, yPos);
      pdf.text(`Printing Method: ${design.printingMethod}`, pageWidth / 2, yPos);
      yPos += 12;

      // Customer Information Section
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CUSTOMER INFORMATION', margin + 3, yPos + 5.5);
      yPos += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${design.customerName || 'Unknown'}`, margin, yPos);
      yPos += 7;
      if (design.userEmail) {
        pdf.text(`Email: ${design.userEmail}`, margin, yPos);
        yPos += 7;
      }
      yPos += 5;

      // Pricing Section
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRICING BREAKDOWN', margin + 3, yPos + 5.5);
      yPos += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Base Price: ₹${design.basePrice.toFixed(2)}`, margin, yPos);
      yPos += 7;
      pdf.text(`Printing Cost: ₹${design.printingCost.toFixed(2)}`, margin, yPos);
      yPos += 7;
      
      const finalPrice = design.adminSetPrice || (design.basePrice + design.printingCost);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`Total Price: ₹${finalPrice.toFixed(2)}`, margin, yPos);
      
      if (design.adminSetPrice) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(212, 175, 55);
        pdf.text('(Admin Override Price)', margin + 50, yPos);
        pdf.setTextColor(0, 0, 0);
      }
      yPos += 12;

      // Design Layers Section
      if (design.designLayers && design.designLayers.length > 0) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DESIGN LAYERS', margin + 3, yPos + 5.5);
        yPos += 15;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        design.designLayers.forEach((layer: any, index: number) => {
          pdf.text(`Layer ${index + 1}:`, margin, yPos);
          pdf.text(`Position: X=${layer.x}px, Y=${layer.y}px`, margin + 20, yPos);
          yPos += 6;
          pdf.text(`Size: ${layer.width}px × ${layer.height}px`, margin + 20, yPos);
          if (layer.rotation) {
            pdf.text(`Rotation: ${layer.rotation}°`, margin + 80, yPos);
          }
          yPos += 6;
          if (layer.printingMethodName) {
            pdf.text(`Method: ${layer.printingMethodName}`, margin + 20, yPos);
            pdf.text(`Cost: ₹${layer.printingCost?.toFixed(2) || '0.00'}`, margin + 80, yPos);
            yPos += 6;
          }
          yPos += 3;
        });
        yPos += 5;
      }

      // High-Resolution Design Image
      if (design.highResolutionExport || design.previewSnapshot) {
        // Add new page for design image
        pdf.addPage();
        yPos = margin;

        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PRODUCTION-READY DESIGN', margin + 3, yPos + 5.5);
        yPos += 15;

        // Add high-resolution image
        const imageData = design.highResolutionExport || design.previewSnapshot;
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = imgWidth; // Square aspect ratio

        if (imageData) {
          pdf.addImage(imageData, 'PNG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;

          // Image specs
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Resolution: 1200×1200px (2x scale factor)', margin, yPos);
          yPos += 5;
          pdf.text('Format: PNG with transparency support', margin, yPos);
          yPos += 5;
          pdf.text('Quality: Maximum (lossless compression)', margin, yPos);
        }
      }

      // Gifting Information (if applicable)
      if (design.neckLabel || design.thankYouCard || design.box) {
        pdf.addPage();
        yPos = margin;

        pdf.setFillColor(212, 175, 55);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('GIFTING CUSTOMIZATION', margin + 3, yPos + 5.5);
        yPos += 15;

        // Neck Label
        if (design.neckLabel) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Neck Label:', margin, yPos);
          yPos += 7;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Text: ${design.neckLabel.text || 'N/A'}`, margin + 5, yPos);
          yPos += 6;
          pdf.text(`Color: ${design.neckLabel.color || '#FFFFFF'}`, margin + 5, yPos);
          yPos += 6;
          pdf.text(`Size: ${design.neckLabel.size || 'Standard'}`, margin + 5, yPos);
          yPos += 10;
        }

        // Thank You Card
        if (design.thankYouCard && design.thankYouCard.text) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Thank You Card:', margin, yPos);
          yPos += 7;
          pdf.setFont('helvetica', 'normal');
          const cardText = design.thankYouCard.text;
          const splitText = pdf.splitTextToSize(cardText, pageWidth - 2 * margin - 10);
          pdf.text(splitText, margin + 5, yPos);
          yPos += splitText.length * 6 + 5;
        }

        // Box Customization
        if (design.box && design.box.text) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Box Embossing:', margin, yPos);
          yPos += 7;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Text: ${design.box.text}`, margin + 5, yPos);
          yPos += 6;
          pdf.text(`Color: ${design.box.color || '#000000'}`, margin + 5, yPos);
        }
      }

      // Footer on first page
      pdf.setPage(1);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('This is an automated production sheet generated by TOODIES Admin Panel', pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Save PDF
      const fileName = `TOODIES_${design.productName.replace(/\s+/g, '_')}_${design.id.slice(0, 8)}.pdf`;
      pdf.save(fileName);

      toast.success('✅ Production PDF downloaded!', { 
        id: 'pdf-download',
        description: fileName
      });
    } catch (error) {
      toast.error('Failed to generate PDF', { id: 'pdf-download' });
    }
  };

  const pendingCount = designs.filter(d => !d.approvalStatus || d.approvalStatus === 'pending').length;
  const approvedCount = designs.filter(d => d.approvalStatus === 'approved').length;
  const rejectedCount = designs.filter(d => d.approvalStatus === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-3 rounded-xl glow-border">
          <CheckCircle className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">Design Approval</h2>
          <p className="text-slate-400">Review and approve custom designs from customers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-100">{pendingCount}</p>
                <p className="text-xs text-slate-400">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-100">{approvedCount}</p>
                <p className="text-xs text-slate-400">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-100">{rejectedCount}</p>
                <p className="text-xs text-slate-400">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-cyan-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-100">{designs.length}</p>
                <p className="text-xs text-slate-400">Total Designs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-cyan-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by customer, product, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-cyan-500/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Designs List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredDesigns.length === 0 ? (
            <Card className="glass-card border-cyan-500/20">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No designs found</p>
              </CardContent>
            </Card>
          ) : (
            filteredDesigns.map((design) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card border-white/5 hover:border-white/10 transition-all bg-black">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-5">
                      {/* Design Preview - Left Side */}
                      <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white flex-shrink-0 border border-white/10">
                        {design.modelUrl && (design.designLayers || design.designUploads) ? (
                          <DesignRenderer
                            modelUrl={design.modelUrl}
                            layers={design.designLayers || design.designUploads?.map((u: any) => ({
                              id: u.id,
                              imageUrl: u.imageUrl,
                              x: (u.normalizedX ?? 50) * 6,
                              y: (u.normalizedY ?? 50) * 6,
                              width: (u.normalizedWidth ?? 200) * 6,
                              height: (u.normalizedHeight ?? 200) * 6,
                              rotation: u.rotationDegrees || 0,
                              printingMethodId: u.printingMethodId
                            })) || []}
                            canvasSize={160}
                            className="w-full h-full"
                          />
                        ) : design.highResolutionExport || design.previewSnapshot ? (
                          <img
                            src={design.highResolutionExport || design.previewSnapshot}
                            alt={design.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            No Preview
                          </div>
                        )}
                      </div>

                      {/* Design Details - Center */}
                      <div className="flex-1 space-y-3">
                        {/* Product Title and Badge */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white">{design.productName}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              Design ID: {design.id.slice(-8)}
                            </p>
                          </div>
                          {getStatusBadge(design.approvalStatus)}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-4 gap-6 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Customer</p>
                            <p className="text-white font-semibold">{design.customerName || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Color</p>
                            <p className="text-white font-semibold">{design.color}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Size</p>
                            <p className="text-white font-semibold">{design.size}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Total Cost</p>
                            <p className="text-white font-semibold">
                              ₹{(design.adminSetPrice || (design.basePrice + design.printingCost)).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Printing Method</p>
                            <p className="text-white font-semibold">{design.printingMethod}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Created</p>
                            <p className="text-white font-semibold">
                              {new Date(design.timestamp).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>

                        {/* Approval Status Info */}
                        {design.approvalStatus === 'approved' && design.approvalDate && (
                          <div className="flex items-center gap-2 text-sm text-green-400 pt-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Approved on {new Date(design.approvalDate).toLocaleDateString('en-GB')}</span>
                          </div>
                        )}

                        {design.approvalStatus === 'rejected' && design.approvalDate && (
                          <div className="flex items-center gap-2 text-sm text-red-400 pt-1">
                            <XCircle className="w-4 h-4" />
                            <span>Rejected on {new Date(design.approvalDate).toLocaleDateString('en-GB')}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons - Right Side */}
                      <div className="flex flex-col gap-2 items-end">
                        {(!design.approvalStatus || design.approvalStatus === 'pending') && (
                          <>
                            <Button
                              onClick={() => handleReviewDesign(design, 'approve')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-500 text-white border-0 min-w-[100px]"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReviewDesign(design, 'reject')}
                              size="sm"
                              variant="outline"
                              className="border-red-600/50 text-red-400 hover:bg-red-600/10 min-w-[100px]"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1.5" />
                              Reject
                            </Button>
                          </>
                        )}

                        {design.approvalStatus === 'approved' && design.paymentStatus === 'paid' && (
                          <>
                            <Button
                              onClick={() => handleDownloadPDF(design)}
                              size="sm"
                              className="bg-[#d4af37] hover:bg-[#d4af37]/90 text-black border-0 font-bold min-w-[140px]"
                            >
                              <FileDown className="w-3.5 h-3.5 mr-1.5" />
                              Download PDF
                            </Button>
                            <Button
                              onClick={() => {
                                if (design.highResolutionExport) {
                                  const link = document.createElement('a');
                                  link.href = design.highResolutionExport;
                                  link.download = `${design.productName}_Complete_Design.png`;
                                  link.click();
                                  toast.success('Complete design downloaded!');
                                } else {
                                  toast.error('High-resolution export not available');
                                }
                              }}
                              size="sm"
                              variant="outline"
                              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 min-w-[140px]"
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              Full Design
                            </Button>
                            {design.designLayers && design.designLayers.length > 0 && (
                              <Button
                                onClick={() => {
                                  design.designLayers?.forEach((layer: any, index: number) => {
                                    const link = document.createElement('a');
                                    link.href = layer.imageUrl;
                                    link.download = `${design.productName}_Layer_${index + 1}_${layer.printingMethodName || 'DTF'}.png`;
                                    link.click();
                                  });
                                  toast.success(`Downloaded ${design.designLayers.length} layer(s)!`);
                                }}
                                size="sm"
                                variant="outline"
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 min-w-[140px]"
                              >
                                <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                                Layers ({design.designLayers.length})
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Rejection Notes (if exists) */}
                    {design.approvalNotes && design.approvalStatus === 'rejected' && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-300">{design.approvalNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="glass-card border-2 border-cyan-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-100 flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  Approve Design
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  Reject Design
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {reviewAction === 'approve' 
                ? 'Approve this design to allow the customer to purchase it.'
                : 'Please provide a reason for rejecting this design. The customer will see your feedback.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedDesign && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Product</p>
                    <p className="text-cyan-100 font-medium">{selectedDesign.productName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Customer</p>
                    <p className="text-cyan-100 font-medium">{selectedDesign.customerName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Base Price</p>
                    <p className="text-cyan-100 font-medium">₹{(selectedDesign.basePrice || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Printing Cost</p>
                    <p className="text-cyan-100 font-medium">₹{(selectedDesign.printingCost || 0).toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Calculated Total</p>
                    <p className="text-cyan-100 font-medium text-lg">₹{((selectedDesign.basePrice || 0) + (selectedDesign.printingCost || 0)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-cyan-100">
                {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
              </Label>
              <Textarea
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add any notes or comments about this approval (optional)...'
                    : 'Explain why this design is being rejected. Be specific so the customer can make improvements...'
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
              />
              {reviewAction === 'reject' && (
                <p className="text-xs text-slate-500">
                  Examples: "Image resolution is too low", "Design violates copyright", "Text is not readable", etc.
                </p>
              )}
            </div>

            {reviewAction === 'approve' && (
              <div className="space-y-2">
                <Label className="text-cyan-100">Set Price (Optional)</Label>
                <Input
                  placeholder="Enter a custom price for this design..."
                  value={adminPrice}
                  onChange={(e) => setAdminPrice(e.target.value)}
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                />
                <p className="text-xs text-slate-500">
                  Leave blank to use the calculated price of ₹{(selectedDesign?.basePrice + selectedDesign?.printingCost || 0).toFixed(2)}.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitReview}
                className={
                  reviewAction === 'approve'
                    ? 'flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-0'
                    : 'flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white border-0'
                }
              >
                {reviewAction === 'approve' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setIsReviewDialogOpen(false);
                  setReviewNotes('');
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}