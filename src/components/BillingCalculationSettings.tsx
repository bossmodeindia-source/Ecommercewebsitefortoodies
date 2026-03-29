import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Calculator, IndianRupee, Save, RefreshCw, Percent, TrendingUp, Package, Truck, Receipt } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BillingSettings {
  // Product Cost Settings
  includeProductCost: boolean;
  
  // Printing Cost Calculation
  includePrintingCost: boolean;
  printingCostMethod: 'per-square-inch' | 'flat-rate' | 'per-design' | 'custom';
  
  // Tax Settings
  enableTax: boolean;
  taxType: 'GST' | 'VAT' | 'Sales Tax' | 'Custom';
  taxPercentage: number;
  taxOnPrintingCost: boolean; // Apply tax on printing cost
  taxOnShipping: boolean; // Apply tax on shipping
  
  // Shipping Calculation
  includeShipping: boolean;
  shippingMethod: 'flat-rate' | 'weight-based' | 'distance-based' | 'free' | 'custom';
  flatShippingRate: number;
  freeShippingThreshold: number; // Free shipping above this amount
  
  // Discount & Coupon Application
  applyDiscountBeforeTax: boolean; // true = discount before tax, false = discount after tax
  
  // Rounding Settings
  enableRounding: boolean;
  roundingMethod: 'nearest' | 'up' | 'down';
  roundToNearest: number; // Round to nearest 1, 5, 10, etc.
  
  // Additional Charges
  enablePackagingCharge: boolean;
  packagingCharge: number;
  
  enableHandlingCharge: boolean;
  handlingCharge: number;
  
  // Rush Order Settings
  enableRushOrderCharge: boolean;
  rushOrderPercentage: number; // Additional % for rush orders
  
  // Calculation Order
  calculationOrder: string[]; // Order of operations for bill calculation
  
  // Display Settings
  showBreakdown: boolean; // Show detailed breakdown to customers
  showTaxSeparately: boolean; // Show tax as separate line item
}

const defaultSettings: BillingSettings = {
  includeProductCost: true,
  includePrintingCost: true,
  printingCostMethod: 'per-square-inch',
  enableTax: true,
  taxType: 'GST',
  taxPercentage: 18,
  taxOnPrintingCost: true,
  taxOnShipping: false,
  includeShipping: true,
  shippingMethod: 'flat-rate',
  flatShippingRate: 100,
  freeShippingThreshold: 1500,
  applyDiscountBeforeTax: true,
  enableRounding: true,
  roundingMethod: 'nearest',
  roundToNearest: 1,
  enablePackagingCharge: false,
  packagingCharge: 0,
  enableHandlingCharge: false,
  handlingCharge: 0,
  enableRushOrderCharge: false,
  rushOrderPercentage: 25,
  calculationOrder: [
    'Product Cost',
    'Printing Cost',
    'Subtotal',
    'Discount/Coupon',
    'Packaging Charge',
    'Handling Charge',
    'Rush Order Charge',
    'Tax',
    'Shipping',
    'Final Total'
  ],
  showBreakdown: true,
  showTaxSeparately: true,
};

