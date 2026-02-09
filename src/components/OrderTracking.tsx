import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Package, Truck, MapPin, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Order } from '../types';

interface OrderTrackingProps {
  user: User;
}

export function OrderTracking({ user }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Sort orders by date, newest first
    const sortedOrders = [...user.orders].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setOrders(sortedOrders);
  }, [user]);

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
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'processing': return 50;
      case 'shipped': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-3 rounded-xl glow-border">
          <Package className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">Track Your Orders</h2>
          <p className="text-slate-400">Monitor the status of your purchases</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="glass-card border-cyan-500/20">
          <CardContent className="pt-12 pb-12 text-center">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-lg text-slate-400 mb-2">No orders yet</p>
            <p className="text-sm text-slate-500">Your order history will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card border-cyan-500/20 overflow-hidden">
                <CardHeader className="border-b border-cyan-500/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-cyan-100 flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-cyan-400" />
                        Order #{order.id.slice(0, 12)}
                      </CardTitle>
                      <p className="text-sm text-slate-400">
                        Placed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                      </p>
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

                <CardContent className="pt-6 space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>Order Progress</span>
                      <span>{getProgressPercentage(order.status)}%</span>
                    </div>
                    <div className="h-2 bg-[#0f172a]/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(order.status)}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="grid grid-cols-4 gap-2">
                    {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                      const isActive = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                      return (
                        <div key={status} className="text-center">
                          <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center transition-all ${
                            isActive 
                              ? 'bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border-2 border-cyan-500' 
                              : 'bg-slate-800/30 border-2 border-slate-700'
                          }`}>
                            {status === 'pending' && <Clock className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />}
                            {status === 'processing' && <Package className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />}
                            {status === 'shipped' && <Truck className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />}
                            {status === 'delivered' && <CheckCircle className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-slate-600'}`} />}
                          </div>
                          <p className={`text-xs capitalize ${isActive ? 'text-cyan-300' : 'text-slate-600'}`}>
                            {status}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tracking Information */}
                  {order.trackingNumber ? (
                    <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-cyan-500/20 p-2 rounded-lg">
                          <MapPin className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-cyan-100 mb-1">Tracking Information</p>
                          <p className="text-lg text-cyan-300 font-mono mb-2">{order.trackingNumber}</p>
                          {order.trackingUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                              onClick={() => window.open(order.trackingUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Track Package
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-300 mb-1">Tracking Pending</p>
                          <p className="text-sm text-slate-400">
                            Tracking information will be available once your order is shipped. 
                            You'll receive a notification via email and WhatsApp.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="pt-4 border-t border-cyan-500/20">
                    <p className="text-sm text-slate-400">
                      <span className="text-slate-300 font-medium">Items:</span> {order.items.length} product(s)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
