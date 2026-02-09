import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings, Phone, Mail, Save, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';

export function AdminSettings() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [gmail, setGmail] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = storageUtils.getAdminSettings();
    setWhatsappNumber(settings.whatsappNumber || '');
    setGmail(settings.gmail || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!whatsappNumber && !gmail) {
      toast.error('Please provide at least one contact method');
      return;
    }

    storageUtils.saveAdminSettings(whatsappNumber, gmail);
    setIsSaved(true);
    toast.success('Settings saved successfully!');
    
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-3 rounded-xl glow-border">
          <Settings className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-cyan-100">Notification Settings</h2>
          <p className="text-slate-400">Configure your contact information for customer notifications</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-card border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-100">Contact Information</CardTitle>
            <CardDescription className="text-slate-400">
              These details will be included in customer order notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-cyan-100 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-teal-400" />
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+1234567890"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                />
                <p className="text-xs text-slate-500">
                  Customers will see this number for support. Include country code (e.g., +91 for India)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gmail" className="text-cyan-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  Gmail Address
                </Label>
                <Input
                  id="gmail"
                  type="email"
                  placeholder="support@toodies.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                />
                <p className="text-xs text-slate-500">
                  Email address that will appear as the sender for customer notifications
                </p>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-cyan-100 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  How it works
                </h4>
                <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                  <li>When customers place orders, they'll receive notifications via WhatsApp and Email</li>
                  <li>Your contact info will be included so customers can reach you for support</li>
                  <li>When you add tracking info, customers get automatic updates</li>
                  <li>All notifications are logged in the browser console (for demo)</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0"
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Card */}
      {(whatsappNumber || gmail) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="glass-card border-teal-500/20">
            <CardHeader>
              <CardTitle className="text-teal-100">Preview - Customer View</CardTitle>
              <CardDescription className="text-slate-400">
                How your contact info will appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#0f172a]/30 rounded-xl p-6 border border-teal-500/20">
                <h4 className="text-sm font-semibold text-teal-100 mb-3">Need Help?</h4>
                <div className="space-y-2">
                  {gmail && (
                    <div className="flex items-center gap-2 text-cyan-100">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm">Email: {gmail}</span>
                    </div>
                  )}
                  {whatsappNumber && (
                    <div className="flex items-center gap-2 text-teal-100">
                      <Phone className="w-4 h-4 text-teal-400" />
                      <span className="text-sm">WhatsApp: {whatsappNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
