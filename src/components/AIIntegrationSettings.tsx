import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import {
  Sparkles, Wand2, Key, Settings, CheckCircle, AlertCircle, Zap, Image,
  Plus, Trash2, Save, Power, Eye, EyeOff, RefreshCw, ExternalLink, Copy,
  ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { aiConfigApi } from '../utils/supabaseApi';

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'text' | 'image' | 'both';
  isActive: boolean;
  apiKey: string;
  endpoint: string;
  model?: string;
  settings?: {
    maxTokens?: number;
    temperature?: number;
    imageSize?: string;
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    steps?: number;
    cfgScale?: number;
  };
}

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'paperspace-sd',
    name: 'Paperspace Stable Diffusion',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://YOUR_DEPLOYMENT_ID.gradient.paperspace.com/sdapi/v1/txt2img',
    model: 'stable-diffusion-xl-base-1.0',
    settings: { imageSize: '1024x1024', steps: 25, cfgScale: 7.5 }
  },
  {
    id: 'openai-dalle',
    name: 'OpenAI DALL·E 3',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'dall-e-3',
    settings: { imageSize: '1024x1024', quality: 'hd', style: 'vivid' }
  },
  {
    id: 'stability',
    name: 'Stability AI (SDXL)',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.stability.ai/v1',
    model: 'stable-diffusion-xl-1024-v1-0',
    settings: { imageSize: '1024x1024' }
  },
  {
    id: 'replicate',
    name: 'Replicate (Flux Schnell)',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.replicate.com/v1',
    model: 'black-forest-labs/flux-schnell',
    settings: { imageSize: '1024x1024' }
  },
  {
    id: 'kimi',
    name: 'Kimi 2.5 / Moonshot (Text)',
    type: 'text',
    isActive: true,
    apiKey: 'sk-50SOnqs2BB0WpDIUmHfEqejs4H0CA93u8NkTg8i4yTvre6in',
    endpoint: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    settings: { maxTokens: 1000, temperature: 0.7 }
  },
  {
    id: 'openai-gpt',
    name: 'OpenAI GPT-4 (Text)',
    type: 'text',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
    settings: { maxTokens: 1000, temperature: 0.7 }
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude (Text)',
    type: 'text',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    settings: { maxTokens: 1000, temperature: 0.7 }
  }
];

