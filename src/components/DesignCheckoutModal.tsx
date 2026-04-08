import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card } from './ui/card';
import { CreditCard, Smartphone, Truck, Lock, ShieldCheck, CheckCircle2, Upload, Gift, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { designDB } from '../utils/indexedDB';
import { submitDesignToFigma } from '../utils/figmaSubmission';
import { Textarea } from './ui/textarea';
import { designsApi } from '../utils/supabaseApi';
import { storageUtils } from '../utils/storage';

interface DesignCheckoutModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  // Support both object format and individual props
  designData?: {
    productName: string;
    productPrice: number;
    customizationCost: number;
    adminSetPrice?: number;
    designSnapshot: string;
    color: string;
    size: string;
    fabric: string;
    productId?: string;
  };
  // Individual props (for backward compatibility)
  productName?: string;
  productId?: string;
  designSnapshot?: string;
  color?: string;
  size?: string;
  fabric?: string;
  printingMethod?: any;
  printingCost?: number;
  onPaymentSuccess?: (paymentDetails: any) => void;
  onCheckoutComplete?: (paymentDetails: any) => void;
}

export function DesignCheckoutModal({
  open,
  isOpen,
  onClose,
  designData,
  productName: directProductName,
  productId: directProductId,
  designSnapshot: directDesignSnapshot,
  color: directColor,
  size: directSize,
  fabric: directFabric,
  printingMethod: directPrintingMethod,
  printingCost: directPrintingCost = 0,
  onPaymentSuccess,
  onCheckoutComplete
}: DesignCheckoutModalProps) {
  // Support both open and isOpen props
  const isModalOpen = open || isOpen || false;
  
  // Support both designData object and individual props
  const productName = designData?.productName || directProductName || '';
  const productId = designData?.productId || directProductId || '';
  const finalDesignSnapshot = designData?.designSnapshot || directDesignSnapshot || '';
  const selectedColor = designData?.color || directColor || '';
  const selectedSize = designData?.size || directSize || '';
  const selectedFabric = designData?.fabric || directFabric || '';
  const customizationCost = designData?.customizationCost || directPrintingCost || 0;
  const productPrice = designData?.productPrice || 0;
  
  // Support both callback types
  const handlePaymentCallback = onPaymentSuccess || onCheckoutComplete;
  
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'payment' | 'success'>('details');
  
  // Form data
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');

  // Gifting Protocol State
  const [purchaseMode, setPurchaseMode] = useState<'self' | 'gift'>('self');
  const [neckLabelText, setNeckLabelText] = useState('');
  const [thankYouCardText, setThankYouCardText] = useState('');
  const [customBoxText, setCustomBoxText] = useState('');
  
  // Calculate pricing - Use admin price if set, otherwise calculate
  const baseSubtotal = productPrice + customizationCost;
  const finalSubtotal = designData?.adminSetPrice || baseSubtotal;
  const gst = Math.round(finalSubtotal * 0.18); // 18% GST
  const shipping = paymentMethod === 'cod' ? 50 : 0; // COD charges
  const total = finalSubtotal + gst + shipping;
  
  const priceOverridden = designData?.adminSetPrice && designData?.adminSetPrice !== baseSubtotal;

  const handleProceedToPayment = () => {
    if (!address || !pincode || !phone) {
      toast.error('Please fill in all delivery details');
      return;
    }
    setPaymentStep('payment');
  };

  const handleSubmitForApproval = async () => {
    // Validate delivery details
    if (!address || !pincode || !phone) {
      toast.error('Please fill in all delivery details');
      return;
    }

    // Validate customizations based on mode
    // Self mode: Neck label is REQUIRED (only customization available)
    // Gifting mode: Thank you card is REQUIRED, neck label and box are OPTIONAL
    if (purchaseMode === 'self') {
      if (!neckLabelText) {
        toast.error('Please enter neck label text for self-use mode');
        return;
      }
    } else if (purchaseMode === 'gift') {
      if (!thankYouCardText) {
        toast.error('Please enter thank you card message for gifting mode');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Get current user
      const currentUser = storageUtils.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Prepare design data for submission to Supabase
      const designSubmissionData = {
        product_id: productId,
        product_name: productName,
        design_snapshot: finalDesignSnapshot,
        color: selectedColor,
        size: selectedSize,
        fabric: selectedFabric,
        printing_method: directPrintingMethod?.name || 'DTF',
        printing_cost: customizationCost,
        product_price: productPrice,
        calculated_subtotal: baseSubtotal,
        gst_amount: gst,
        estimated_total: total,
        delivery_address: address,
        pincode: pincode,
        phone: phone,
        purchase_mode: purchaseMode,
        neck_label_text: neckLabelText,
        thank_you_card_text: purchaseMode === 'gift' ? thankYouCardText : null,
        custom_box_text: purchaseMode === 'gift' ? customBoxText : null,
        // Status fields
        approval_status: 'pending',
        payment_status: 'unpaid',
        status: 'submitted',
      };

      // Submit to Supabase
      const savedDesign = await designsApi.save(designSubmissionData);

      toast.success('Design submitted for approval!', {
        description: 'Admin will review your design and you\'ll be notified once approved.'
      });

      setPaymentStep('success');
      setIsProcessing(false);

      // Close modal after 2 seconds
      setTimeout(() => {
        if (handlePaymentCallback) {
          handlePaymentCallback({ designId: savedDesign.id });
        }
        onClose();
        setPaymentStep('details');
      }, 2500);

    } catch (error: any) {
      toast.error('Failed to submit design', {
        description: error.message || 'Please try again later'
      });
      setIsProcessing(false);
    }
  };

  // Legacy function for when design is already approved and user is paying
  const handlePayment = async () => {
    // Validate payment details
    if (paymentMethod === 'upi' && !upiId) {
      toast.error('Please enter UPI ID');
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv || !cardName)) {
      toast.error('Please fill in all card details');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const orderId = `ORD${Date.now()}`;
      const paymentId = `PAY${Date.now()}`;

      const paymentDetails = {
        orderId,
        paymentId,
        paymentMethod,
        amount: total,
        timestamp: new Date().toISOString(),
        deliveryAddress: address,
        pincode,
        phone,
        status: 'confirmed'
      };

      if (handlePaymentCallback) {
        handlePaymentCallback(paymentDetails);
      }
      setPaymentStep('success');
      setIsProcessing(false);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setPaymentStep('details');
      }, 2000);
    }, 2000);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
            Complete Your Order
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Provide your shipping details and review your design before finalizing
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {paymentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Design Preview */}
              <Card className="glass-card border-cyan-500/20 p-4">
                <h3 className="text-white font-bold mb-3">Your Custom Design</h3>
                <div className="flex gap-4">
                  <img
                    src={finalDesignSnapshot}
                    alt="Design Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-cyan-500/30"
                  />
                  <div className="flex-1 text-sm space-y-1">
                    <p className="text-white font-semibold">{productName}</p>
                    <p className="text-slate-400">Color: <span className="text-cyan-400">{selectedColor}</span></p>
                    <p className="text-slate-400">Size: <span className="text-cyan-400">{selectedSize}</span></p>
                    <p className="text-slate-400">Fabric: <span className="text-cyan-400">{selectedFabric}</span></p>
                  </div>
                </div>
              </Card>

              {/* Gifting Protocol Selection */}
              <Card className="glass-card border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <h3 className="text-white font-bold uppercase tracking-wider text-sm">Gifting Protocol</h3>
                </div>

                <p className="text-slate-400 text-xs mb-4">Is this purchase for yourself or as a gift?</p>

                {/* Self vs Gift Mode Selection */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={() => setPurchaseMode('self')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      purchaseMode === 'self'
                        ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-lg shadow-[#d4af37]/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <User className={`w-8 h-8 mx-auto mb-2 ${purchaseMode === 'self' ? 'text-[#d4af37]' : 'text-slate-500'}`} />
                    <p className={`text-sm font-bold uppercase ${purchaseMode === 'self' ? 'text-[#d4af37]' : 'text-slate-400'}`}>
                      Self Use
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Neck label only</p>
                  </button>

                  <button
                    onClick={() => setPurchaseMode('gift')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      purchaseMode === 'gift'
                        ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-lg shadow-[#d4af37]/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <Gift className={`w-8 h-8 mx-auto mb-2 ${purchaseMode === 'gift' ? 'text-[#d4af37]' : 'text-slate-500'}`} />
                    <p className={`text-sm font-bold uppercase ${purchaseMode === 'gift' ? 'text-[#d4af37]' : 'text-slate-400'}`}>
                      Gifting
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Full customization</p>
                  </button>
                </div>

                {/* Customization Fields */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  {/* Neck Label - REQUIRED for Self mode, OPTIONAL for Gift mode */}
                  <div>
                    <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-[10px]">1</span>
                      Neck Label Text {purchaseMode === 'self' && <span className="text-red-400 text-[10px]">*Required</span>}
                    </Label>
                    <Input
                      value={neckLabelText}
                      onChange={(e) => setNeckLabelText(e.target.value)}
                      placeholder="e.g., Made with ❤️ by Toodies"
                      className="bg-slate-800/50 border-[#d4af37]/30 text-white mt-1"
                      maxLength={50}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">{neckLabelText.length}/50 characters</p>
                  </div>

                  {/* Gift Mode Additional Customizations */}
                  {purchaseMode === 'gift' && (
                    <>
                      <div>
                        <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-[10px]">2</span>
                          Thank You Card Message <span className="text-red-400 text-[10px]">*Required</span>
                        </Label>
                        <Textarea
                          value={thankYouCardText}
                          onChange={(e) => setThankYouCardText(e.target.value)}
                          placeholder="Write a heartfelt message for the thank you card..."
                          className="bg-slate-800/50 border-[#d4af37]/30 text-white mt-1 min-h-[100px] resize-none"
                          maxLength={200}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">{thankYouCardText.length}/200 characters</p>
                      </div>

                      <div>
                        <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-[10px]">3</span>
                          Custom Box Text (Optional)
                        </Label>
                        <Input
                          value={customBoxText}
                          onChange={(e) => setCustomBoxText(e.target.value)}
                          placeholder="e.g., Happy Birthday! From Sarah"
                          className="bg-slate-800/50 border-[#d4af37]/30 text-white mt-1"
                          maxLength={80}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">{customBoxText.length}/80 characters</p>
                      </div>
                    </>
                  )}

                  {/* Info Badge */}
                  <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-lg p-3 mt-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {purchaseMode === 'self' 
                        ? '✨ Self-use mode: Customize ONLY the neck label (required). Perfect for personal branding!'
                        : '🎁 Gifting mode: Neck label is optional. Thank you card is required + optional custom box text!'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Price Breakdown */}
              <Card className="glass-card border-cyan-500/20 p-4">
                <h3 className="text-white font-bold mb-3">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Product Cost:</span>
                    <span>₹{productPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Customization Cost:</span>
                    <span>₹{customizationCost}</span>
                  </div>
                  {priceOverridden && (
                    <div className="flex justify-between text-slate-300">
                      <span>Admin Set Price:</span>
                      <span className="text-cyan-400">₹{designData?.adminSetPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>₹{finalSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>GST (18%):</span>
                    <span>₹{gst}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>COD Charges:</span>
                      <span>₹{shipping}</span>
                    </div>
                  )}
                  <div className="border-t border-cyan-500/20 pt-2 mt-2"></div>
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-cyan-400">₹{total}</span>
                  </div>
                </div>
              </Card>

              {/* Delivery Details */}
              <Card className="glass-card border-cyan-500/20 p-4">
                <h3 className="text-white font-bold mb-3">Delivery Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Delivery Address</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your complete address"
                      className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Pincode</Label>
                      <Input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Enter pincode"
                        className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Phone Number</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleSubmitForApproval}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8941f] hover:from-[#b8941f] hover:to-[#d4af37] text-black font-bold py-6 text-lg uppercase tracking-wider shadow-lg shadow-[#d4af37]/30"
              >
                {isProcessing ? (
                  <>Submitting Design...</>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Submit for Admin Approval
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {paymentStep === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Payment Method Selection */}
              <Card className="glass-card border-cyan-500/20 p-4">
                <h3 className="text-white font-bold mb-3">Select Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-cyan-500/30 cursor-pointer hover:bg-cyan-500/10 transition">
                      <RadioGroupItem value="upi" id="upi" />
                      <Smartphone className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-medium">UPI Payment</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-cyan-500/30 cursor-pointer hover:bg-cyan-500/10 transition">
                      <RadioGroupItem value="card" id="card" />
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-medium">Credit/Debit Card</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-cyan-500/30 cursor-pointer hover:bg-cyan-500/10 transition">
                      <RadioGroupItem value="cod" id="cod" />
                      <Truck className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-medium">Cash on Delivery (+₹50)</span>
                    </label>
                  </div>
                </RadioGroup>
              </Card>

              {/* Payment Form */}
              {paymentMethod === 'upi' && (
                <Card className="glass-card border-cyan-500/20 p-4">
                  <h3 className="text-white font-bold mb-3">Enter UPI Details</h3>
                  <div>
                    <Label className="text-slate-300">UPI ID</Label>
                    <Input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                    />
                  </div>
                </Card>
              )}

              {paymentMethod === 'card' && (
                <Card className="glass-card border-cyan-500/20 p-4">
                  <h3 className="text-white font-bold mb-3">Enter Card Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Card Number</Label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Cardholder Name</Label>
                      <Input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name on card"
                        className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Expiry Date</Label>
                        <Input
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">CVV</Label>
                        <Input
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          maxLength={3}
                          type="password"
                          className="bg-slate-800/50 border-cyan-500/30 text-white mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {paymentMethod === 'cod' && (
                <Card className="glass-card border-cyan-500/20 p-4">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Truck className="w-6 h-6 text-cyan-400" />
                    <div>
                      <p className="text-white font-semibold">Cash on Delivery</p>
                      <p className="text-sm">Pay ₹{total} when your order is delivered</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Lock className="w-4 h-4" />
                <span>Secure payment powered by 256-bit SSL encryption</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold py-6"
              >
                {isProcessing ? (
                  <>Processing Payment...</>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Pay ₹{total}
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {paymentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37] to-[#b8941f] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#d4af37]/30">
                <CheckCircle2 className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Design Submitted Successfully!</h3>
              <p className="text-slate-400 mb-4">Your design is now pending admin approval</p>
              <div className="glass-card border-[#d4af37]/20 p-4 max-w-sm mx-auto">
                <p className="text-slate-300 text-sm">You'll be notified once admin reviews and approves your design. Check the Studio tab to track status.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}