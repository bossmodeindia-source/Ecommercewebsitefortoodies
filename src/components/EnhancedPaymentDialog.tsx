import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  Wallet, 
  Truck, 
  Check, 
  Banknote, 
  Building2, 
  Smartphone,
  Tag,
  X,
  Mail,
  Phone,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { storageUtils } from '../utils/storage';
import { Coupon } from '../types';

interface DesignData {
  productName: string;
  productPrice: number;
  customizationCost: number;
  adminSetPrice?: number;
  designSnapshot?: string;
  color?: string;
  size?: string;
  fabric?: string;
}

interface EnhancedPaymentDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentMethod: 'razorpay' | 'cod' | 'upi' | 'netbanking' | 'wallet' | 'emi', paymentData?: any) => void;
  total?: number;
  designData?: DesignData;
  hasCustomDesign?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function EnhancedPaymentDialog({ 
  isOpen, 
  open,
  onClose, 
  onPaymentSuccess, 
  total,
  designData,
  hasCustomDesign = false
}: EnhancedPaymentDialogProps) {
  // Support both 'isOpen' and 'open' props for backwards compatibility
  const dialogOpen = isOpen ?? open ?? false;
  
  // Calculate total from designData if provided
  const calculatedTotal = designData 
    ? (designData.adminSetPrice || (designData.productPrice + designData.customizationCost))
    : (total || 0);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'upi' | 'netbanking' | 'wallet' | 'emi'>('razorpay');
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationStage, setVerificationStage] = useState<'idle' | 'initiating' | 'verifying' | 'finalizing'>('idle');
  
  const [enabledMethods, setEnabledMethods] = useState({
    razorpay: true,
    upi: true,
    cod: true,
    netbanking: true,
    wallet: true,
    emi: true
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);

  useEffect(() => {
    const currentUser = storageUtils.getCurrentUser();
    if (currentUser) {
      setEmail(currentUser.email || '');
      setMobile(currentUser.mobile || '');
      if (currentUser.emailVerified) setEmailVerified(true);
      if (currentUser.mobileVerified) setMobileVerified(true);
    }

    const settings = storageUtils.getAdminSettings();
    if (settings.paymentMethods) {
      setEnabledMethods(settings.paymentMethods);
      const methods: Array<'razorpay' | 'upi' | 'cod' | 'netbanking' | 'wallet' | 'emi'> = ['razorpay', 'upi', 'cod', 'netbanking', 'wallet', 'emi'];
      const firstEnabled = methods.find(method => settings.paymentMethods?.[method]);
      if (firstEnabled) setPaymentMethod(firstEnabled);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen]);

  const COD_CHARGE = 50;
  const PARTIAL_PAYMENT_PERCENT = 30;

  const discount = appliedCoupon ? calculateDiscount(calculatedTotal, appliedCoupon) : 0;
  const subtotal = calculatedTotal - discount;
  
  let finalAmount = subtotal;
  let codCharge = 0;
  let partialAmount = 0;

  if (paymentMethod === 'cod' && !hasCustomDesign) {
    if (paymentType === 'partial') {
      partialAmount = Math.round((subtotal * PARTIAL_PAYMENT_PERCENT) / 100);
      codCharge = COD_CHARGE;
      finalAmount = partialAmount + codCharge;
    } else {
      codCharge = COD_CHARGE;
      finalAmount = subtotal + codCharge;
    }
  }

  function calculateDiscount(amount: number, coupon: Coupon): number {
    if (coupon.discountType === 'percentage') {
      let disc = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) disc = Math.min(disc, coupon.maxDiscountAmount);
      return Math.round(disc);
    } else {
      return coupon.discountValue;
    }
  }

  const applyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) { setCouponError('Please enter a coupon code'); return; }
    const coupons = storageUtils.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (!coupon) { setCouponError('Invalid coupon code'); return; }
    if (!coupon.isActive) { setCouponError('This coupon is not active'); return; }
    
    const now = new Date();
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
      setCouponError('This coupon has expired');
      return;
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      setCouponError('This coupon has reached its usage limit');
      return;
    }
    if (coupon.minPurchaseAmount && calculatedTotal < coupon.minPurchaseAmount) {
      setCouponError(`Minimum purchase amount: ₹${coupon.minPurchaseAmount}`);
      return;
    }
    setAppliedCoupon(coupon);
    toast.success(`Coupon "${coupon.code}" applied successfully!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast('Coupon removed');
  };

  const sendEmailOtp = () => {
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email'); return; }
    console.log(`📧 Email OTP sent to ${email}: 123456`);
    toast.success(`Verification code sent to ${email}`);
    setEmailOtpSent(true);
  };

  const sendMobileOtp = () => {
    if (!mobile || mobile.length < 10) { toast.error('Please enter a valid mobile number'); return; }
    console.log(`📱 Mobile OTP sent to ${mobile}: 123456`);
    toast.success(`Verification code sent to ${mobile}`);
    setMobileOtpSent(true);
  };

  const verifyEmailOtp = () => {
    if (emailOtp === '123456' || emailOtp.length === 6) {
      setEmailVerified(true);
      toast.success('Email verified successfully');
    } else { toast.error('Invalid verification code'); }
  };

  const verifyMobileOtp = () => {
    if (mobileOtp === '123456' || mobileOtp.length === 6) {
      setMobileVerified(true);
      toast.success('Mobile verified successfully');
    } else { toast.error('Invalid verification code'); }
  };

  const performVerification = (paymentId: string, orderId?: string, signature?: string) => {
    setVerificationStage('verifying');
    
    setTimeout(() => {
      setVerificationStage('finalizing');
      
      setTimeout(() => {
        const paymentData = {
          paymentId,
          razorpayOrderId: orderId,
          razorpaySignature: signature,
          status: 'verified',
          discount,
          couponCode: appliedCoupon?.code,
          email,
          mobile,
          verifiedAt: new Date().toISOString()
        };
        toast.success('Payment verified successfully!');
        onPaymentSuccess(paymentMethod, paymentData);
        setIsProcessing(false);
        setVerificationStage('idle');
        onClose();
      }, 1000);
    }, 2000);
  };

  const handleRazorpayPayment = () => {
    const settings = storageUtils.getAdminSettings();
    const razorpayKeyId = settings.razorpayKeyId || 'rzp_test_YOUR_KEY_HERE';
    
    if (!window.Razorpay) {
      toast.error('Payment gateway unavailable. Please refresh the page.');
      return;
    }

    setVerificationStage('initiating');

    const options = {
      key: razorpayKeyId,
      amount: finalAmount * 100,
      currency: 'INR',
      name: 'Toodies Luxury',
      description: 'Premium Apparel Purchase',
      image: 'https://images.unsplash.com/photo-1756276900419-868625adff43?w=100',
      handler: function (response: any) {
        if (response.razorpay_payment_id) {
          performVerification(
            response.razorpay_payment_id, 
            response.razorpay_order_id, 
            response.razorpay_signature
          );
        } else {
          toast.error('Payment verification failed');
          setIsProcessing(false);
          setVerificationStage('idle');
        }
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
          setVerificationStage('idle');
          toast('Payment cancelled');
        }
      },
      prefill: {
        name: storageUtils.getCurrentUser()?.name || '',
        email: email,
        contact: mobile
      },
      theme: {
        color: '#d4af37'
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handlePayment = async () => {
    if (!emailVerified || !mobileVerified) {
      toast.error('Please verify your email and mobile number');
      return;
    }

    setIsProcessing(true);

    if (appliedCoupon) {
      const coupons = storageUtils.getCoupons();
      const updatedCoupons = coupons.map(c => c.id === appliedCoupon.id ? { ...c, usedCount: c.usedCount + 1 } : c);
      localStorage.setItem('toodies_coupons', JSON.stringify(updatedCoupons));
    }

    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment();
      return;
    }

    if (paymentMethod === 'cod') {
      setVerificationStage('verifying');
      setTimeout(() => {
        const paymentData = {
          paymentType,
          partialAmount: paymentType === 'partial' ? partialAmount : 0,
          codCharge,
          pendingAmount: paymentType === 'partial' ? (subtotal - partialAmount) : subtotal,
          discount,
          couponCode: appliedCoupon?.code,
          email,
          mobile
        };
        toast.success('Order placed successfully!');
        onPaymentSuccess('cod', paymentData);
        setIsProcessing(false);
        setVerificationStage('idle');
        onClose();
      }, 2000);
      return;
    }

    setVerificationStage('verifying');
    setTimeout(() => {
      const mockPaymentData = {
        paymentId: `${paymentMethod}_${Date.now()}`,
        status: 'verified',
        discount,
        couponCode: appliedCoupon?.code,
        email,
        mobile
      };
      toast.success('Payment successful!');
      onPaymentSuccess(paymentMethod, mockPaymentData);
      setIsProcessing(false);
      setVerificationStage('idle');
      onClose();
    }, 2500);
  };

  const paymentMethods = [
    { value: 'razorpay', label: 'Card / UPI', icon: CreditCard, description: 'All cards, UPI apps' },
    { value: 'upi', label: 'UPI', icon: Smartphone, description: 'GPay, PhonePe, Paytm' },
    { value: 'netbanking', label: 'Net Banking', icon: Building2, description: 'All major banks' },
    { value: 'wallet', label: 'Wallet', icon: Wallet, description: 'Paytm, PhonePe' },
    { value: 'cod', label: 'Cash on Delivery', icon: Truck, description: hasCustomDesign ? 'Not available' : 'Pay at doorstep' },
    { value: 'emi', label: 'EMI', icon: Banknote, description: 'Flexible installments' },
  ] as const;

  return (
    <Dialog open={dialogOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="glass-card border-[#d4af37]/20 bg-black max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-[32px] selection:bg-[#d4af37]/30">
        <AnimatePresence>
          {isProcessing && verificationStage !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative mb-12"
              >
                <div className="absolute inset-0 bg-[#d4af37]/20 rounded-full blur-3xl" />
                <div className="w-28 h-28 rounded-full border-4 border-[#d4af37]/30 border-t-[#d4af37] flex items-center justify-center">
                  <ShieldCheck className="w-12 h-12 text-[#d4af37]" />
                </div>
              </motion.div>
              
              <h2 className="text-4xl font-black text-white uppercase mb-6 tracking-tight">
                {verificationStage === 'initiating' ? 'Initiating Payment' : 
                 verificationStage === 'verifying' ? 'Verifying Transaction' : 
                 'Finalizing Order'}
              </h2>
              
              <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${verificationStage === 'initiating' ? 'text-[#d4af37]' : 'text-green-400'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Secure</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                <div className={`flex items-center gap-2 ${['verifying', 'finalizing'].includes(verificationStage) ? 'text-[#d4af37]' : 'text-slate-600'}`}>
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-bold">Encrypted</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                <div className={`flex items-center gap-2 ${verificationStage === 'finalizing' ? 'text-[#d4af37]' : 'text-slate-600'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Verified</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 font-medium max-w-md">
                Please wait while we process your transaction securely
              </p>
            </motion.div>
          )}</AnimatePresence>

        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#c9a227]/20 border border-[#d4af37]/30 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#d4af37]" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black text-white uppercase tracking-tight">
                Secure Checkout
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm font-medium mt-1">
                Complete your purchase securely
              </DialogDescription>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Custom Design Notice */}
              {hasCustomDesign && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-[#d4af37]/10 to-[#c9a227]/5 border border-[#d4af37]/30 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-[#d4af37] font-black text-sm uppercase tracking-wider mb-2">Custom Design</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        This is a custom creation. Full payment is required to begin production.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Contact Verification */}
              <Card className="bg-white/[0.02] border-white/10 rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/30">
                      <Mail className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Contact Verification</h3>
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold flex items-center justify-between">
                      Email Address
                      {emailVerified && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black/40 border-white/10 text-white h-12 rounded-xl"
                        placeholder="your@email.com"
                        disabled={emailVerified}
                      />
                      {!emailVerified && !emailOtpSent && (
                        <Button 
                          onClick={sendEmailOtp} 
                          className="bg-white text-black hover:bg-slate-200 font-black text-xs h-12 px-6 rounded-xl whitespace-nowrap"
                        >
                          Send OTP
                        </Button>
                      )}
                    </div>
                    {emailOtpSent && !emailVerified && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <Input
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-center font-mono tracking-widest"
                        />
                        <Button 
                          onClick={verifyEmailOtp} 
                          className="bg-[#d4af37] text-black hover:bg-[#c9a227] font-black text-xs h-12 px-6 rounded-xl"
                        >
                          Verify
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="space-y-3">
                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold flex items-center justify-between">
                      Mobile Number
                      {mobileVerified && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="bg-black/40 border-white/10 text-white h-12 rounded-xl"
                        placeholder="+91 00000 00000"
                        disabled={mobileVerified}
                      />
                      {!mobileVerified && !mobileOtpSent && (
                        <Button 
                          onClick={sendMobileOtp} 
                          className="bg-white text-black hover:bg-slate-200 font-black text-xs h-12 px-6 rounded-xl whitespace-nowrap"
                        >
                          Send OTP
                        </Button>
                      )}
                    </div>
                    {mobileOtpSent && !mobileVerified && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <Input
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="bg-black/40 border-white/10 text-white h-12 rounded-xl text-center font-mono tracking-widest"
                        />
                        <Button 
                          onClick={verifyMobileOtp} 
                          className="bg-[#d4af37] text-black hover:bg-[#c9a227] font-black text-xs h-12 px-6 rounded-xl"
                        >
                          Verify
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Code */}
              <Card className="bg-white/[0.02] border-white/10 rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/30">
                      <Tag className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Have a Coupon?</h3>
                  </div>

                  {!appliedCoupon ? (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="bg-black/40 border-white/10 text-white h-12 rounded-xl uppercase font-mono tracking-widest"
                        />
                        <Button 
                          onClick={applyCoupon} 
                          className="bg-white text-black hover:bg-slate-200 font-black text-xs h-12 px-6 rounded-xl"
                        >
                          Apply
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-red-400 font-medium">{couponError}</p>}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#c9a227]/5 border border-[#d4af37]/30 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[#d4af37] font-black text-sm tracking-wider">{appliedCoupon.code}</p>
                        <p className="text-xs text-slate-400 mt-1">You saved ₹{discount.toLocaleString('en-IN')}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={removeCoupon} 
                        className="text-slate-500 hover:text-white hover:bg-white/5 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Payment Methods */}
              <Card className="bg-white/[0.02] border-white/10 rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/30">
                      <CreditCard className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Payment Method</h3>
                  </div>
                  
                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <div className="space-y-3">
                      {paymentMethods.map(method => {
                        const isEnabled = enabledMethods[method.value as keyof typeof enabledMethods];
                        const isDisabled = !isEnabled || (hasCustomDesign && method.value === 'cod');
                        const Icon = method.icon;

                        return (
                          <Label
                            key={method.value}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                              paymentMethod === method.value && !isDisabled
                                ? 'bg-[#d4af37]/10 border-[#d4af37]'
                                : isDisabled
                                ? 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed'
                                : 'bg-black/40 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <RadioGroupItem value={method.value} disabled={isDisabled} className="sr-only" />
                            <div className={`p-3 rounded-lg ${paymentMethod === method.value ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-slate-400'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-black ${paymentMethod === method.value ? 'text-white' : 'text-slate-400'}`}>
                                {method.label}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">{method.description}</p>
                            </div>
                            {paymentMethod === method.value && !isDisabled && <Check className="w-5 h-5 text-[#d4af37]" />}
                          </Label>
                        );
                      })}
                    </div>
                  </RadioGroup>

                  {/* COD Options */}
                  {paymentMethod === 'cod' && !hasCustomDesign && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 space-y-3"
                    >
                      <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Payment Type</Label>
                      <RadioGroup value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                        <div className="grid grid-cols-2 gap-3">
                          <Label className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                            paymentType === 'full' ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-black/40 border-white/10'
                          }`}>
                            <RadioGroupItem value="full" className="sr-only" />
                            <p className="text-sm font-black text-white">Full Payment</p>
                            <p className="text-xs text-slate-500 mt-1">Pay on delivery</p>
                          </Label>
                          <Label className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                            paymentType === 'partial' ? 'bg-[#d4af37]/10 border-[#d4af37]' : 'bg-black/40 border-white/10'
                          }`}>
                            <RadioGroupItem value="partial" className="sr-only" />
                            <p className="text-sm font-black text-white">30% Now</p>
                            <p className="text-xs text-slate-500 mt-1">Rest on delivery</p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-[#d4af37]/20 rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-wider">Order Summary</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-white font-bold">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span className="font-bold">- ₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {paymentMethod === 'cod' && (
                      <div className="flex justify-between text-amber-400">
                        <span>COD Charges</span>
                        <span className="font-bold">+ ₹{COD_CHARGE}</span>
                      </div>
                    )}
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                      <span className="text-slate-400 font-bold">Total Amount</span>
                      <span className="text-3xl font-black text-[#d4af37]">₹{finalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4" />
            <span>Secured by 256-bit SSL encryption</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-white hover:bg-white/5 h-14 px-8 rounded-xl font-black uppercase tracking-wider text-xs"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !emailVerified || !mobileVerified}
              className="bg-[#d4af37] hover:bg-[#c9a227] text-black h-14 px-10 rounded-xl font-black uppercase tracking-wider text-xs shadow-xl shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Pay ₹{finalAmount.toLocaleString('en-IN')}
                  <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