// ── Local edit row: each provider keeps its own unsaved draft ──
function ProviderRow({
  provider,
  onSave,
  onToggle,
  onDelete,
  isDefault,
}: {
  provider: AIProviderConfig;
  onSave: (updated: AIProviderConfig) => Promise<void>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDefault: boolean;
}) {
  const [draft, setDraft] = useState<AIProviderConfig>(provider);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [expanded, setExpanded] = useState(!!(provider.type === 'image' && !provider.apiKey));
  const [testPrompt, setTestPrompt] = useState('');

  // Keep in sync if parent refreshes providers list
  useEffect(() => {
    setDraft(provider);
  }, [provider.id]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(provider);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      toast.success(`${draft.name} saved ✓`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (draft.apiKey) {
      navigator.clipboard.writeText(draft.apiKey);
      toast.success('API key copied');
    }
  };

  const handleTest = async () => {
    if (!draft.apiKey) { toast.error('Enter an API key first'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      let res: Response;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (draft.id === 'kimi' || draft.id === 'openai-gpt') {
        headers['Authorization'] = `Bearer ${draft.apiKey}`;
        res = await fetch(`${draft.endpoint}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: draft.model, messages: [{ role: 'user', content: testPrompt || 'ping' }], max_tokens: 10 })
        });
      } else if (draft.id === 'anthropic') {
        headers['x-api-key'] = draft.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        res = await fetch(`${draft.endpoint}/messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: draft.model, max_tokens: 10, messages: [{ role: 'user', content: testPrompt || 'ping' }] })
        });
      } else if (draft.id === 'openai-dalle') {
        headers['Authorization'] = `Bearer ${draft.apiKey}`;
        res = await fetch(`${draft.endpoint}/images/generations`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: draft.model, prompt: testPrompt || 'a simple test', n: 1, size: '512x512' })
        });
      } else if (draft.id === 'stability') {
        headers['Authorization'] = `Bearer ${draft.apiKey}`;
        res = await fetch(`${draft.endpoint}/generation/${draft.model}/text-to-image`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ text_prompts: [{ text: testPrompt || 'test' }], cfg_scale: 7, height: 512, width: 512, samples: 1 })
        });
      } else {
        // Generic: just ping the endpoint
        headers['Authorization'] = `Bearer ${draft.apiKey}`;
        res = await fetch(draft.endpoint, { method: 'GET', headers });
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err.slice(0, 120)}`);
      }
      setTestResult({ success: true, message: `✓ Connected to ${draft.name} successfully!` });
      toast.success('Connection test passed!');
    } catch (e: any) {
      const msg = e.message || 'Connection failed';
      setTestResult({ success: false, message: msg });
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const typeLabel = draft.type === 'image' ? '🖼 Image' : draft.type === 'text' ? '✏️ Text' : '✨ Both';
  const hasKey = !!draft.apiKey;

  return (
    <div className={`rounded-xl border-2 transition-all ${
      draft.isActive
        ? 'border-[#d4af37]/60 bg-[#d4af37]/5'
        : hasKey
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-white/10 bg-white/[0.02]'
    }`}>
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          draft.type === 'image' ? 'bg-purple-500/20 text-purple-400' :
          draft.type === 'text' ? 'bg-blue-500/20 text-blue-400' :
          'bg-[#d4af37]/20 text-[#d4af37]'
        }`}>
          {draft.type === 'image' ? <Image className="w-5 h-5" /> :
           draft.type === 'text' ? <Wand2 className="w-5 h-5" /> :
           <Sparkles className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-black">{draft.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              draft.type === 'image' ? 'bg-purple-500/20 text-purple-400' :
              draft.type === 'text' ? 'bg-blue-500/20 text-blue-400' :
              'bg-[#d4af37]/20 text-[#d4af37]'
            }`}>{typeLabel}</span>
            {hasKey && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> Key Set
              </span>
            )}
            {draft.isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-bold uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{draft.endpoint}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch
            checked={draft.isActive}
            onCheckedChange={() => onToggle(draft.id)}
            className="data-[state=checked]:bg-[#d4af37]"
          />
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Expanded config ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">

          {/* ── API KEY — the most important field ── */}
          <div className="rounded-xl bg-black/40 border border-[#d4af37]/30 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[#d4af37] font-black uppercase text-xs tracking-widest">API Key</span>
              <span className="text-red-400 text-xs">*required</span>
            </div>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
                placeholder="Paste your API key here…"
                className="bg-black/60 border-[#d4af37]/40 text-white pr-24 h-12 rounded-lg font-mono text-sm focus:border-[#d4af37] focus:ring-[#d4af37]/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {draft.apiKey && (
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Copy key"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setShowKey(s => !s)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {!hasKey && (
              <p className="text-amber-400/70 text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                No API key set — this provider won't generate images until you add one
              </p>
            )}
          </div>

          {/* ── Endpoint + Model ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Endpoint URL</Label>
              <Input
                value={draft.endpoint}
                onChange={e => setDraft(d => ({ ...d, endpoint: e.target.value }))}
                placeholder="https://api.example.com/v1"
                className="bg-black/40 border-white/10 text-white h-10 rounded-lg font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Model ID</Label>
              <Input
                value={draft.model || ''}
                onChange={e => setDraft(d => ({ ...d, model: e.target.value }))}
                placeholder="model-name"
                className="bg-black/40 border-white/10 text-white h-10 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          {/* ── Image-specific settings ── */}
          {(draft.type === 'image' || draft.type === 'both') && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Image Size</Label>
                <Select
                  value={draft.settings?.imageSize || '1024x1024'}
                  onValueChange={v => setDraft(d => ({ ...d, settings: { ...d.settings, imageSize: v } }))}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="512x512">512 × 512</SelectItem>
                    <SelectItem value="1024x1024">1024 × 1024</SelectItem>
                    <SelectItem value="1792x1024">1792 × 1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.id === 'paperspace-sd' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Steps</Label>
                    <Input
                      type="number" min={10} max={80}
                      value={(draft.settings as any)?.steps || 25}
                      onChange={e => setDraft(d => ({ ...d, settings: { ...d.settings, steps: +e.target.value } }))}
                      className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">CFG Scale</Label>
                    <Input
                      type="number" step="0.5" min={1} max={20}
                      value={(draft.settings as any)?.cfgScale || 7.5}
                      onChange={e => setDraft(d => ({ ...d, settings: { ...d.settings, cfgScale: +e.target.value } }))}
                      className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                    />
                  </div>
                </>
              )}
              {draft.id === 'openai-dalle' && (
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Quality</Label>
                  <Select
                    value={draft.settings?.quality || 'hd'}
                    onValueChange={v => setDraft(d => ({ ...d, settings: { ...d.settings, quality: v as any } }))}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10">
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* ── Text-specific settings ── */}
          {(draft.type === 'text' || draft.type === 'both') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Max Tokens</Label>
                <Input
                  type="number"
                  value={draft.settings?.maxTokens || 1000}
                  onChange={e => setDraft(d => ({ ...d, settings: { ...d.settings, maxTokens: +e.target.value } }))}
                  className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Temperature</Label>
                <Input
                  type="number" step="0.1" min={0} max={2}
                  value={draft.settings?.temperature || 0.7}
                  onChange={e => setDraft(d => ({ ...d, settings: { ...d.settings, temperature: +e.target.value } }))}
                  className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* ── Test connection ── */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Optional test prompt…"
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                className="bg-black/40 border-white/10 text-white h-10 rounded-lg flex-1 text-sm"
              />
              <Button
                onClick={handleTest}
                disabled={testing || !draft.apiKey}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold h-10 px-4 rounded-lg flex-shrink-0"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span className="ml-2">{testing ? 'Testing…' : 'Test'}</span>
              </Button>
            </div>
            {testResult && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                testResult.success ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {!isDefault && (
                <Button
                  onClick={() => onDelete(draft.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold h-9 px-4 rounded-lg text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`font-black h-10 px-6 rounded-lg transition-all ${
                isDirty
                  ? 'bg-[#d4af37] hover:bg-[#d4af37]/80 text-black'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export function AIIntegrationSettings() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [aiDesignEnabled, setAiDesignEnabled] = useState<boolean>(() => {
    const s = localStorage.getItem('ai_design_feature_enabled');
    return s === null ? true : s === 'true';
  });

  // New provider form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'text' | 'image' | 'both'>('image');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newModel, setNewModel] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    loadProviders();
    aiConfigApi.getFeatureEnabled().then(enabled => {
      setAiDesignEnabled(enabled);
      localStorage.setItem('ai_design_feature_enabled', String(enabled));
    }).catch(() => {});
  }, []);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const loaded = await aiConfigApi.getProviders();
      if (loaded && loaded.length > 0) {
        // Merge loaded with defaults: keep defaults for any missing provider
        const loadedIds = new Set(loaded.map((p: AIProviderConfig) => p.id));
        const missing = DEFAULT_PROVIDERS.filter(d => !loadedIds.has(d.id));
        setProviders([...loaded, ...missing]);
        if (missing.length > 0) {
          // Seed missing defaults silently
          await aiConfigApi.saveProviders([...loaded, ...missing]);
        }
      } else {
        setProviders(DEFAULT_PROVIDERS);
        await aiConfigApi.saveProviders(DEFAULT_PROVIDERS);
      }
    } catch {
      const saved = localStorage.getItem('ai_providers');
      setProviders(saved ? JSON.parse(saved) : DEFAULT_PROVIDERS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAIFeature = async (enabled: boolean) => {
    setAiDesignEnabled(enabled);
    await aiConfigApi.setFeatureEnabled(enabled);
    toast.success(enabled ? '✦ AI Design ENABLED for users' : '🔒 AI Design DISABLED — "Coming Soon" shown');
  };

  const handleSaveProvider = async (updated: AIProviderConfig) => {
    const next = providers.map(p => p.id === updated.id ? updated : p);
    setProviders(next);
    await aiConfigApi.saveProviders(next);
  };

  const handleToggleProvider = async (id: string) => {
    const next = providers.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setProviders(next);
    await aiConfigApi.saveProviders(next);
    const p = next.find(p => p.id === id);
    toast.success(p?.isActive ? `${p.name} activated` : `${p?.name} deactivated`);
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Delete this provider? This cannot be undone.')) return;
    const next = providers.filter(p => p.id !== id);
    setProviders(next);
    await aiConfigApi.saveProviders(next);
    toast.success('Provider deleted');
  };

  const handleAddProvider = async () => {
    if (!newName || !newEndpoint || !newApiKey) {
      toast.error('Name, endpoint and API key are required');
      return;
    }
    const np: AIProviderConfig = {
      id: `custom-${Date.now()}`,
      name: newName,
      type: newType,
      isActive: false,
      apiKey: newApiKey,
      endpoint: newEndpoint,
      model: newModel,
      settings: { maxTokens: 1000, temperature: 0.7, imageSize: '1024x1024' }
    };
    const next = [...providers, np];
    setProviders(next);
    await aiConfigApi.saveProviders(next);
    setNewName(''); setNewType('image'); setNewEndpoint('');
    setNewApiKey(''); setNewModel(''); setShowNewKey(false);
    setShowAddDialog(false);
    toast.success(`${np.name} added!`);
  };

  const isDefaultProvider = (id: string) =>
    DEFAULT_PROVIDERS.some(d => d.id === id);

  const imageProviders = providers.filter(p => p.type === 'image' || p.type === 'both');
  const textProviders  = providers.filter(p => p.type === 'text');
  const activeImageP   = providers.find(p => p.isActive && (p.type === 'image' || p.type === 'both'));
  const activeTextP    = providers.find(p => p.isActive && (p.type === 'text' || p.type === 'both'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#d4af37]" />
            AI Integration Settings
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Configure API keys for AI image generation in the 2D Designer
          </p>
        </div>
        <Button
          onClick={loadProviders}
          className="bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 h-9 px-3 rounded-lg"
          title="Reload from Supabase"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Master Toggle */}
      <Card className={`border-2 transition-all ${aiDesignEnabled ? 'border-[#d4af37]/60 bg-[#d4af37]/5' : 'border-red-500/40 bg-red-500/5'}`}>
        <CardContent className="py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${aiDesignEnabled ? 'bg-[#d4af37]/20 border-[#d4af37]/40' : 'bg-red-500/20 border-red-500/40'}`}>
                <Power className={`w-6 h-6 ${aiDesignEnabled ? 'text-[#d4af37]' : 'text-red-400'}`} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase tracking-wider">AI Design Feature</h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  {aiDesignEnabled
                    ? 'Users can generate AI designs in the 2D Studio'
                    : 'Users see "AI Design Coming Soon" in the 2D Studio'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className={`text-sm font-black uppercase tracking-wider ${aiDesignEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {aiDesignEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <Switch
                checked={aiDesignEnabled}
                onCheckedChange={handleToggleAIFeature}
                className="data-[state=checked]:bg-[#d4af37] scale-125"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Provider Status */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Image Generation', icon: <Image className="w-4 h-4" />, provider: activeImageP },
          { label: 'Text Generation',  icon: <Wand2 className="w-4 h-4" />,  provider: activeTextP  },
        ].map(({ label, icon, provider: ap }) => (
          <Card key={label} className="glass-card border-[#d4af37]/20">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="text-[#d4af37]">{icon}</div>
              <div className="flex-1">
                <p className="text-[#d4af37] font-black uppercase text-[10px] tracking-widest">{label}</p>
                {ap ? (
                  <p className="text-white font-bold text-sm mt-0.5">{ap.name}</p>
                ) : (
                  <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> None active
                  </p>
                )}
              </div>
              {ap ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> :
                     <AlertCircle className="w-5 h-5 text-amber-500/60 flex-shrink-0" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── IMAGE PROVIDERS ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <h3 className="text-[#d4af37] font-black uppercase text-xs tracking-widest flex items-center gap-2">
            <Image className="w-4 h-4" /> Image Generation Providers
          </h3>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-300/80 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong className="text-amber-300">To generate images:</strong> expand a provider below, paste your API key, and click <strong>Save Changes</strong>. Then toggle it <strong>Active</strong>. Only one image provider can be active at a time.
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading providers from Supabase…
          </div>
        ) : (
          <div className="space-y-3">
            {imageProviders.map(p => (
              <ProviderRow
                key={p.id}
                provider={p}
                onSave={handleSaveProvider}
                onToggle={handleToggleProvider}
                onDelete={handleDeleteProvider}
                isDefault={isDefaultProvider(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── TEXT PROVIDERS ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <h3 className="text-[#d4af37] font-black uppercase text-xs tracking-widest flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Text / Prompt Enhancement Providers
          </h3>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        {!isLoading && (
          <div className="space-y-3">
            {textProviders.map(p => (
              <ProviderRow
                key={p.id}
                provider={p}
                onSave={handleSaveProvider}
                onToggle={handleToggleProvider}
                onDelete={handleDeleteProvider}
                isDefault={isDefaultProvider(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Provider */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 font-bold h-10 px-5 rounded-lg">
              <Plus className="w-4 h-4 mr-2" /> Add Custom Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0d0d] border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Add Custom AI Provider</DialogTitle>
              <DialogDescription className="text-slate-400">
                Connect any OpenAI-compatible image or text API
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">Provider Name *</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. My Custom API" className="bg-black/60 border-white/10 text-white h-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">Type</Label>
                <Select value={newType} onValueChange={v => setNewType(v as any)}>
                  <SelectTrigger className="bg-black/60 border-white/10 text-white h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="image">Image Generation</SelectItem>
                    <SelectItem value="text">Text Generation</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">Endpoint URL *</Label>
                <Input value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1" className="bg-black/60 border-white/10 text-white h-10 rounded-lg font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> API Key *
                </Label>
                <div className="relative">
                  <Input
                    type={showNewKey ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={e => setNewApiKey(e.target.value)}
                    placeholder="sk-…"
                    className="bg-black/60 border-[#d4af37]/30 text-white h-10 rounded-lg font-mono text-sm pr-10"
                  />
                  <button
                    onClick={() => setShowNewKey(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">Model ID</Label>
                <Input value={newModel} onChange={e => setNewModel(e.target.value)}
                  placeholder="model-name-here" className="bg-black/60 border-white/10 text-white h-10 rounded-lg font-mono text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setShowAddDialog(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 font-bold h-10 rounded-lg">
                  Cancel
                </Button>
                <Button onClick={handleAddProvider}
                  className="flex-1 bg-[#d4af37] hover:bg-[#d4af37]/80 text-black font-black h-10 rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> Add Provider
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
