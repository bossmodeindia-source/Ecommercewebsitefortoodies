import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Palette, Plus, Edit, Trash2, Save, X, Eye, Code, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';

interface PrintingMethod {
  id: string;
  name: string;
  description: string;
  technicalSpecs?: string; // Technical specifications or language code
  previewInstructions?: string; // Instructions for 3D designer preview
  costPerSquareInch: number; // Cost per square inch (₹/inch²)
  enableCostPerInch?: boolean; // Enable/disable cost per inch calculation
  minimumCharge?: number; // Minimum charge for very small designs
  enableMinimumCharge?: boolean; // Enable/disable minimum charge
  isActive: boolean;
  enabled?: boolean; // Enable/disable this method for customers
  showPrice?: boolean; // Show/hide price to customers
  createdAt: string;
}

export function PrintingMethodsManagement() {
  const [methods, setMethods] = useState<PrintingMethod[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    technicalSpecs: '',
    previewInstructions: '',
    costPerSquareInch: 0,
    enableCostPerInch: true,
    minimumCharge: 0,
    enableMinimumCharge: true,
    isActive: true,
    enabled: true,
    showPrice: true,
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = () => {
    const stored = localStorage.getItem('printingMethods');
    if (stored) {
      setMethods(JSON.parse(stored));
    } else {
      // Set default printing methods
      const defaultMethods: PrintingMethod[] = [
        {
          id: '1',
          name: 'Screen Printing',
          description: 'Traditional screen printing method, best for bulk orders with solid colors.',
          technicalSpecs: `{
  "technique": "Screen Printing",
  "minQuantity": 50,
  "maxColors": 6,
  "durability": "High",
  "washResistance": "Excellent",
  "bestFor": ["T-shirts", "Hoodies", "Sweatshirts"]
}`,
          previewInstructions: 'Apply solid color overlay with slight texture. Show matte finish effect.',
          costPerSquareInch: 4,
          enableCostPerInch: true,
          minimumCharge: 50,
          enableMinimumCharge: true,
          isActive: true,
          enabled: true,
          showPrice: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'DTG (Direct to Garment)',
          description: 'Digital printing directly onto fabric, perfect for detailed designs and small batches.',
          technicalSpecs: `{
  "technique": "DTG Printing",
  "minQuantity": 1,
  "maxColors": "Unlimited",
  "durability": "Medium-High",
  "washResistance": "Good",
  "bestFor": ["Complex designs", "Photo prints", "Small orders"]
}`,
          previewInstructions: 'Show photo-realistic print with soft hand feel. Display full color gradients.',
          costPerSquareInch: 8,
          enableCostPerInch: true,
          minimumCharge: 100,
          enableMinimumCharge: true,
          isActive: true,
          enabled: true,
          showPrice: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Vinyl/Heat Transfer',
          description: 'Vinyl material heat-pressed onto fabric, ideal for names, numbers, and simple graphics.',
          technicalSpecs: `{
  "technique": "Heat Transfer",
  "minQuantity": 1,
  "maxColors": "Limited",
  "durability": "High",
  "washResistance": "Very Good",
  "bestFor": ["Names", "Numbers", "Team jerseys"]
}`,
          previewInstructions: 'Apply glossy or matte vinyl effect with raised texture. Show crisp edges.',
          costPerSquareInch: 6,
          enableCostPerInch: true,
          minimumCharge: 75,
          enableMinimumCharge: true,
          isActive: true,
          enabled: true,
          showPrice: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Sublimation',
          description: 'Dye sublimation printing for all-over prints on polyester fabrics.',
          technicalSpecs: `{
  "technique": "Sublimation",
  "minQuantity": 1,
  "maxColors": "Unlimited",
  "durability": "Excellent",
  "washResistance": "Excellent",
  "bestFor": ["Polyester garments", "All-over prints", "Sports jerseys"],
  "fabricRequirement": "100% Polyester or Poly-blend"
}`,
          previewInstructions: 'Show vibrant, embedded color throughout fabric. Display seamless all-over design.',
          costPerSquareInch: 10,
          enableCostPerInch: true,
          minimumCharge: 150,
          enableMinimumCharge: true,
          isActive: true,
          enabled: true,
          showPrice: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'Embroidery',
          description: 'Stitched designs using thread, providing a premium textured look.',
          technicalSpecs: `{
  "technique": "Embroidery",
  "minQuantity": 10,
  "maxColors": 15,
  "durability": "Excellent",
  "washResistance": "Excellent",
  "bestFor": ["Logos", "Premium branding", "Small designs"],
  "stitchCount": "Up to 10000 stitches"
}`,
          previewInstructions: 'Show 3D raised thread effect with texture mapping. Display stitch patterns.',
          costPerSquareInch: 12,
          enableCostPerInch: true,
          minimumCharge: 200,
          enableMinimumCharge: true,
          isActive: true,
          enabled: true,
          showPrice: true,
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('printingMethods', JSON.stringify(defaultMethods));
      setMethods(defaultMethods);
    }
  };

  const saveMethods = (updatedMethods: PrintingMethod[]) => {
    localStorage.setItem('printingMethods', JSON.stringify(updatedMethods));
    setMethods(updatedMethods);
  };

  const handleAdd = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a printing method name');
      return;
    }

    const newMethod: PrintingMethod = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };

    const updatedMethods = [...methods, newMethod];
    saveMethods(updatedMethods);
    toast.success('Printing method added successfully!');
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId) return;

    const updatedMethods = methods.map(method =>
      method.id === editingId
        ? { ...method, ...formData }
        : method
    );

    saveMethods(updatedMethods);
    toast.success('Printing method updated successfully!');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this printing method?')) {
      const updatedMethods = methods.filter(method => method.id !== id);
      saveMethods(updatedMethods);
      toast.success('Printing method deleted successfully!');
    }
  };

  const handleEdit = (method: PrintingMethod) => {
    setFormData({
      name: method.name,
      description: method.description,
      technicalSpecs: method.technicalSpecs || '',
      previewInstructions: method.previewInstructions || '',
      costPerSquareInch: method.costPerSquareInch,
      enableCostPerInch: method.enableCostPerInch !== undefined ? method.enableCostPerInch : true,
      minimumCharge: method.minimumCharge || 0,
      enableMinimumCharge: method.enableMinimumCharge !== undefined ? method.enableMinimumCharge : true,
      isActive: method.isActive,
      enabled: method.enabled !== undefined ? method.enabled : true,
      showPrice: method.showPrice !== undefined ? method.showPrice : true,
    });
    setEditingId(method.id);
    setIsAdding(true);
  };

  const toggleActive = (id: string) => {
    const updatedMethods = methods.map(method =>
      method.id === id
        ? { ...method, isActive: !method.isActive }
        : method
    );
    saveMethods(updatedMethods);
    toast.success('Status updated!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      technicalSpecs: '',
      previewInstructions: '',
      costPerSquareInch: 0,
      enableCostPerInch: true,
      minimumCharge: 0,
      enableMinimumCharge: true,
      isActive: true,
      enabled: true,
      showPrice: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-xl glow-border">
            <Palette className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cyan-100">Printing Methods</h2>
            <p className="text-slate-400">Configure printing techniques for 3D designer preview</p>
          </div>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white glow-button border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-100 flex items-center justify-between">
                  {editingId ? 'Edit Printing Method' : 'Add New Printing Method'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Define printing method details and 3D preview instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-cyan-100">
                      Method Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Screen Printing"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPerSquareInch" className="text-cyan-100 flex items-center gap-2">
                      <IndianRupee className="w-3 h-3" />
                      Cost Per Square Inch (₹/inch²)
                    </Label>
                    <Input
                      id="costPerSquareInch"
                      type="number"
                      step="0.1"
                      placeholder="8"
                      value={formData.costPerSquareInch}
                      onChange={(e) => setFormData({ ...formData, costPerSquareInch: parseFloat(e.target.value) || 0 })}
                      className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                      disabled={!formData.enableCostPerInch}
                    />
                  </div>

                  {/* Minimum Charge Field */}
                  <div className="space-y-2">
                    <Label htmlFor="minimumCharge" className="text-cyan-100 flex items-center gap-2">
                      <IndianRupee className="w-3 h-3" />
                      Minimum Charge (₹) <span className="text-slate-400 text-xs ml-1">(optional)</span>
                    </Label>
                    <Input
                      id="minimumCharge"
                      type="number"
                      step="1"
                      placeholder="50"
                      value={formData.minimumCharge || ''}
                      onChange={(e) => setFormData({ ...formData, minimumCharge: parseFloat(e.target.value) || 0 })}
                      className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100"
                      disabled={!formData.enableMinimumCharge}
                    />
                    <p className="text-xs text-slate-400">Minimum cost for very small designs (leave 0 for no minimum)</p>
                  </div>
                </div>

                {/* Pricing Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div>
                      <Label className="text-blue-100 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Enable Cost Per Inch Calculation
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">Calculate printing cost based on design area (square inches)</p>
                    </div>
                    <Switch
                      checked={formData.enableCostPerInch}
                      onCheckedChange={(checked) => setFormData({ ...formData, enableCostPerInch: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div>
                      <Label className="text-orange-100 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Enable Minimum Charge
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">Apply minimum charge regardless of design size</p>
                    </div>
                    <Switch
                      checked={formData.enableMinimumCharge}
                      onCheckedChange={(checked) => setFormData({ ...formData, enableMinimumCharge: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-cyan-100">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description for customers..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technicalSpecs" className="text-cyan-100 flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    Technical Specs / JSON Configuration
                  </Label>
                  <Textarea
                    id="technicalSpecs"
                    placeholder='{"technique": "Screen Printing", "minQuantity": 50, "maxColors": 6}'
                    value={formData.technicalSpecs}
                    onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
                    className="bg-[#0f172a]/50 border-purple-500/30 text-purple-100 font-mono text-sm min-h-[120px]"
                  />
                  <p className="text-xs text-slate-500">
                    Add technical specifications in JSON format or any structured data
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewInstructions" className="text-cyan-100 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    3D Preview Instructions
                  </Label>
                  <Textarea
                    id="previewInstructions"
                    placeholder="Instructions for 3D designer to render this printing method effect..."
                    value={formData.previewInstructions}
                    onChange={(e) => setFormData({ ...formData, previewInstructions: e.target.value })}
                    className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 min-h-[100px]"
                  />
                  <p className="text-xs text-slate-500">
                    These instructions help the 3D designer show visual effects to customers
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <div>
                    <Label className="text-purple-100">Active Status</Label>
                    <p className="text-xs text-slate-400 mt-1">Make this method available for selection</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                {/* Customer Visibility Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                    <div>
                      <Label className="text-cyan-100 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Enable for Customers
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">Show this printing method to customers in designer</p>
                    </div>
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gold-500/10 border border-gold-500/30 rounded-xl">
                    <div>
                      <Label className="text-gold-100 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Show Price to Customers
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">Display cost details in the designer interface</p>
                    </div>
                    <Switch
                      checked={formData.showPrice}
                      onCheckedChange={(checked) => setFormData({ ...formData, showPrice: checked })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={editingId ? handleUpdate : handleAdd}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white glow-button border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update Method' : 'Add Method'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Methods List */}
      <div className="grid gap-4">
        {methods.length === 0 ? (
          <Card className="glass-card border-slate-600">
            <CardContent className="py-12 text-center">
              <Palette className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No printing methods configured yet</p>
              <Button
                onClick={() => setIsAdding(true)}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          methods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className={`glass-card ${method.isActive ? 'border-purple-500/30' : 'border-slate-600 opacity-60'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-purple-100">{method.name}</h3>
                        <Badge variant={method.isActive ? 'default' : 'secondary'} className={method.isActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : ''}>
                          {method.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {method.enabled !== false && (
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            <Eye className="w-3 h-3 mr-1" />
                            Visible to Customers
                          </Badge>
                        )}
                        {method.showPrice !== false && (
                          <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/30">
                            <IndianRupee className="w-3 h-3 mr-1" />
                            Price Shown
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{method.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          ₹{method.costPerSquareInch}/inch²
                        </span>
                        {method.minimumCharge > 0 && (
                          <>
                            <span>•</span>
                            <span>Min: ₹{method.minimumCharge}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Added {new Date(method.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={method.isActive}
                        onCheckedChange={() => toggleActive(method.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(method)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Technical Specs */}
                  {method.technicalSpecs && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        Technical Specifications
                      </h4>
                      <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20">
                        <pre className="text-xs text-purple-200 font-mono overflow-x-auto whitespace-pre-wrap">
                          {method.technicalSpecs}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Preview Instructions */}
                  {method.previewInstructions && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        3D Designer Preview Instructions
                      </h4>
                      <div className="bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/20">
                        <p className="text-xs text-cyan-200">{method.previewInstructions}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Info Card */}
      <Card className="glass-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-100 text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-cyan-100 mb-2">Integration with 3D Designer</h4>
            <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
              <li>All active printing methods are sent to the 3D designer when customers click "Customize"</li>
              <li>The 3D designer uses "Preview Instructions" to show visual effects of each method</li>
              <li>Technical specs are passed as JSON data for advanced customization</li>
              <li>Customers can select and compare different printing methods in real-time</li>
              <li>Cost per unit is automatically added to the final price calculation</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-purple-100 mb-2">URL Parameters Sent to 3D Designer</h4>
            <div className="text-xs text-slate-300 space-y-1 font-mono bg-black/30 p-3 rounded-lg">
              <div><span className="text-cyan-400">printingMethods:</span> JSON array of all active methods</div>
              <div><span className="text-cyan-400">methodSpecs:</span> Technical specifications for each method</div>
              <div><span className="text-cyan-400">previewRules:</span> Visual rendering instructions</div>
              <div><span className="text-cyan-400">pricing:</span> Cost data for price calculation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}