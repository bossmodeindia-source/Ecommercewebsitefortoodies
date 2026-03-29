import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Smartphone, Save, CheckCircle, AlertCircle, ExternalLink, Shield, Key, Clock, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Switch } from './ui/switch';

/**
 * Supabase Phone Authentication Settings
 * 
 * Supabase provides built-in phone authentication with SMS OTP.
 * No need for external SMS APIs like Twilio, MSG91, etc.
 * 
 * Features:
 * - SMS OTP verification
 * - WhatsApp OTP (coming soon)
 * - International phone numbers
 * - Rate limiting
 * - Auto-verification
 */

interface SupabasePhoneAuthConfig {
  enabled: boolean;
  otpLength: number;
  otpExpiry: number; // in seconds
  autoVerify: boolean;
  allowedCountries: string[]; // ISO country codes
  rateLimit: number; // OTPs per hour
}

export function SupabasePhoneAuthSettings() {
  const [config, setConfig] = useState<SupabasePhoneAuthConfig>({
    enabled: true,
    otpLength: 6,
    otpExpiry: 600, // 10 minutes
    autoVerify: false,
    allowedCountries: ['IN', 'US', 'GB', 'CA', 'AU'],
    rateLimit: 5
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('supabase_phone_auth_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load phone auth settings:', error);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('supabase_phone_auth_config', JSON.stringify(config));
      toast.success('✅ Phone authentication settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const testPhoneAuth = async () => {
    toast.info('📱 Supabase Phone Auth is configured in your Supabase dashboard', {
      description: 'Visit Authentication > Providers > Phone to configure SMS provider'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-400" />
            </div>
            Supabase Phone Authentication
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Built-in SMS OTP verification powered by Supabase
          </p>
        </div>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Native Integration
        </Badge>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-bold text-blue-300">Supabase Built-in Phone Auth</p>
            <p className="text-xs text-blue-200/80">
              Supabase provides phone authentication out of the box. Configure your SMS provider 
              (Twilio, MessageBird, Vonage, or Textlocal) in your Supabase dashboard.
            </p>
            <Button
              onClick={() => window.open('https://supabase.com/docs/guides/auth/phone-login', '_blank')}
              size="sm"
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mt-2"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              View Supabase Docs
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Configuration */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-green-400" />
            OTP Configuration
          </CardTitle>
          <CardDescription>
            Configure OTP behavior for phone verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Phone Auth */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <Label className="text-white font-bold">Enable Phone Authentication</Label>
              <p className="text-xs text-slate-400 mt-1">
                Allow users to sign in with phone number + OTP
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          {/* OTP Length */}
          <div className="space-y-2">
            <Label className="text-[#d4af37] font-bold uppercase text-xs tracking-wider">
              OTP Length
            </Label>
            <Input
              type="number"
              min={4}
              max={8}
              value={config.otpLength}
              onChange={(e) => setConfig({ ...config, otpLength: parseInt(e.target.value) || 6 })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="6"
            />
            <p className="text-xs text-slate-500">
              Standard: 6 digits (recommended)
            </p>
          </div>

          {/* OTP Expiry */}
          <div className="space-y-2">
            <Label className="text-[#d4af37] font-bold uppercase text-xs tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              OTP Expiry (seconds)
            </Label>
            <Input
              type="number"
              min={60}
              max={3600}
              value={config.otpExpiry}
              onChange={(e) => setConfig({ ...config, otpExpiry: parseInt(e.target.value) || 600 })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="600"
            />
            <p className="text-xs text-slate-500">
              Default: 600 seconds (10 minutes)
            </p>
          </div>

          {/* Auto Verify */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <Label className="text-white font-bold">Auto-Verify on Android</Label>
              <p className="text-xs text-slate-400 mt-1">
                Automatically read SMS code on Android devices
              </p>
            </div>
            <Switch
              checked={config.autoVerify}
              onCheckedChange={(checked) => setConfig({ ...config, autoVerify: checked })}
            />
          </div>

          {/* Rate Limit */}
          <div className="space-y-2">
            <Label className="text-[#d4af37] font-bold uppercase text-xs tracking-wider">
              Rate Limit (OTPs per hour)
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={config.rateLimit}
              onChange={(e) => setConfig({ ...config, rateLimit: parseInt(e.target.value) || 5 })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="5"
            />
            <p className="text-xs text-slate-500">
              Prevents spam and abuse (recommended: 5)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supabase Dashboard Setup */}
      <Card className="glass-card border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-yellow-400" />
            Supabase Dashboard Setup Required
          </CardTitle>
          <CardDescription>
            Configure SMS provider in your Supabase project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-sm font-bold text-yellow-300">Setup Steps:</p>
                <ol className="text-xs text-yellow-200/80 space-y-2 list-decimal list-inside">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to <span className="font-mono bg-black/30 px-1 rounded">Authentication → Providers → Phone</span></li>
                  <li>Choose SMS provider: Twilio, MessageBird, Vonage, or Textlocal</li>
                  <li>Enter your provider credentials (API keys, sender ID, etc.)</li>
                  <li>Enable phone authentication</li>
                  <li>Test with a phone number</li>
                </ol>
                <div className="pt-2">
                  <Button
                    onClick={() => window.open('https://app.supabase.com', '_blank')}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Providers */}
          <div className="space-y-3">
            <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Supported SMS Providers
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Twilio', recommended: true },
                { name: 'MessageBird', recommended: false },
                { name: 'Vonage (Nexmo)', recommended: false },
                { name: 'Textlocal', recommended: false }
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg text-center"
                >
                  <p className="text-sm text-white font-bold">{provider.name}</p>
                  {provider.recommended && (
                    <Badge className="mt-1 bg-green-500/10 text-green-400 border-green-500/30 text-[9px]">
                      Recommended
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
        <Button
          onClick={testPhoneAuth}
          variant="outline"
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Setup Guide
        </Button>
      </div>

      {/* Info Footer */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-xs text-slate-400">
          <strong className="text-white">Note:</strong> Phone authentication is managed entirely by Supabase. 
          You don't need to write any backend code or manage SMS APIs directly. Supabase handles OTP generation, 
          delivery, verification, and security automatically.
        </p>
      </div>
    </div>
  );
}
