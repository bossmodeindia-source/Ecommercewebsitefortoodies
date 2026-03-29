import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Package, Clock, Mail, Phone, MapPin, ChevronUp, ChevronDown, ExternalLink, Download, Copy, Camera, Palette, Truck, CheckCircle, Send, DollarSign, FileText, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ordersApi, invoicesApi } from '../utils/supabaseApi';
import { Order, Product, Invoice } from '../types';
import { toast } from 'sonner@2.0.3';
import { InvoiceEditor } from './InvoiceEditor';
import { downloadInvoiceAsPDF } from './InvoicePreview';
import { invoiceUtils } from '../utils/invoiceGenerator';
import { downloadDesignSheetAsPDF, DesignSheetData } from './DesignSheetPreview';
import { storageUtils } from '../utils/storage';
import { notificationService } from '../utils/notifications';

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
  const [editingOrderForInvoice, setEditingOrderForInvoice] = useState<Order | null>(null);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Prepaid payment state
  const [prepaidOrder, setPrepaidOrder] = useState<Order | null>(null);
  const [prepaidAmount, setPrepaidAmount] = useState('');
  const [prepaidReference, setPrepaidReference] = useState('');
  const [prepaidNotes, setPrepaidNotes] = useState('');

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders from Supabase
      const supabaseOrders = await ordersApi.getAll();
      
      // Map database fields to app fields
      const mappedOrders = supabaseOrders.map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        userEmail: order.user_email || 'N/A',
        userMobile: order.user_phone || 'N/A',
        items: order.order_items?.map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          variationId: item.variation_id,
          quantity: item.quantity,
          price: parseFloat(item.price),
          customDesignUrl: item.custom_design_url,
          color: item.color,
          size: item.size,
        })) || [],
        total: parseFloat(order.total),
        subtotal: parseFloat(order.subtotal || order.total),
        discount: parseFloat(order.discount || 0),
        couponCode: order.coupon_code,
        shippingCost: parseFloat(order.shipping_cost || 0),
        status: order.status,
        shippingAddress: order.shipping_address,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        paymentMethod: order.payment_method,
        paymentId: order.payment_id,
        paymentStatus: order.payment_status,
        prepaidAmount: order.prepaid_amount ? parseFloat(order.prepaid_amount) : undefined,
        prepaidDate: order.prepaid_date,
        prepaidReference: order.prepaid_reference,
        prepaidNotes: order.prepaid_notes,
        remainingAmount: order.remaining_amount ? parseFloat(order.remaining_amount) : undefined,
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id,
        razorpaySignature: order.razorpay_signature,
        invoice: order.invoice_id ? { id: order.invoice_id } : undefined,
        notificationSent: order.notification_sent,
        date: order.created_at,
        orderNumber: order.order_number,
      }));
      
      setOrders(mappedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load orders from Supabase:', error);
      // Silently fall back to empty orders - don't show error toast
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = () => {
    setProducts(storageUtils.getProducts());
  };

  const handleUpdateTracking = async (order: Order) => {
    if (!trackingNumber) {
      toast.error('Please enter a tracking number');
      return;
    }

    try {
      // Update in Supabase
      await ordersApi.update(order.id, {
        tracking_number: trackingNumber,
        tracking_url: trackingUrl || null,
      });
      
      // Send notifications
      notificationService.sendTrackingUpdate(order.userEmail, order.userMobile, {
        ...order,
        trackingNumber,
        trackingUrl
      });

      toast.success('Tracking information updated and notifications sent!');
      setTrackingNumber('');
      setTrackingUrl('');
      setSelectedOrder(null);
      await loadOrders();
    } catch (error) {
      console.error('Failed to update tracking:', error);
      toast.error('Failed to update tracking information');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      // Update in Supabase
      await ordersApi.update(orderId, { status });
      toast.success(`Order status updated to ${status}`);
      await loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const handleOpenInvoiceEditor = (order: Order) => {
    setEditingOrderForInvoice(order);
    setIsInvoiceEditorOpen(true);
  };

  const handleSaveInvoice = async (invoiceData: any) => {
    if (!editingOrderForInvoice) return;
    
    try {
      // Prepare invoice data for Supabase
      const invoicePayload = {
        invoice_number: invoiceData.invoiceNumber,
        order_id: editingOrderForInvoice.id,
        order_number: editingOrderForInvoice.orderNumber || editingOrderForInvoice.id.slice(-8).toUpperCase(),
        date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate || null,
        customer_name: editingOrderForInvoice.userEmail.split('@')[0], // Use email as fallback
        customer_email: editingOrderForInvoice.userEmail,
        customer_phone: editingOrderForInvoice.userMobile,
        customer_address: editingOrderForInvoice.shippingAddress || '',
        subtotal: invoiceData.subtotal,
        tax: invoiceData.taxAmount,
        tax_rate: invoiceData.taxRate,
        discount: invoiceData.discount || 0,
        shipping_cost: invoiceData.shippingCharge || 0,
        total: invoiceData.total,
        notes: invoiceData.notes || '',
        terms: invoiceData.termsAndConditions || '',
        status: 'draft',
        items: invoiceData.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.rate,
          total_price: item.amount,
        })) || []
      };

      // Create invoice in Supabase
      await invoicesApi.create(invoicePayload);
      
      toast.success('Invoice saved to database successfully!');
      await loadOrders(); // Reload orders to reflect new invoice
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error('Failed to save invoice to database');
    }
    
    setIsInvoiceEditorOpen(false);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    downloadInvoiceAsPDF(invoice);
    toast.success('Downloading invoice...');
  };

  const handleRecordPrepaidPayment = async (order: Order) => {
    const amount = parseFloat(prepaidAmount);
    
    if (!prepaidAmount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid prepaid amount');
      return;
    }

    if (amount > order.total) {
      toast.error('Prepaid amount cannot exceed order total');
      return;
    }

    try {
      // Update in Supabase
      await ordersApi.update(order.id, {
        prepaid_amount: amount,
        prepaid_date: new Date().toISOString(),
        prepaid_reference: prepaidReference || null,
        prepaid_notes: prepaidNotes || null,
        remaining_amount: order.total - amount,
      });
      
      await loadOrders();
      
      toast.success(`₹${amount} prepaid recorded successfully!`, {
        description: `Remaining: ₹${(order.total - amount).toFixed(2)}`
      });
      
      // Reset form
      setPrepaidOrder(null);
      setPrepaidAmount('');
      setPrepaidReference('');
      setPrepaidNotes('');
    } catch (error) {
      console.error('Failed to record prepaid payment:', error);
      toast.error('Failed to record prepaid payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-3 rounded-xl glow-border">
            <Package className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cyan-100">Order Management</h2>
            <p className="text-slate-400">Review and process customer orders</p>
          </div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Layout className="w-3 h-3" />
          {orders.length} Total Orders
        </div>
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <Card className="glass-card border-cyan-500/20 py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Package className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-400">No customer orders found</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const hasCustomDesign = order.items.some(item => !!item.customDesignUrl);
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card className={`glass-card border-2 transition-all duration-300 ${
                  expandedOrder === order.id ? 'border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-cyan-500/20'
                }`}>
                  <CardHeader className="cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-cyan-100 flex items-center gap-2">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </CardTitle>
                          {hasCustomDesign && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse">
                              <Palette className="w-3 h-3 mr-1" />
                              3D Design
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-cyan-500" />
                            {order.userEmail}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-teal-500" />
                            {order.userMobile}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center gap-2 font-bold text-slate-300">
                            <MapPin className="w-3 h-3" />
                            {order.shippingAddress ? `${order.shippingAddress.substring(0, 30)}...` : 'No address'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                          ₹{order.total.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(order.status)} border shadow-sm`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1.5 capitalize font-bold">{order.status}</span>
                          </Badge>
                          {expandedOrder === order.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 space-y-6">
                          <div className="h-px bg-cyan-500/10 mx-0 mb-6" />
                          
                          {/* Items List */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Order Items</Label>
                            <div className="grid gap-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a]/40 border border-white/5 group hover:border-cyan-500/20 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <p className="font-bold text-white text-sm">{getProductName(item.productId)}</p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                  
                                  {item.customDesignUrl && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3"
                                        onClick={() => window.open(item.customDesignUrl, '_blank')}
                                      >
                                        <ExternalLink className="w-3 h-3 mr-2" />
                                        Visit Design
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3"
                                        onClick={() => {
                                          const product = products.find(p => p.id === item.productId);
                                          const variation = product?.variations.find(v => v.id === item.variationId);
                                          const settings = storageUtils.getAdminSettings();
                                          
                                          const data: DesignSheetData = {
                                            orderId: order.id,
                                            orderDate: order.date,
                                            customerName: order.userEmail.split('@')[0], // Fallback if name not in order
                                            customerPhone: order.userMobile,
                                            customerEmail: order.userEmail,
                                            shippingAddress: order.shippingAddress || 'Address not provided',
                                            item: item,
                                            productName: product?.name || 'Unknown Product',
                                            variationName: `${variation?.color || ''} - ${variation?.size || ''}`,
                                            companyName: 'Toodies',
                                            companyContact: settings.whatsappNumber || '+91-9886510858'
                                          };
                                          downloadDesignSheetAsPDF(data);
                                          toast.success('Generating production design sheet...');
                                        }}
                                      >
                                        <Download className="w-3 h-3 mr-2" />
                                        PDF Sheet
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-8 rounded-lg px-3"
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.customDesignUrl!);
                                          toast.success('Design URL copied to clipboard!', {
                                            description: 'You can now share this URL for manufacturing reference.'
                                          });
                                        }}
                                        title="Copy Design URL"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                      <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:animate-bounce" title="Capture Screenshot Required">
                                        <Camera className="w-3 h-3 text-purple-400" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 3D Design Callout for Admin */}
                          {hasCustomDesign && (
                            <>
                              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-4">
                                <div className="bg-purple-500/20 p-2.5 rounded-xl">
                                  <Palette className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-purple-100 mb-1">Production Required: 3D Designs Detected</p>
                                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                    This order contains custom user designs. Click "Visit Design" above to view the product from all angles or "PDF Sheet" to download the production reference document.
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase h-8"
                                      onClick={() => {
                                        const customItems = order.items.filter(i => i.customDesignUrl);
                                        customItems.forEach((item, index) => {
                                          setTimeout(() => {
                                            const product = products.find(p => p.id === item.productId);
                                            const variation = product?.variations.find(v => v.id === item.variationId);
                                            const settings = storageUtils.getAdminSettings();
                                            
                                            const data: DesignSheetData = {
                                              orderId: order.id,
                                              orderDate: order.date,
                                              customerName: order.userEmail.split('@')[0],
                                              customerPhone: order.userMobile,
                                              customerEmail: order.userEmail,
                                              shippingAddress: order.shippingAddress || 'Address not provided',
                                              item: item,
                                              productName: product?.name || 'Unknown Product',
                                              variationName: `${variation?.color || ''} - ${variation?.size || ''}`,
                                              companyName: 'Toodies',
                                              companyContact: settings.whatsappNumber || '+91-9886510858'
                                            };
                                            downloadDesignSheetAsPDF(data);
                                          }, index * 1000); // Stagger downloads to prevent browser blocking
                                        });
                                        toast.success(`Downloading ${customItems.length} design sheets...`);
                                      }}
                                    >
                                      <Download className="w-3 h-3 mr-2" />
                                      Download All Sheets
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Complete Design URLs for Manufacturing */}
                              <div className="space-y-3">
                                <Label className="text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                  <Palette className="w-3 h-3" />
                                  Permanent Design URLs (For WooCommerce Integration)
                                </Label>
                                <div className="grid gap-2">
                                  {order.items.filter(item => item.customDesignUrl).map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-purple-300">
                                          {getProductName(item.productId)} (Qty: {item.quantity})
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs text-purple-400 hover:text-purple-300"
                                          onClick={() => {
                                            navigator.clipboard.writeText(item.customDesignUrl!);
                                            toast.success('Copied!');
                                          }}
                                        >
                                          <Copy className="w-3 h-3 mr-1" />
                                          Copy URL
                                        </Button>
                                      </div>
                                      <p className="text-[10px] text-purple-300/70 font-mono break-all bg-black/20 p-2 rounded border border-purple-500/10">
                                        {item.customDesignUrl}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Address Info */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shipping Destination</Label>
                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-slate-300 text-sm leading-relaxed">
                              {order.shippingAddress || 'No shipping address provided.'}
                            </div>
                          </div>

                          {/* Admin Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <div className="space-y-3">
                              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Execution Status</Label>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleUpdateStatus(order.id, value)}
                              >
                                <SelectTrigger className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 h-11 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f172a] border-cyan-500/30 text-slate-200">
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-end">
                              <Button
                                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                variant="outline"
                                className={`w-full h-11 rounded-xl transition-all ${
                                  selectedOrder?.id === order.id 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                    : 'border-teal-500/30 text-teal-400 hover:bg-teal-500/10'
                                }`}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                {selectedOrder?.id === order.id ? 'Close Tracking Panel' : 'Manage Logistics'}
                              </Button>
                            </div>
                          </div>

                          {/* Tracking Update Panel */}
                          <AnimatePresence>
                            {selectedOrder?.id === order.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 bg-teal-500/5 rounded-2xl p-5 border border-teal-500/20"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold text-teal-400 uppercase tracking-widest">Tracking ID *</Label>
                                    <Input
                                      value={trackingNumber}
                                      onChange={(e) => setTrackingNumber(e.target.value)}
                                      placeholder="e.g., SHIP123456789"
                                      className="bg-[#0f172a]/80 border-teal-500/30 text-white placeholder:text-slate-600 h-10 rounded-lg"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold text-teal-400 uppercase tracking-widest">Tracking URL</Label>
                                    <Input
                                      value={trackingUrl}
                                      onChange={(e) => setTrackingUrl(e.target.value)}
                                      placeholder="https://track.it/..."
                                      className="bg-[#0f172a]/80 border-teal-500/30 text-white placeholder:text-slate-600 h-10 rounded-lg"
                                    />
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleUpdateTracking(order)}
                                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold rounded-xl h-11"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Dispatch & Notify Customer
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Prepaid Payment Recording */}
                          <div className="space-y-3 pt-4 border-t border-white/5">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prepaid Payment Management</Label>
                            
                            {/* Show existing prepaid info if available */}
                            {order.prepaidAmount && order.prepaidAmount > 0 ? (
                              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Prepaid Amount</p>
                                    <p className="text-lg font-bold text-green-400">₹{order.prepaidAmount.toLocaleString('en-IN')}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Remaining Amount</p>
                                    <p className="text-lg font-bold text-yellow-400">₹{(order.remainingAmount || 0).toLocaleString('en-IN')}</p>
                                  </div>
                                  {order.prepaidReference && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1">Reference</p>
                                      <p className="text-sm text-slate-300">{order.prepaidReference}</p>
                                    </div>
                                  )}
                                  {order.prepaidDate && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1">Date</p>
                                      <p className="text-sm text-slate-300">{new Date(order.prepaidDate).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  {order.prepaidNotes && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-slate-500 mb-1">Notes</p>
                                      <p className="text-sm text-slate-300">{order.prepaidNotes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3"
                                onClick={() => {
                                  setPrepaidOrder(order);
                                  setPrepaidAmount(order.total.toString());
                                }}
                              >
                                <DollarSign className="w-3 h-3 mr-2" />
                                Record Prepaid Payment
                              </Button>
                            )}
                          </div>

                          {/* Prepaid Payment Form */}
                          <AnimatePresence>
                            {prepaidOrder?.id === order.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 bg-gold-500/5 rounded-2xl p-5 border border-gold-500/20"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gold-400 uppercase tracking-widest">Amount Received *</Label>
                                    <Input
                                      type="number"
                                      value={prepaidAmount}
                                      onChange={(e) => setPrepaidAmount(e.target.value)}
                                      placeholder="Enter amount"
                                      max={order.total}
                                      className="bg-[#0f172a]/80 border-gold-500/30 text-white placeholder:text-slate-600 h-10 rounded-lg"
                                    />
                                    <p className="text-xs text-slate-500">Max: ₹{order.total.toLocaleString('en-IN')}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gold-400 uppercase tracking-widest">Transaction Reference</Label>
                                    <Input
                                      value={prepaidReference}
                                      onChange={(e) => setPrepaidReference(e.target.value)}
                                      placeholder="Transaction ID / UPI Ref"
                                      className="bg-[#0f172a]/80 border-gold-500/30 text-white placeholder:text-slate-600 h-10 rounded-lg"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-gold-400 uppercase tracking-widest">Notes (Optional)</Label>
                                  <Input
                                    value={prepaidNotes}
                                    onChange={(e) => setPrepaidNotes(e.target.value)}
                                    placeholder="Payment method, bank name, etc."
                                    className="bg-[#0f172a]/80 border-gold-500/30 text-white placeholder:text-slate-600 h-10 rounded-lg"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleRecordPrepaidPayment(order)}
                                    className="flex-1 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold rounded-xl h-11"
                                  >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Save Prepaid Payment
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setPrepaidOrder(null);
                                      setPrepaidAmount('');
                                      setPrepaidReference('');
                                      setPrepaidNotes('');
                                    }}
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Invoice Management */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Invoice Management</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3"
                                onClick={() => handleOpenInvoiceEditor(order)}
                              >
                                <FileText className="w-3 h-3 mr-2" />
                                Edit Invoice
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 h-8 rounded-lg px-3"
                                onClick={() => {
                                  const invoice = order.invoice || invoiceUtils.generateInvoiceFromOrder(order);
                                  handleDownloadInvoice(invoice);
                                }}
                                title="Download Invoice"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Invoice Editor Modal */}
      {isInvoiceEditorOpen && editingOrderForInvoice && (
        <InvoiceEditor
          order={editingOrderForInvoice}
          isOpen={isInvoiceEditorOpen}
          onSave={handleSaveInvoice}
          onDownload={handleDownloadInvoice}
          onClose={() => setIsInvoiceEditorOpen(false)}
        />
      )}
    </div>
  );
}