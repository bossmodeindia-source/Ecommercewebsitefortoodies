import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { FileText, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Order } from '../types';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  initialInvoiceData?: any;
  onSave: (invoiceData: any) => void;
  onDownload?: (invoiceData: any) => void;
}

export function InvoiceEditor({
  isOpen,
  onClose,
  order,
  initialInvoiceData,
  onSave,
  onDownload
}: InvoiceEditorProps) {
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoiceData?.items || order.items.map(item => ({
      description: item.productName || `Product ${item.productId}`,
      quantity: item.quantity,
      rate: item.price,
      amount: item.quantity * item.price
    }))
  );
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceData?.invoiceNumber || `INV-${order.id.slice(-8).toUpperCase()}`);
  const [invoiceDate, setInvoiceDate] = useState(initialInvoiceData?.invoiceDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialInvoiceData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialInvoiceData?.notes || 'Thank you for your business!');
  const [termsAndConditions, setTermsAndConditions] = useState(initialInvoiceData?.termsAndConditions || '1. Goods once sold cannot be returned.\n2. Custom designed items are non-refundable.');
  const [taxRate, setTaxRate] = useState(initialInvoiceData?.taxRate || 18); // GST 18%
  const [shippingCharge, setShippingCharge] = useState(initialInvoiceData?.shippingCharge || 0);
  const [discount, setDiscount] = useState(initialInvoiceData?.discount || order.discount || 0);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + shippingCharge - discount;
  };

  const handleSave = () => {
    if (!invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      toast.error('Please fill in all item descriptions');
      return;
    }

    const invoiceData = {
      orderId: order.id,
      invoiceNumber,
      invoiceDate,
      dueDate,
      items,
      subtotal: calculateSubtotal(),
      taxRate,
      taxAmount: calculateTax(),
      shippingCharge,
      discount,
      total: calculateTotal(),
      notes,
      termsAndConditions,
      updatedAt: new Date().toISOString()
    };

    onSave(invoiceData);
    toast.success('Invoice saved successfully!');
    onClose();
  };

  const handleDownload = () => {
    if (!invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      toast.error('Please fill in all item descriptions');
      return;
    }

    const invoiceData = {
      orderId: order.id,
      invoiceNumber,
      invoiceDate,
      dueDate,
      items,
      subtotal: calculateSubtotal(),
      taxRate,
      taxAmount: calculateTax(),
      shippingCharge,
      discount,
      total: calculateTotal(),
      notes,
      termsAndConditions,
      updatedAt: new Date().toISOString()
    };

    onDownload?.(invoiceData);
    toast.success('Invoice downloaded successfully!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-cyan-500/30 max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-cyan-100 text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Edit Invoice - {invoiceNumber}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Modify invoice details including dates, items, and customer information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-cyan-300">Invoice Number *</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/30 text-white"
              />
            </div>
            <div>
              <Label className="text-cyan-300">Invoice Date *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/30 text-white"
              />
            </div>
            <div>
              <Label className="text-cyan-300">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/30 text-white"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <Card className="glass-card border-cyan-500/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-cyan-100">Invoice Items</h3>
                <Button onClick={addItem} size="sm" className="bg-cyan-500">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start bg-slate-800/30 p-3 rounded-lg">
                    <div className="col-span-5">
                      <Label className="text-xs text-slate-400">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Product/Service description"
                        className="bg-slate-900/50 border-cyan-500/20 text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-slate-400">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="bg-slate-900/50 border-cyan-500/20 text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-slate-400">Rate (₹)</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="bg-slate-900/50 border-cyan-500/20 text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-slate-400">Amount (₹)</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        disabled
                        className="bg-slate-900/50 border-cyan-500/20 text-white text-sm font-bold"
                      />
                    </div>
                    <div className="col-span-1 pt-5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calculations */}
          <Card className="glass-card border-cyan-500/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-lg font-bold text-cyan-100 mb-3">Calculations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-cyan-300">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-cyan-300">Shipping Charge (₹)</Label>
                  <Input
                    type="number"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-cyan-300">Discount (₹)</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-2 mt-4">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-mono">₹{calculateTax().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Shipping:</span>
                  <span className="font-mono">₹{shippingCharge.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-cyan-500/30 pt-2 flex justify-between text-xl font-bold text-cyan-100">
                  <span>Total:</span>
                  <span className="font-mono">₹{calculateTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-cyan-300">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the customer..."
                className="bg-slate-800/50 border-cyan-500/30 text-white h-24"
              />
            </div>
            <div>
              <Label className="text-cyan-300">Terms & Conditions</Label>
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Terms and conditions..."
                className="bg-slate-800/50 border-cyan-500/30 text-white h-24"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 border-slate-700 text-slate-300">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Invoice
            </Button>
            {onDownload && (
              <Button onClick={handleDownload} className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
                <Save className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}