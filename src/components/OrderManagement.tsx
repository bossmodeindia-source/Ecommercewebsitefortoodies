import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Truck, MapPin, Send, CheckCircle, Clock, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { notificationService } from '../utils/notifications';
import { Order } from '../types';
import { toast } from 'sonner@2.0.3';

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const allOrders = storageUtils.getOrders();
    setOrders(allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleUpdateTracking = (order: Order) => {
    if (!trackingNumber) {
      toast.error('Please enter a tracking number');
      return;
    }

    storageUtils.updateOrderTracking(order.id, trackingNumber, trackingUrl);
    
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
    loadOrders();
  };

  const handleUpdateStatus = (orderId: string, status: string) => {
    storageUtils.updateOrderStatus(orderId, status);
    toast.success(`Order status updated to ${status}`);
    loadOrders();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-3 rounded-xl glow-border">
          <Package className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">Order Management</h2>
          <p className="text-slate-400">Manage and track customer orders</p>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card className="glass-card border-cyan-500/20">
            <CardContent className="pt-6">
              <p className="text-center text-slate-400">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className="glass-card glass-card-hover border-cyan-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-cyan-100 flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-cyan-400" />
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-cyan-500" />
                          {order.userEmail}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-teal-500" />
                          {order.userMobile}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        ${order.total.toFixed(2)}
                      </div>
                      <Badge className={`mt-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.trackingNumber && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                        <span className="font-semibold text-cyan-100">Tracking Information</span>
                      </div>
                      <p className="text-lg text-cyan-300 font-mono">{order.trackingNumber}</p>
                      {order.trackingUrl && (
                        <a 
                          href={order.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 text-sm underline mt-1 inline-block"
                        >
                          View Tracking Details →
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-cyan-100 mb-2 block">Update Status</Label>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateStatus(order.id, value)}
                      >
                        <SelectTrigger className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-cyan-500/30">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      variant="outline"
                      className="border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {selectedOrder?.id === order.id ? 'Cancel' : 'Update Tracking'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {selectedOrder?.id === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="bg-[#0f172a]/30 rounded-xl p-4 border border-cyan-500/20">
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="tracking-number" className="text-cyan-100">
                                Tracking Number *
                              </Label>
                              <Input
                                id="tracking-number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="e.g., 1Z999AA10123456784"
                                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="tracking-url" className="text-cyan-100">
                                Tracking URL (Optional)
                              </Label>
                              <Input
                                id="tracking-url"
                                value={trackingUrl}
                                onChange={(e) => setTrackingUrl(e.target.value)}
                                placeholder="https://tracking.example.com/..."
                                className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
                              />
                            </div>
                            <Button
                              onClick={() => handleUpdateTracking(order)}
                              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Update & Send Notifications
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="text-sm text-slate-400">
                    <strong className="text-slate-300">Items:</strong> {order.items.length} product(s)
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
