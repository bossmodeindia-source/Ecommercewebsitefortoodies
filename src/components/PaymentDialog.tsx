import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent } from './ui/card';
import { CreditCard, Wallet, Truck, Check, Banknote, Building2, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { storageUtils } from '../utils/storage';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: 'razorpay' | 'cod' | 'upi' | 'netbanking' | 'wallet' | 'emi', paymentData?: any) => void;
  total: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentDialog({ isOpen, onClose, onPaymentSuccess, total }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'upi' | 'netbanking' | 'wallet' | 'emi'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState({
    razorpay: true,
    upi: true,
    cod: true,
    netbanking: true,
    wallet: true,
    emi: true
  });

  useEffect(() => {
    const settings = storageUtils.getAdminSettings();
    if (settings.paymentMethods) {
      setEnabledMethods(settings.paymentMethods);
      
      // Set default payment method to first enabled one
      const methods: Array<'razorpay' | 'upi' | 'cod' | 'netbanking' | 'wallet' | 'emi'> = ['razorpay', 'upi', 'cod', 'netbanking', 'wallet', 'emi'];
      const firstEnabled = methods.find(method => settings.paymentMethods?.[method]);
      if (firstEnabled) {
        setPaymentMethod(firstEnabled);
      }
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setIsProcessing(true);

    if (paymentMethod === 'cod') {
      // Handle Cash on Delivery
      setTimeout(() => {
        toast.success('Order placed with Cash on Delivery!');
        onPaymentSuccess('cod');
        setIsProcessing(false);
        onClose();
      }, 1000);
      return;
    }

    if (paymentMethod === 'upi') {
      setTimeout(() => {
        const mockPaymentData = { paymentId: `upi_${Date.now()}`, status: 'completed' };
        toast.success('UPI Payment successful!');
        onPaymentSuccess('upi', mockPaymentData);
        setIsProcessing(false);
        onClose();
      }, 2000);
      return;
    }

    if (paymentMethod === 'netbanking') {
      setTimeout(() => {
        const mockPaymentData = { paymentId: `nb_${Date.now()}`, status: 'completed' };
        toast.success('Netbanking Payment successful!');
        onPaymentSuccess('netbanking', mockPaymentData);
        setIsProcessing(false);
        onClose();
      }, 2000);
      return;
    }

    if (paymentMethod === 'wallet') {
      setTimeout(() => {
        const mockPaymentData = { paymentId: `wallet_${Date.now()}`, status: 'completed' };
        toast.success('Wallet Payment successful!');
        onPaymentSuccess('wallet', mockPaymentData);
        setIsProcessing(false);
        onClose();
      }, 2000);
      return;
    }

    if (paymentMethod === 'emi') {
      setTimeout(() => {
        const mockPaymentData = { paymentId: `emi_${Date.now()}`, status: 'completed' };
        toast.success('EMI Payment successful!');
        onPaymentSuccess('emi', mockPaymentData);
        setIsProcessing(false);
        onClose();
      }, 2000);
      return;
    }

    if (paymentMethod === 'razorpay') {
      const options = {
        key: 'rzp_test_XXXXXXXXXXXXXXXX',
        amount: total * 100,
        currency: 'INR',
        name: 'Toodies',
        description: 'Custom Apparel Purchase',
        order_id: `rzp_order_${Date.now()}`,
        handler: function (response: any) {
          const paymentData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            paymentId: response.razorpay_payment_id,
            status: 'completed'
          };
          toast.success('Payment successful!');
          onPaymentSuccess('razorpay', paymentData);
          setIsProcessing(false);
          onClose();
        },
        prefill: { name: 'Customer Name', email: 'customer@example.com', contact: '9999999999' },
        theme: { color: '#06b6d4' },
        modal: { ondismiss: function() { setIsProcessing(false); toast.error('Payment cancelled'); } }
      };

      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setTimeout(() => {
          const mockPaymentData = {
            razorpayOrderId: `rzp_order_${Date.now()}`,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpaySignature: `sig_${Date.now()}`,
            paymentId: `pay_${Date.now()}`,
            status: 'completed'
          };
          toast.success('Payment successful! (Mock Mode)');
          onPaymentSuccess('razorpay', mockPaymentData);
          setIsProcessing(false);
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-2 border-cyan-500/30 bg-[#0a0e1a] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            Select Payment Method
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred payment method to complete the order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Total Amount */}
          <Card className="glass-card border-2 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-lg">Total Amount</span>
                <span className="text-3xl font-bold text-cyan-100">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <div className="space-y-3">
              {/* Razorpay */}
              {enabledMethods.razorpay && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`glass-card cursor-pointer transition-all ${
                    paymentMethod === 'razorpay' 
                      ? 'border-2 border-cyan-500 bg-cyan-500/5' 
                      : 'border border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="razorpay" id="razorpay" className="border-cyan-500" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="razorpay" className="text-cyan-100 text-lg font-medium cursor-pointer">
                            Razorpay
                          </Label>
                          <p className="text-xs text-slate-400 mt-1">
                            Credit/Debit Card, UPI, Netbanking, Wallets
                          </p>
                        </div>
                      </div>
                      {paymentMethod === 'razorpay' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* UPI */}
              {enabledMethods.upi && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`glass-card cursor-pointer transition-all ${
                    paymentMethod === 'upi' 
                      ? 'border-2 border-cyan-500 bg-cyan-500/5' 
                      : 'border border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="upi" id="upi" className="border-cyan-500" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="upi" className="text-cyan-100 text-lg font-medium cursor-pointer">
                            UPI
                          </Label>
                          <p className="text-xs text-slate-400 mt-1">
                            Google Pay, PhonePe, Paytm, BHIM
                          </p>
                        </div>
                      </div>
                      {paymentMethod === 'upi' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* Cash on Delivery */}
              {enabledMethods.cod && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`glass-card cursor-pointer transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-2 border-cyan-500 bg-cyan-500/5' 
                      : 'border border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="cod" id="cod" className="border-cyan-500" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="cod" className="text-cyan-100 text-lg font-medium cursor-pointer">
                            Cash on Delivery
                          </Label>
                          <p className="text-xs text-slate-400 mt-1">
                            Pay when you receive your order
                          </p>
                        </div>
                      </div>
                      {paymentMethod === 'cod' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* Netbanking */}
              {enabledMethods.netbanking && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`glass-card cursor-pointer transition-all ${
                    paymentMethod === 'netbanking' 
                      ? 'border-2 border-cyan-500 bg-cyan-500/5' 
                      : 'border border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                  onClick={() => setPaymentMethod('netbanking')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="netbanking" id="netbanking" className="border-cyan-500" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="netbanking" className="text-cyan-100 text-lg font-medium cursor-pointer">
                            Netbanking
                          </Label>
                          <p className="text-xs text-slate-400 mt-1">
                            All major banks supported
                          </p>
                        </div>
                      </div>
                      {paymentMethod === 'netbanking' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* Wallets */}
              {enabledMethods.wallet && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`glass-card cursor-pointer transition-all ${
                    paymentMethod === 'wallet' 
                      ? 'border-2 border-cyan-500 bg-cyan-500/5' 
                      : 'border border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                  onClick={() => setPaymentMethod('wallet')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="wallet" id="wallet" className="border-cyan-500" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="wallet" className="text-cyan-100 text-lg font-medium cursor-pointer">
                            Digital Wallets
                          </Label>
                          <p className="text-xs text-slate-400 mt-1">
                            Paytm, Amazon Pay, Mobikwik, Freecharge
                          </p>
                        </div>
                      </div>
                      {paymentMethod === 'wallet' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}

              {/* EMI */}
              {enabledMethods.emi && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`glass-card cursor-pointer transition-all ${
                    paymentMethod === 'emi' 
                      ? 'border-2 border-cyan-500 bg-cyan-500/5' 
                      : 'border border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                  onClick={() => setPaymentMethod('emi')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="emi" id="emi" className="border-cyan-500" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
                          <Banknote className="w-6 h-6 text-rose-400" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="emi" className="text-cyan-100 text-lg font-medium cursor-pointer">
                            EMI (Easy Installments)
                          </Label>
                          <p className="text-xs text-slate-400 mt-1">
                            3, 6, 9, 12 months available
                          </p>
                        </div>
                      </div>
                      {paymentMethod === 'emi' && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )}
            </div>
          </RadioGroup>

          {/* Info Message */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-xs text-cyan-300 font-mono">
              💡 Development Mode: All payments are simulated. Check console for integration details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0 py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${total.toLocaleString('en-IN')}`}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="border-slate-700 text-slate-300 py-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}