export function BillingCalculationSettings() {
  const [settings, setSettings] = useState<BillingSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const stored = localStorage.getItem('billingCalculationSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('billingCalculationSettings', JSON.stringify(settings));
    toast.success('Billing calculation settings saved successfully!');
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all billing settings to defaults?')) {
      setSettings(defaultSettings);
      localStorage.setItem('billingCalculationSettings', JSON.stringify(defaultSettings));
      toast.success('Settings reset to defaults!');
      setHasChanges(false);
    }
  };

  const updateSetting = (key: keyof BillingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Sample Calculation Preview
  const calculateSampleBill = () => {
    const productCost = 500;
    const printingCost = 150;
    const discount = 50;
    
    let subtotal = 0;
    if (settings.includeProductCost) subtotal += productCost;
    if (settings.includePrintingCost) subtotal += printingCost;
    
    let total = subtotal;
    
    // Apply discount
    if (settings.applyDiscountBeforeTax) {
      total -= discount;
    }
    
    // Add packaging
    if (settings.enablePackagingCharge) total += settings.packagingCharge;
    
    // Add handling
    if (settings.enableHandlingCharge) total += settings.handlingCharge;
    
    // Calculate tax
    let tax = 0;
    if (settings.enableTax) {
      let taxableAmount = total;
      if (!settings.taxOnPrintingCost && settings.includePrintingCost) {
        taxableAmount -= printingCost;
      }
      tax = (taxableAmount * settings.taxPercentage) / 100;
      total += tax;
    }
    
    // Apply discount after tax
    if (!settings.applyDiscountBeforeTax) {
      total -= discount;
    }
    
    // Add shipping
    let shipping = 0;
    if (settings.includeShipping) {
      if (settings.shippingMethod === 'flat-rate') {
        shipping = total >= settings.freeShippingThreshold ? 0 : settings.flatShippingRate;
      } else if (settings.shippingMethod === 'free') {
        shipping = 0;
      }
      
      if (settings.taxOnShipping && settings.enableTax) {
        const shippingTax = (shipping * settings.taxPercentage) / 100;
        tax += shippingTax;
        total += shipping + shippingTax;
      } else {
        total += shipping;
      }
    }
    
    // Apply rounding
    if (settings.enableRounding) {
      if (settings.roundingMethod === 'nearest') {
        total = Math.round(total / settings.roundToNearest) * settings.roundToNearest;
      } else if (settings.roundingMethod === 'up') {
        total = Math.ceil(total / settings.roundToNearest) * settings.roundToNearest;
      } else if (settings.roundingMethod === 'down') {
        total = Math.floor(total / settings.roundToNearest) * settings.roundToNearest;
      }
    }
    
    return { productCost, printingCost, subtotal, discount, tax, shipping, total };
  };

  const sample = calculateSampleBill();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-3 rounded-xl glow-border">
            <Calculator className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cyan-100">Billing Calculation Settings</h2>
            <p className="text-slate-400">Configure how customer bills are calculated</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white glow-button border-0"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4"
        >
          <p className="text-sm text-orange-200">
            ⚠️ You have unsaved changes. Click "Save Settings" to apply them.
          </p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Product & Printing Cost */}
          <Card className="glass-card border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-100 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Cost Components
              </CardTitle>
              <CardDescription className="text-slate-400">
                Select which costs to include in the bill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div>
                  <Label className="text-cyan-100">Include Product Cost</Label>
                  <p className="text-xs text-slate-400 mt-1">Base product price (T-shirt, Hoodie, etc.)</p>
                </div>
                <Switch
                  checked={settings.includeProductCost}
                  onCheckedChange={(checked) => updateSetting('includeProductCost', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div>
                  <Label className="text-purple-100">Include Printing Cost</Label>
                  <p className="text-xs text-slate-400 mt-1">Custom design printing charges</p>
                </div>
                <Switch
                  checked={settings.includePrintingCost}
                  onCheckedChange={(checked) => updateSetting('includePrintingCost', checked)}
                />
              </div>

              {settings.includePrintingCost && (
                <div className="space-y-2">
                  <Label className="text-cyan-100">Printing Cost Calculation Method</Label>
                  <Select
                    value={settings.printingCostMethod}
                    onValueChange={(value: any) => updateSetting('printingCostMethod', value)}
                  >
                    <SelectTrigger className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per-square-inch">Per Square Inch (Area-based)</SelectItem>
                      <SelectItem value="flat-rate">Flat Rate Per Design</SelectItem>
                      <SelectItem value="per-design">Per Design Count</SelectItem>
                      <SelectItem value="custom">Custom Calculation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Settings */}
          <Card className="glass-card border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-100 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Tax Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure tax calculation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div>
                  <Label className="text-green-100">Enable Tax</Label>
                  <p className="text-xs text-slate-400 mt-1">Apply tax to orders</p>
                </div>
                <Switch
                  checked={settings.enableTax}
                  onCheckedChange={(checked) => updateSetting('enableTax', checked)}
                />
              </div>

              {settings.enableTax && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-100">Tax Type</Label>
                      <Select
                        value={settings.taxType}
                        onValueChange={(value: any) => updateSetting('taxType', value)}
                      >
                        <SelectTrigger className="bg-[#0f172a]/50 border-green-500/30 text-green-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GST">GST (India)</SelectItem>
                          <SelectItem value="VAT">VAT</SelectItem>
                          <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                          <SelectItem value="Custom">Custom Tax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-green-100 flex items-center gap-2">
                        <Percent className="w-3 h-3" />
                        Tax Percentage
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="18"
                        value={settings.taxPercentage}
                        onChange={(e) => updateSetting('taxPercentage', parseFloat(e.target.value) || 0)}
                        className="bg-[#0f172a]/50 border-green-500/30 text-green-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <Label className="text-green-100 text-sm">Apply Tax on Printing Cost</Label>
                      <Switch
                        checked={settings.taxOnPrintingCost}
                        onCheckedChange={(checked) => updateSetting('taxOnPrintingCost', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <Label className="text-green-100 text-sm">Apply Tax on Shipping</Label>
                      <Switch
                        checked={settings.taxOnShipping}
                        onCheckedChange={(checked) => updateSetting('taxOnShipping', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <Label className="text-green-100 text-sm">Show Tax Separately</Label>
                      <Switch
                        checked={settings.showTaxSeparately}
                        onCheckedChange={(checked) => updateSetting('showTaxSeparately', checked)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping Settings */}
          <Card className="glass-card border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-blue-100 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure shipping charges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div>
                  <Label className="text-blue-100">Include Shipping</Label>
                  <p className="text-xs text-slate-400 mt-1">Add shipping charges to bill</p>
                </div>
                <Switch
                  checked={settings.includeShipping}
                  onCheckedChange={(checked) => updateSetting('includeShipping', checked)}
                />
              </div>

              {settings.includeShipping && (
                <>
                  <div className="space-y-2">
                    <Label className="text-blue-100">Shipping Calculation Method</Label>
                    <Select
                      value={settings.shippingMethod}
                      onValueChange={(value: any) => updateSetting('shippingMethod', value)}
                    >
                      <SelectTrigger className="bg-[#0f172a]/50 border-blue-500/30 text-blue-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat-rate">Flat Rate</SelectItem>
                        <SelectItem value="weight-based">Weight-Based</SelectItem>
                        <SelectItem value="distance-based">Distance-Based</SelectItem>
                        <SelectItem value="free">Free Shipping</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.shippingMethod === 'flat-rate' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-blue-100 flex items-center gap-2">
                          <IndianRupee className="w-3 h-3" />
                          Flat Shipping Rate
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="100"
                          value={settings.flatShippingRate}
                          onChange={(e) => updateSetting('flatShippingRate', parseFloat(e.target.value) || 0)}
                          className="bg-[#0f172a]/50 border-blue-500/30 text-blue-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-blue-100 flex items-center gap-2">
                          <IndianRupee className="w-3 h-3" />
                          Free Shipping Above
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="1500"
                          value={settings.freeShippingThreshold}
                          onChange={(e) => updateSetting('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                          className="bg-[#0f172a]/50 border-blue-500/30 text-blue-100"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Charges */}
          <Card className="glass-card border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-orange-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Additional Charges
              </CardTitle>
              <CardDescription className="text-slate-400">
                Extra fees and charges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Packaging Charge */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <div>
                    <Label className="text-orange-100">Packaging Charge</Label>
                    <p className="text-xs text-slate-400 mt-1">Add packaging/gift wrap charges</p>
                  </div>
                  <Switch
                    checked={settings.enablePackagingCharge}
                    onCheckedChange={(checked) => updateSetting('enablePackagingCharge', checked)}
                  />
                </div>

                {settings.enablePackagingCharge && (
                  <Input
                    type="number"
                    step="1"
                    placeholder="50"
                    value={settings.packagingCharge}
                    onChange={(e) => updateSetting('packagingCharge', parseFloat(e.target.value) || 0)}
                    className="bg-[#0f172a]/50 border-orange-500/30 text-orange-100"
                  />
                )}
              </div>

              {/* Handling Charge */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <div>
                    <Label className="text-orange-100">Handling Charge</Label>
                    <p className="text-xs text-slate-400 mt-1">Processing and handling fees</p>
                  </div>
                  <Switch
                    checked={settings.enableHandlingCharge}
                    onCheckedChange={(checked) => updateSetting('enableHandlingCharge', checked)}
                  />
                </div>

                {settings.enableHandlingCharge && (
                  <Input
                    type="number"
                    step="1"
                    placeholder="30"
                    value={settings.handlingCharge}
                    onChange={(e) => updateSetting('handlingCharge', parseFloat(e.target.value) || 0)}
                    className="bg-[#0f172a]/50 border-orange-500/30 text-orange-100"
                  />
                )}
              </div>

              {/* Rush Order */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <div>
                    <Label className="text-orange-100">Rush Order Charge</Label>
                    <p className="text-xs text-slate-400 mt-1">Extra charge for expedited orders</p>
                  </div>
                  <Switch
                    checked={settings.enableRushOrderCharge}
                    onCheckedChange={(checked) => updateSetting('enableRushOrderCharge', checked)}
                  />
                </div>

                {settings.enableRushOrderCharge && (
                  <div className="space-y-2">
                    <Label className="text-orange-100 flex items-center gap-2">
                      <Percent className="w-3 h-3" />
                      Rush Order Percentage
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      placeholder="25"
                      value={settings.rushOrderPercentage}
                      onChange={(e) => updateSetting('rushOrderPercentage', parseFloat(e.target.value) || 0)}
                      className="bg-[#0f172a]/50 border-orange-500/30 text-orange-100"
                    />
                    <p className="text-xs text-slate-400">Additional % charge on subtotal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discount & Rounding */}
          <Card className="glass-card border-pink-500/30">
            <CardHeader>
              <CardTitle className="text-pink-100 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Discount & Rounding
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure discount application and rounding rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <div>
                  <Label className="text-pink-100">Apply Discount Before Tax</Label>
                  <p className="text-xs text-slate-400 mt-1">
                    {settings.applyDiscountBeforeTax 
                      ? 'Discount → Tax → Final Total' 
                      : 'Tax → Discount → Final Total'}
                  </p>
                </div>
                <Switch
                  checked={settings.applyDiscountBeforeTax}
                  onCheckedChange={(checked) => updateSetting('applyDiscountBeforeTax', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <div>
                  <Label className="text-pink-100">Enable Rounding</Label>
                  <p className="text-xs text-slate-400 mt-1">Round final total amount</p>
                </div>
                <Switch
                  checked={settings.enableRounding}
                  onCheckedChange={(checked) => updateSetting('enableRounding', checked)}
                />
              </div>

              {settings.enableRounding && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-pink-100">Rounding Method</Label>
                    <Select
                      value={settings.roundingMethod}
                      onValueChange={(value: any) => updateSetting('roundingMethod', value)}
                    >
                      <SelectTrigger className="bg-[#0f172a]/50 border-pink-500/30 text-pink-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nearest">Round to Nearest</SelectItem>
                        <SelectItem value="up">Always Round Up</SelectItem>
                        <SelectItem value="down">Always Round Down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-pink-100">Round to Nearest</Label>
                    <Select
                      value={settings.roundToNearest.toString()}
                      onValueChange={(value) => updateSetting('roundToNearest', parseInt(value))}
                    >
                      <SelectTrigger className="bg-[#0f172a]/50 border-pink-500/30 text-pink-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">₹1</SelectItem>
                        <SelectItem value="5">₹5</SelectItem>
                        <SelectItem value="10">₹10</SelectItem>
                        <SelectItem value="50">₹50</SelectItem>
                        <SelectItem value="100">₹100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <div>
                  <Label className="text-pink-100">Show Detailed Breakdown</Label>
                  <p className="text-xs text-slate-400 mt-1">Display itemized bill to customers</p>
                </div>
                <Switch
                  checked={settings.showBreakdown}
                  onCheckedChange={(checked) => updateSetting('showBreakdown', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="glass-card border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Sample Calculation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Preview of how bills are calculated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4 border border-cyan-500/20 space-y-2 text-sm">
                  {settings.includeProductCost && (
                    <div className="flex justify-between text-slate-300">
                      <span>Product Cost:</span>
                      <span>₹{sample.productCost}</span>
                    </div>
                  )}
                  
                  {settings.includePrintingCost && (
                    <div className="flex justify-between text-slate-300">
                      <span>Printing Cost:</span>
                      <span>₹{sample.printingCost}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold text-cyan-200 pt-2 border-t border-cyan-500/20">
                    <span>Subtotal:</span>
                    <span>₹{sample.subtotal}</span>
                  </div>
                  
                  {settings.applyDiscountBeforeTax && (
                    <div className="flex justify-between text-green-300">
                      <span>Discount:</span>
                      <span>-₹{sample.discount}</span>
                    </div>
                  )}
                  
                  {settings.enablePackagingCharge && (
                    <div className="flex justify-between text-slate-300">
                      <span>Packaging:</span>
                      <span>₹{settings.packagingCharge}</span>
                    </div>
                  )}
                  
                  {settings.enableHandlingCharge && (
                    <div className="flex justify-between text-slate-300">
                      <span>Handling:</span>
                      <span>₹{settings.handlingCharge}</span>
                    </div>
                  )}
                  
                  {settings.enableTax && (
                    <div className="flex justify-between text-orange-300">
                      <span>{settings.taxType} ({settings.taxPercentage}%):</span>
                      <span>₹{sample.tax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {!settings.applyDiscountBeforeTax && (
                    <div className="flex justify-between text-green-300">
                      <span>Discount:</span>
                      <span>-₹{sample.discount}</span>
                    </div>
                  )}
                  
                  {settings.includeShipping && sample.shipping > 0 && (
                    <div className="flex justify-between text-blue-300">
                      <span>Shipping:</span>
                      <span>₹{sample.shipping}</span>
                    </div>
                  )}
                  
                  {settings.includeShipping && sample.shipping === 0 && settings.shippingMethod === 'flat-rate' && (
                    <div className="flex justify-between text-green-300">
                      <span>Shipping:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">FREE</Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-gold-200 pt-3 border-t border-gold-500/30 text-base">
                    <span>Final Total:</span>
                    <span>₹{sample.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-cyan-100 mb-2">Calculation Order</h4>
                  <ol className="text-xs text-slate-300 space-y-1">
                    {settings.calculationOrder.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-mono">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="text-xs text-slate-400 text-center pt-2">
                  <p>This is a sample calculation with dummy values</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
