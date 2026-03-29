import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Coupon } from '../types';
import { storageUtils } from '../utils/storage';

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: undefined,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: undefined,
    isActive: true,
    applicableCategories: [],
    applicableProducts: []
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = () => {
    const stored = storageUtils.getCoupons();
    setCoupons(stored);
  };

  const handleSaveCoupon = () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    const newCoupon: Coupon = {
      id: editingCoupon?.id || Date.now().toString(),
      ...formData,
      code: formData.code.toUpperCase(),
      usedCount: editingCoupon?.usedCount || 0,
      createdAt: editingCoupon?.createdAt || new Date().toISOString()
    };

    if (editingCoupon) {
      storageUtils.updateCoupon(newCoupon);
      toast.success('Coupon updated successfully!');
    } else {
      storageUtils.addCoupon(newCoupon);
      toast.success('Coupon created successfully!');
    }

    loadCoupons();
    resetForm();
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      storageUtils.deleteCoupon(id);
      loadCoupons();
      toast.success('Coupon deleted');
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
      applicableCategories: coupon.applicableCategories || [],
      applicableProducts: coupon.applicableProducts || []
    });
    setIsAddingCoupon(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: undefined,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: undefined,
      isActive: true,
      applicableCategories: [],
      applicableProducts: []
    });
    setIsAddingCoupon(false);
    setEditingCoupon(null);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const toggleCouponStatus = (coupon: Coupon) => {
    const updated = { ...coupon, isActive: !coupon.isActive };
    storageUtils.updateCoupon(updated);
    loadCoupons();
    toast.success(`Coupon ${updated.isActive ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">Coupon Management</h2>
          <p className="text-slate-400 text-sm">
            Create and manage discount coupons for customers
          </p>
        </div>
        <Button
          onClick={() => setIsAddingCoupon(true)}
          className="bg-gradient-to-r from-gold-500 to-amber-500 text-black font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {coupons.map(coupon => {
            const now = new Date();
            const validFrom = new Date(coupon.validFrom);
            const validUntil = new Date(coupon.validUntil);
            const isExpired = now > validUntil;
            const isUpcoming = now < validFrom;
            const usagePercent = coupon.usageLimit ? (coupon.usedCount / coupon.usageLimit) * 100 : 0;

            return (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className={`glass-card border ${
                  !coupon.isActive ? 'border-slate-700 opacity-60' :
                  isExpired ? 'border-red-500/30' :
                  isUpcoming ? 'border-yellow-500/30' :
                  'border-gold-500/30'
                }`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-gold-400" />
                          <h3 className="text-lg font-bold text-gold-100">{coupon.code}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCouponCode(coupon.code)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-slate-300">{coupon.description}</p>
                      </div>
                    </div>

                    <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gold-100">
                        {coupon.discountType === 'percentage' ? (
                          <>
                            <Percent className="w-5 h-5 text-gold-400" />
                            <span className="text-2xl font-bold">{coupon.discountValue}%</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5 text-gold-400" />
                            <span className="text-2xl font-bold">₹{coupon.discountValue}</span>
                          </>
                        )}
                        <span className="text-sm">OFF</span>
                      </div>
                      {coupon.maxDiscountAmount && (
                        <p className="text-xs text-gold-300 mt-1">
                          Max: ₹{coupon.maxDiscountAmount}
                        </p>
                      )}
                      {coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0 && (
                        <p className="text-xs text-gold-300">
                          Min Purchase: ₹{coupon.minPurchaseAmount}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${
                        coupon.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {coupon.isActive ? '✓ Active' : '✕ Inactive'}
                      </Badge>
                      
                      {isExpired && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          Expired
                        </Badge>
                      )}
                      
                      {isUpcoming && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Upcoming
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Valid: {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {coupon.usageLimit && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Usage</span>
                          <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${
                              usagePercent >= 90 ? 'bg-red-500' :
                              usagePercent >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleCouponStatus(coupon)}
                        className={`flex-1 ${
                          coupon.isActive ? 'text-red-400 hover:bg-red-500/10' :
                          'text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {coupon.isActive ? <X className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCoupon(coupon)}
                        className="text-cyan-400"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {coupons.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <Tag className="w-16 h-16 text-gold-500/30 mx-auto mb-4" />
            <p className="text-slate-400">No coupons created yet</p>
            <p className="text-slate-500 text-sm mt-2">Click "Create Coupon" to get started</p>
          </div>
        )}
      </div>

      <Dialog open={isAddingCoupon} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="glass-card border-gold-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold-100 text-xl flex items-center gap-2">
              <Tag className="w-5 h-5 text-gold-400" />
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingCoupon ? 'Modify the existing coupon details' : 'Configure a new discount code for your store'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gold-300">Coupon Code *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER50"
                  className="bg-slate-800/50 border-gold-500/30 text-white uppercase flex-1"
                />
                <Button onClick={generateRandomCode} className="bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-gold-300">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the offer..."
                className="bg-slate-800/50 border-gold-500/30 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gold-300">Discount Type *</Label>
                <Select 
                  value={formData.discountType} 
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-gold-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gold-300">Discount Value *</Label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                  className="bg-slate-800/50 border-gold-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gold-300">Min Purchase Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.minPurchaseAmount || ''}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-slate-800/50 border-gold-500/30 text-white"
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <Label className="text-gold-300">Max Discount Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || undefined })}
                    placeholder="Optional"
                    className="bg-slate-800/50 border-gold-500/30 text-white"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gold-300">Valid From *</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="bg-slate-800/50 border-gold-500/30 text-white"
                />
              </div>

              <div>
                <Label className="text-gold-300">Valid Until *</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="bg-slate-800/50 border-gold-500/30 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-gold-300">Usage Limit</Label>
              <Input
                type="number"
                value={formData.usageLimit || ''}
                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || undefined })}
                placeholder="Unlimited"
                className="bg-slate-800/50 border-gold-500/30 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty for unlimited uses</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gold-500/30"
              />
              <Label htmlFor="isActive" className="text-gold-300">Activate coupon immediately</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={resetForm} variant="outline" className="flex-1 border-slate-600 text-slate-400">
                Cancel
              </Button>
              <Button onClick={handleSaveCoupon} className="flex-1 bg-gradient-to-r from-gold-500 to-amber-500 text-black font-bold">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
