import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Calendar, Download, Eye, Filter, Palette, Search, Trash2, CheckCircle, XCircle, Clock, Layers, User, ExternalLink, Link as LinkIcon, Edit, Gift, Tag, Maximize2, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { designDB, DesignData } from '../utils/indexedDB';
import { storageUtils } from '../utils/storage';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DesignRenderer } from './DesignRenderer';
import { Textarea } from './ui/textarea';

type DesignItem = {
  design: DesignData;
  user: UserType;
  product?: Product;
  type: '3D' | '2D Studio';
};

export function CustomerDesignsManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'unpaid'>('paid');
  const [filteredDesigns, setFilteredDesigns] = useState<DesignItem[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<DesignItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Partial<Invoice> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [users, products, searchQuery, filterType]);

  const loadData = () => {
    const allUsers = storageUtils.getUsers();
    const allProducts = storageUtils.getProducts();
    setUsers(allUsers);
    setProducts(allProducts);
  };

  const isStudioDesign = (design: any): design is SavedCustomerDesign => {
    return ('designLayers' in design || 'designUploads' in design) && 'printingMethod' in design;
  };

  const filterDesigns = () => {
    const allDesigns: DesignItem[] = [];

    users.forEach(user => {
      // Add old 3D designs
      if (user.savedDesigns && user.savedDesigns.length > 0) {
        user.savedDesigns.forEach(design => {
          const product = products.find(p => p.id === design.productId);
          allDesigns.push({ design, user, product, type: '3D' });
        });
      }

      // Add new 2D Studio designs
      if (user.savedCustomerDesigns && user.savedCustomerDesigns.length > 0) {
        user.savedCustomerDesigns.forEach(design => {
          const product = products.find(p => p.id === design.productId);
          allDesigns.push({ design, user, product, type: '2D Studio' });
        });
      }
    });

    // Filter by payment status
    let filtered = allDesigns;
    if (filterType === 'paid') {
      filtered = allDesigns.filter(item => {
        if (isStudioDesign(item.design)) {
          return item.design.paymentStatus === 'paid';
        }
        return false; // Old 3D designs don't have payment status
      });
    } else if (filterType === 'unpaid') {
      filtered = allDesigns.filter(item => {
        if (isStudioDesign(item.design)) {
          return item.design.paymentStatus !== 'paid';
        }
        return true; // Include all old 3D designs
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const designName = item.design.name?.toLowerCase() || '';
        const userName = item.user.name?.toLowerCase() || '';
        const userEmail = item.user.email?.toLowerCase() || '';
        const productName = item.product?.name?.toLowerCase() || '';
        const orderId = isStudioDesign(item.design) ? item.design.orderId?.toLowerCase() || '' : '';
        
        return designName.includes(query) ||
               userName.includes(query) ||
               userEmail.includes(query) ||
               productName.includes(query) ||
               orderId.includes(query);
      });
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => 
      new Date(b.design.createdAt).getTime() - new Date(a.design.createdAt).getTime()
    );

    setFilteredDesigns(filtered);
  };

  const handleViewDesign = (item: DesignItem) => {
    setSelectedDesign(item);
    setIsDetailDialogOpen(true);
    
    // Initialize invoice data for 2D Studio designs
    if (isStudioDesign(item.design)) {
      const businessInfo = storageUtils.getBusinessInfo();
      const studioDesign = item.design as SavedCustomerDesign;
      
      setInvoiceData({
        invoiceNumber: `INV-${studioDesign.orderId || studioDesign.id}`,
        invoiceDate: new Date().toISOString(),
        companyName: businessInfo.companyName,
        companyAddress: `${businessInfo.address}, ${businessInfo.city}, ${businessInfo.state} ${businessInfo.pincode}`,
        companyGSTIN: businessInfo.gstin,
        companyEmail: businessInfo.email,
        companyPhone: businessInfo.phone,
        customerName: item.user.name || item.user.email,
        customerEmail: item.user.email,
        customerPhone: '',
        customerAddress: '',
        items: [{
          id: '1',
          productName: item.product?.name || 'Custom Product',
          description: `Custom ${studioDesign.printingMethod} Design - ${studioDesign.color}, ${studioDesign.size}, ${studioDesign.fabric}`,
          quantity: 1,
          unitPrice: studioDesign.printingCost,
          discount: 0,
          taxableAmount: studioDesign.printingCost,
          gstRate: 18,
          gstAmount: studioDesign.printingCost * 0.18,
          total: studioDesign.printingCost * 1.18
        }],
        subtotal: studioDesign.printingCost,
        discount: 0,
        taxableAmount: studioDesign.printingCost,
        cgst: studioDesign.printingCost * 0.09,
        sgst: studioDesign.printingCost * 0.09,
        igst: 0,
        totalTax: studioDesign.printingCost * 0.18,
        shippingCharges: 0,
        grandTotal: studioDesign.printingCost * 1.18,
        gstRate: 18,
        isInterState: false,
        notes: 'Thank you for your business!',
        termsAndConditions: '1. Payment is due within 30 days\n2. Returns accepted within 7 days',
        paymentMethod: 'Online Payment'
      });
    }
  };

  const handleOpenDesignUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDeleteDesign = (userId: string, designId: string, type: '3D' | '2D Studio') => {
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (type === '3D') {
      const updatedDesigns = (user.savedDesigns || []).filter(d => d.id !== designId);
      const updatedUser = { ...user, savedDesigns: updatedDesigns };
      storageUtils.updateCurrentUser(updatedUser);
      
      const allUsers = storageUtils.getUsers();
      const userIndex = allUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        allUsers[userIndex] = updatedUser;
        storageUtils.saveUsers(allUsers);
      }
    } else {
      const updatedDesigns = (user.savedCustomerDesigns || []).filter(d => d.id !== designId);
      const updatedUser = { ...user, savedCustomerDesigns: updatedDesigns };
      storageUtils.updateCurrentUser(updatedUser);
      
      const allUsers = storageUtils.getUsers();
      const userIndex = allUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        allUsers[userIndex] = updatedUser;
        storageUtils.saveUsers(allUsers);
      }
    }

    toast.success('Design deleted successfully');
    loadData();
    setIsDetailDialogOpen(false);
  };

  const handleDownloadPDF = () => {
    if (!selectedDesign || !invoiceData || !isStudioDesign(selectedDesign.design)) return;

    const studioDesign = selectedDesign.design as SavedCustomerDesign;

    // Copy invoice data to clipboard for manual processing
    const invoiceText = `
INVOICE
${invoiceData.invoiceNumber}

From: ${invoiceData.companyName}
${invoiceData.companyAddress}
GSTIN: ${invoiceData.companyGSTIN}

Bill To: ${invoiceData.customerName}
${invoiceData.customerEmail}

Product: ${selectedDesign.product?.name || 'Custom Product'}
Color: ${studioDesign.color} | Size: ${studioDesign.size} | Fabric: ${studioDesign.fabric}
Printing Method: ${studioDesign.printingMethod}
Design Elements: ${(studioDesign.designLayers || studioDesign.designUploads || []).length}

Subtotal: ₹${invoiceData.subtotal?.toFixed(2)}
Tax (18%): ₹${invoiceData.totalTax?.toFixed(2)}
Grand Total: ₹${invoiceData.grandTotal?.toFixed(2)}

Notes: ${invoiceData.notes}
    `.trim();

    navigator.clipboard.writeText(invoiceText);
    toast.success('Invoice details copied to clipboard!');
  };

  const getTotalDesignsCount = () => {
    return users.reduce((count, user) => 
      count + (user.savedDesigns?.length || 0) + (user.savedCustomerDesigns?.length || 0), 0
    );
  };

  const getPaidDesignsCount = () => {
    return users.reduce((count, user) => {
      const paidCount = (user.savedCustomerDesigns || []).filter(d => d.paymentStatus === 'paid').length;
      return count + paidCount;
    }, 0);
  };

  const getUsersWithDesigns = () => {
    return users.filter(user => 
      (user.savedDesigns && user.savedDesigns.length > 0) || 
      (user.savedCustomerDesigns && user.savedCustomerDesigns.length > 0)
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Total Designs</p>
                <h3 className="text-3xl font-bold text-purple-100 mt-2">{getTotalDesignsCount()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Palette className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">Paid Designs</p>
                <h3 className="text-3xl font-bold text-cyan-100 mt-2">{getPaidDesignsCount()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Layers className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-teal-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-300">Active Designers</p>
                <h3 className="text-3xl font-bold text-teal-100 mt-2">{getUsersWithDesigns()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 flex items-center gap-3">
            <Palette className="w-6 h-6" />
            Customer Designs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, design, product, or order ID..."
                className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-cyan-500' : 'border-cyan-500/30 text-cyan-400'}
              >
                All
              </Button>
              <Button
                variant={filterType === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilterType('paid')}
                className={filterType === 'paid' ? 'bg-green-500' : 'border-green-500/30 text-green-400'}
              >
                Paid
              </Button>
              <Button
                variant={filterType === 'unpaid' ? 'default' : 'outline'}
                onClick={() => setFilterType('unpaid')}
                className={filterType === 'unpaid' ? 'bg-orange-500' : 'border-orange-500/30 text-orange-400'}
              >
                Unpaid
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={loadData}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            >
              Refresh
            </Button>
          </div>

          {filteredDesigns.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-xl border border-dashed border-cyan-500/20">
              <Palette className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400 mb-2">
                {searchQuery ? 'No designs found' : 'No customer designs yet'}
              </h3>
              <p className="text-slate-600 text-sm">
                {searchQuery 
                  ? 'Try adjusting your search query' 
                  : 'Customer designs will appear here when they save designs'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader className="bg-cyan-500/10">
                  <TableRow className="border-cyan-500/20 hover:bg-cyan-500/5">
                    <TableHead className="text-cyan-300">Design</TableHead>
                    <TableHead className="text-cyan-300">Customer</TableHead>
                    <TableHead className="text-cyan-300">Product</TableHead>
                    <TableHead className="text-cyan-300">Type</TableHead>
                    <TableHead className="text-cyan-300">Status</TableHead>
                    <TableHead className="text-cyan-300">Created</TableHead>
                    <TableHead className="text-cyan-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDesigns.map((item) => (
                    <TableRow 
                      key={`${item.user.id}-${item.design.id}`}
                      className="border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center overflow-hidden border border-purple-500/30">
                            {isStudioDesign(item.design) && item.design.modelUrl && (item.design.designLayers || item.design.designUploads) ? (
                              <DesignRenderer
                                modelUrl={item.design.modelUrl}
                                layers={item.design.designLayers || item.design.designUploads?.map((u: any) => ({
                                  id: u.id,
                                  imageUrl: u.imageUrl,
                                  x: (u.normalizedX ?? 50) * 6,
                                  y: (u.normalizedY ?? 50) * 6,
                                  width: (u.normalizedWidth ?? 200) * 6,
                                  height: (u.normalizedHeight ?? 200) * 6,
                                  rotation: u.rotationDegrees || 0,
                                  printingMethodId: u.printingMethodId
                                })) || []}
                                canvasSize={48}
                                className="rounded-lg"
                              />
                            ) : item.product?.image ? (
                              <ImageWithFallback
                                src={item.product.image}
                                alt={item.design.name || 'Design'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Palette className="w-6 h-6 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{item.design.name || 'Custom Design'}</p>
                            <div className="flex gap-1 mt-1">
                              {isStudioDesign(item.design) ? (
                                <>
                                  <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-[10px]">
                                    {item.design.printingMethod}
                                  </Badge>
                                  <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-[10px]">
                                    ₹{item.design.printingCost}
                                  </Badge>
                                </>
                              ) : (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
                                  3D Design
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-cyan-100 font-medium text-sm">{item.user.name || item.user.email}</p>
                          <p className="text-slate-500 text-xs">{item.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {item.product ? (
                            <>
                              <p className="text-cyan-100 text-sm">{item.product.name}</p>
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-[10px] mt-1">
                                {item.product.category}
                              </Badge>
                            </>
                          ) : (
                            <p className="text-slate-500 text-xs">Product not found</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.type === '2D Studio' ? 'bg-teal-500/20 text-teal-400' : 'bg-purple-500/20 text-purple-400'}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isStudioDesign(item.design) ? (
                          <Badge className={item.design.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}>
                            {item.design.paymentStatus || 'unpaid'}
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.design.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDesign(item)}
                            className="h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.type === '3D' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDesignUrl((item.design as CustomDesign).designUrl)}
                              className="h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          {item.type === '2D Studio' && isStudioDesign(item.design) && item.design.paymentStatus === 'paid' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                handleViewDesign(item);
                                setTimeout(handleDownloadPDF, 500);
                              }}
                              className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDesign(item.user.id, item.design.id, item.type)}
                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

      {/* Design Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="glass-card border-cyan-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-cyan-100 flex items-center gap-3">
              <Palette className="w-6 h-6 text-purple-400" />
              Design Details {selectedDesign?.type === '2D Studio' && '& Invoice'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              View complete information about this customer design
            </DialogDescription>
          </DialogHeader>

          {selectedDesign && (
            <div className="space-y-6">
              {/* Design Preview */}
              <Card className="glass-card border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="aspect-video bg-[#0f172a]/50 rounded-xl flex items-center justify-center overflow-hidden border border-purple-500/20">
                    {isStudioDesign(selectedDesign.design) && selectedDesign.design.canvasSnapshot ? (
                      <img
                        src={selectedDesign.design.canvasSnapshot}
                        alt="Design Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : selectedDesign.product?.image ? (
                      <ImageWithFallback
                        src={selectedDesign.product.image}
                        alt={selectedDesign.design.name || 'Design'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Palette className="w-24 h-24 text-slate-700" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Design Information */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card border-cyan-500/20">
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Design Name</p>
                      <p className="text-white font-bold">{selectedDesign.design.name || 'Custom Design'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created On</p>
                      <p className="text-cyan-400 text-sm">
                        {new Date(selectedDesign.design.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {isStudioDesign(selectedDesign.design) && (
                      <>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Printing Method</p>
                          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                            {selectedDesign.design.printingMethod}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Printing Cost</p>
                          <p className="text-green-400 font-bold">₹{selectedDesign.design.printingCost}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-cyan-500/20">
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                      <p className="text-white font-bold">{selectedDesign.user.name || selectedDesign.user.email}</p>
                      <p className="text-slate-400 text-xs">{selectedDesign.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Product</p>
                      <p className="text-cyan-400 text-sm">
                        {selectedDesign.product?.name || 'N/A'}
                      </p>
                    </div>
                    {isStudioDesign(selectedDesign.design) && selectedDesign.design.orderId && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Order ID</p>
                        <p className="text-purple-400 font-mono text-xs">{selectedDesign.design.orderId}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Product Variation Details */}
              {isStudioDesign(selectedDesign.design) && (
                <Card className="glass-card border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
                  <CardContent className="pt-6">
                    <p className="text-xs text-pink-300 uppercase tracking-wider mb-3 font-bold">Product Specifications</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-black/20 p-4 rounded-xl border border-pink-500/20">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Color</p>
                        <p className="text-white font-bold">{selectedDesign.design.color}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-pink-500/20">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Size</p>
                        <p className="text-white font-bold text-xl">{selectedDesign.design.size}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-pink-500/20">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Fabric</p>
                        <p className="text-white font-bold">{selectedDesign.design.fabric}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gifting & Labels Details */}
              {isStudioDesign(selectedDesign.design) && (
                <Card className="glass-card border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-black">
                  <CardContent className="pt-6">
                    <p className="text-xs text-[#d4af37] uppercase tracking-widest mb-4 font-black flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      Bespoke Extras & Gifting
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Neck Label */}
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-[#d4af37]" />
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Neck Label</p>
                        </div>
                        {selectedDesign.design.neckLabel ? (
                          <div className="space-y-2">
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">Text</p>
                              <p className="text-sm font-bold text-white">{selectedDesign.design.neckLabel.text || 'N/A'}</p>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Color</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: selectedDesign.design.neckLabel.color }} />
                                  <span className="text-[10px] font-mono text-slate-300">{selectedDesign.design.neckLabel.color}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Size</p>
                                <p className="text-[10px] font-bold text-white">{selectedDesign.design.neckLabel.size}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 italic">No custom label requested</p>
                        )}
                      </div>

                      {/* Gifting Protocol */}
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="w-3 h-3 text-[#d4af37]" />
                            <p className="text-[10px] font-black uppercase text-white tracking-widest">Gifting Protocol</p>
                          </div>
                          <Badge className={selectedDesign.design.isGifting ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-slate-800 text-slate-500'}>
                            {selectedDesign.design.isGifting ? 'ACTIVATED' : 'DISABLED'}
                          </Badge>
                        </div>

                        {selectedDesign.design.isGifting && (
                          <div className="space-y-4 pt-2">
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Message Card</p>
                              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <p className="text-xs text-slate-300 italic">"{selectedDesign.design.thankYouCard?.text || 'No message provided'}"</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Premium Box</p>
                              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                <p className="text-[10px] font-bold text-white">{selectedDesign.design.box?.text || 'STANDARD BRANDING'}</p>
                                <div className="w-4 h-4 rounded shadow-inner" style={{ backgroundColor: selectedDesign.design.box?.color || '#000000' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Design URL for 3D designs */}
              {selectedDesign.type === '3D' && (
                <Card className="glass-card border-purple-500/20">
                  <CardContent className="pt-6">
                    <p className="text-xs text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <LinkIcon className="w-3 h-3" />
                      3D Design URL
                    </p>
                    <div className="bg-black/40 p-3 rounded-lg border border-purple-500/20 mb-3">
                      <p className="text-purple-200 text-sm font-mono break-all">
                        {(selectedDesign.design as CustomDesign).designUrl}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenDesignUrl((selectedDesign.design as CustomDesign).designUrl)}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-0"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Design in 3D Viewer
                      </Button>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText((selectedDesign.design as CustomDesign).designUrl);
                          toast.success('Design URL copied to clipboard');
                        }}
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        Copy URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Section for 2D Studio Designs */}
              {selectedDesign.type === '2D Studio' && isStudioDesign(selectedDesign.design) && selectedDesign.design.paymentStatus === 'paid' && invoiceData && (
                <div className="border-t border-slate-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-cyan-400">Invoice Details</h3>
                    <Button
                      size="sm"
                      variant={isEditingInvoice ? 'default' : 'outline'}
                      className={isEditingInvoice ? 'bg-cyan-500' : 'border-cyan-500/30 text-cyan-400'}
                      onClick={() => {
                        if (isEditingInvoice) {
                          toast.success('Invoice updated!');
                        }
                        setIsEditingInvoice(!isEditingInvoice);
                      }}
                    >
                      {isEditingInvoice ? <Save className="w-3 h-3 mr-1" /> : <Edit className="w-3 h-3 mr-1" />}
                      {isEditingInvoice ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500">Invoice Number</Label>
                        <Input
                          value={invoiceData.invoiceNumber}
                          onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                          disabled={!isEditingInvoice}
                          className="bg-white/5 border-slate-700"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Invoice Date</Label>
                        <Input
                          type="date"
                          value={invoiceData.invoiceDate?.split('T')[0]}
                          onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                          disabled={!isEditingInvoice}
                          className="bg-white/5 border-slate-700"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-slate-500">Notes</Label>
                      <Textarea
                        value={invoiceData.notes}
                        onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                        disabled={!isEditingInvoice}
                        className="bg-white/5 border-slate-700"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-slate-500">Terms & Conditions</Label>
                      <Textarea
                        value={invoiceData.termsAndConditions}
                        onChange={(e) => setInvoiceData({ ...invoiceData, termsAndConditions: e.target.value })}
                        disabled={!isEditingInvoice}
                        className="bg-white/5 border-slate-700"
                        rows={3}
                      />
                    </div>
                    
                    {/* Totals Summary */}
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="text-white font-bold">₹{invoiceData.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tax (18%):</span>
                        <span className="text-white font-bold">₹{invoiceData.totalTax?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg border-t border-cyan-500/20 pt-2">
                        <span className="text-cyan-400 font-bold">Grand Total:</span>
                        <span className="text-cyan-400 font-bold">₹{invoiceData.grandTotal?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                {selectedDesign.type === '2D Studio' && isStudioDesign(selectedDesign.design) && selectedDesign.design.paymentStatus === 'paid' && (
                  <Button
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF with Invoice
                  </Button>
                )}
                <Button
                  onClick={() => handleDeleteDesign(selectedDesign.user.id, selectedDesign.design.id, selectedDesign.type)}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Design
                </Button>
                <Button
                  onClick={() => setIsDetailDialogOpen(false)}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}