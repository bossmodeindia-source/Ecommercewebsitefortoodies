import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Sparkles, Wand2, Key, Settings, CheckCircle, AlertCircle, Zap, Image, Palette, Plus, Trash2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { storageUtils } from '../utils/storage';

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
  };
}

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'kimi',
    name: 'Kimi 2.5 (Moonshot)',
    type: 'text', // Kimi is text-only, not image generation
    isActive: true,
    apiKey: 'sk-50SOnqs2BB0WpDIUmHfEqejs4H0CA93u8NkTg8i4yTvre6in',
    endpoint: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    settings: {
      maxTokens: 1000,
      temperature: 0.7,
      imageSize: '1024x1024'
    }
  },
  {
    id: 'openai-dalle',
    name: 'OpenAI DALL-E 3',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'dall-e-3',
    settings: {
      imageSize: '1024x1024',
      quality: 'hd',
      style: 'vivid'
    }
  },
  {
    id: 'openai-gpt',
    name: 'OpenAI GPT-4',
    type: 'text',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
    settings: {
      maxTokens: 1000,
      temperature: 0.7
    }
  },
  {
    id: 'stability',
    name: 'Stability AI (SDXL)',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.stability.ai/v1',
    model: 'stable-diffusion-xl-1024-v1-0',
    settings: {
      imageSize: '1024x1024'
    }
  },
  {
    id: 'replicate',
    name: 'Replicate (Flux)',
    type: 'image',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.replicate.com/v1',
    model: 'black-forest-labs/flux-schnell',
    settings: {
      imageSize: '1024x1024'
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    type: 'text',
    isActive: false,
    apiKey: '',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    settings: {
      maxTokens: 1000,
      temperature: 0.7
    }
  }
];

export function AIIntegrationSettings() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderConfig | null>(null);
  const [testPrompt, setTestPrompt] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Add Custom Provider State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderType, setNewProviderType] = useState<'text' | 'image' | 'both'>('image');
  const [newProviderEndpoint, setNewProviderEndpoint] = useState('');
  const [newProviderApiKey, setNewProviderApiKey] = useState('');
  const [newProviderModel, setNewProviderModel] = useState('');
  const [newProviderAuthType, setNewProviderAuthType] = useState<'bearer' | 'api-key' | 'custom'>('bearer');
  const [newProviderAuthHeader, setNewProviderAuthHeader] = useState('Authorization');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    const saved = localStorage.getItem('ai_providers');
    if (saved) {
      setProviders(JSON.parse(saved));
    } else {
      setProviders(DEFAULT_PROVIDERS);
      localStorage.setItem('ai_providers', JSON.stringify(DEFAULT_PROVIDERS));
    }
  };

  const saveProviders = (updatedProviders: AIProviderConfig[]) => {
    setProviders(updatedProviders);
    localStorage.setItem('ai_providers', JSON.stringify(updatedProviders));
    toast.success('AI configuration saved');
  };

  const handleUpdateProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    const updated = providers.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    saveProviders(updated);
  };

  const handleToggleProvider = (id: string) => {
    const updated = providers.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    saveProviders(updated);
  };

  const handleDeleteProvider = (id: string) => {
    if (confirm('Are you sure you want to delete this AI provider?')) {
      const updated = providers.filter(p => p.id !== id);
      saveProviders(updated);
      toast.success('Provider deleted');
    }
  };

  const handleAddCustomProvider = () => {
    if (!newProviderName || !newProviderEndpoint || !newProviderApiKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProvider: AIProviderConfig = {
      id: `custom-${Date.now()}`,
      name: newProviderName,
      type: newProviderType,
      isActive: false, // Don't activate immediately
      apiKey: newProviderApiKey,
      endpoint: newProviderEndpoint,
      model: newProviderModel,
      settings: {
        maxTokens: 1000,
        temperature: 0.7,
        imageSize: '1024x1024'
      }
    };

    saveProviders([...providers, newProvider]);
    
    // Reset form
    setNewProviderName('');
    setNewProviderType('image');
    setNewProviderEndpoint('');
    setNewProviderApiKey('');
    setNewProviderModel('');
    setNewProviderAuthType('bearer');
    setNewProviderAuthHeader('Authorization');
    
    setShowAddDialog(false);
    toast.success(`${newProvider.name} added successfully!`);
  };

  const isDefaultProvider = (id: string) => {
    return ['kimi', 'openai-dalle', 'openai-gpt', 'stability', 'replicate', 'anthropic'].includes(id);
  };

  const handleTestProvider = async (provider: AIProviderConfig) => {
    if (!provider.apiKey) {
      toast.error('API key is required');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      let endpoint = '';
      let body: any = {};
      let headers: any = {
        'Content-Type': 'application/json'
      };

      // Configure based on provider
      switch (provider.id) {
        case 'kimi':
          endpoint = `${provider.endpoint}/chat/completions`;
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
          body = {
            model: provider.model,
            messages: [
              { role: 'user', content: testPrompt || 'Test connection' }
            ],
            max_tokens: 50
          };
          break;

        case 'openai-dalle':
          endpoint = `${provider.endpoint}/images/generations`;
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
          body = {
            model: provider.model,
            prompt: testPrompt || 'A test image',
            n: 1,
            size: provider.settings?.imageSize || '1024x1024',
            quality: provider.settings?.quality || 'standard'
          };
          break;

        case 'openai-gpt':
          endpoint = `${provider.endpoint}/chat/completions`;
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
          body = {
            model: provider.model,
            messages: [
              { role: 'user', content: testPrompt || 'Test connection' }
            ],
            max_tokens: 50
          };
          break;

        case 'stability':
          endpoint = `${provider.endpoint}/generation/${provider.model}/text-to-image`;
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
          body = {
            text_prompts: [
              { text: testPrompt || 'A test image' }
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1
          };
          break;

        case 'anthropic':
          endpoint = `${provider.endpoint}/messages`;
          headers['x-api-key'] = provider.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          body = {
            model: provider.model,
            max_tokens: 50,
            messages: [
              { role: 'user', content: testPrompt || 'Test connection' }
            ]
          };
          break;

        default:
          throw new Error('Provider test not configured');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Test Response:', data);

      setTestResult({
        success: true,
        message: `Connection successful! ${provider.name} is working correctly.`
      });

      toast.success(`${provider.name} connected successfully!`);
    } catch (error) {
      console.error('API Test Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      setTestResult({
        success: false,
        message: `Connection failed: ${errorMessage}`
      });

      toast.error(`${provider.name} connection failed`);
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'text': return <Wand2 className="w-4 h-4" />;
      case 'both': return <Sparkles className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const activeImageProvider = providers.find(p => p.isActive && (p.type === 'image' || p.type === 'both'));
  const activeTextProvider = providers.find(p => p.isActive && (p.type === 'text' || p.type === 'both'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#d4af37]" />
            AI Integration Settings
          </h2>
          <p className="text-slate-400 mt-2">
            Configure AI providers for design generation in the 2D Designer
          </p>
        </div>
      </div>

      {/* Active Provider Status */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-[#d4af37]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4" />
              Image Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeImageProvider ? (
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{activeImageProvider.name}</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No active provider</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-[#d4af37]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Text Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTextProvider ? (
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{activeTextProvider.name}</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No active provider</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider Configuration */}
      <Card className="glass-card border-[#d4af37]/20">
        <CardHeader>
          <CardTitle className="text-white">AI Provider Configuration</CardTitle>
          <CardDescription>
            Configure API keys and settings for AI image generation providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {providers.map((provider) => (
              <Card 
                key={provider.id} 
                className={`border-2 transition-all ${
                  provider.isActive 
                    ? 'border-[#d4af37]/50 bg-[#d4af37]/5' 
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(provider.type)}
                      <div>
                        <CardTitle className="text-lg text-white">{provider.name}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider">
                          {provider.type} generation
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={provider.isActive}
                      onCheckedChange={() => handleToggleProvider(provider.id)}
                      className="data-[state=checked]:bg-[#d4af37]"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                        API Key *
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
                          placeholder="Enter your API key"
                          className="bg-black/40 border-white/10 text-white pl-10 h-10 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                        Endpoint
                      </Label>
                      <Input
                        value={provider.endpoint}
                        onChange={(e) => handleUpdateProvider(provider.id, { endpoint: e.target.value })}
                        placeholder="API endpoint URL"
                        className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                        Model
                      </Label>
                      <Input
                        value={provider.model || ''}
                        onChange={(e) => handleUpdateProvider(provider.id, { model: e.target.value })}
                        placeholder="Model ID"
                        className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                      />
                    </div>

                    {(provider.type === 'text' || provider.type === 'both') && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                            Max Tokens
                          </Label>
                          <Input
                            type="number"
                            value={provider.settings?.maxTokens || 1000}
                            onChange={(e) => handleUpdateProvider(provider.id, {
                              settings: { ...provider.settings, maxTokens: parseInt(e.target.value) }
                            })}
                            className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                            Temperature
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={provider.settings?.temperature || 0.7}
                            onChange={(e) => handleUpdateProvider(provider.id, {
                              settings: { ...provider.settings, temperature: parseFloat(e.target.value) }
                            })}
                            className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                          />
                        </div>
                      </>
                    )}

                    {(provider.type === 'image' || provider.type === 'both') && (
                      <div className="space-y-2">
                        <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                          Image Size
                        </Label>
                        <Select
                          value={provider.settings?.imageSize || '1024x1024'}
                          onValueChange={(value) => handleUpdateProvider(provider.id, {
                            settings: { ...provider.settings, imageSize: value }
                          })}
                        >
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/10">
                            <SelectItem value="512x512">512×512</SelectItem>
                            <SelectItem value="1024x1024">1024×1024</SelectItem>
                            <SelectItem value="1792x1024">1792×1024</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Test Connection */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Test prompt (optional)"
                        value={selectedProvider?.id === provider.id ? testPrompt : ''}
                        onChange={(e) => {
                          setSelectedProvider(provider);
                          setTestPrompt(e.target.value);
                        }}
                        className="bg-black/40 border-white/10 text-white h-10 rounded-lg flex-1"
                      />
                      <Button
                        onClick={() => handleTestProvider(provider)}
                        disabled={isTesting || !provider.apiKey}
                        className="bg-[#d4af37] hover:bg-[#d4af37]/80 text-black font-bold px-6 h-10 rounded-lg"
                      >
                        {isTesting ? (
                          <>
                            <Zap className="w-4 h-4 mr-2 animate-pulse" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedProvider?.id === provider.id && testResult && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        testResult.success 
                          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm">{testResult.message}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  {!isDefaultProvider(provider.id) && (
                    <div className="pt-4 border-t border-white/10">
                      <Button
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="bg-red-500 hover:bg-red-500/80 text-black font-bold px-6 h-10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Provider
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger className="bg-[#d4af37] hover:bg-[#d4af37]/80 text-black font-bold px-6 h-10 rounded-lg">
          Add Custom Provider
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom AI Provider</DialogTitle>
            <DialogDescription>
              Configure a new AI provider for design generation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                Provider Name
              </Label>
              <Input
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
                placeholder="Provider Name"
                className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                Type
              </Label>
              <Select
                value={newProviderType}
                onValueChange={(value) => setNewProviderType(value as 'text' | 'image' | 'both')}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="text">Text Generation</SelectItem>
                  <SelectItem value="image">Image Generation</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                Endpoint
              </Label>
              <Input
                value={newProviderEndpoint}
                onChange={(e) => setNewProviderEndpoint(e.target.value)}
                placeholder="API endpoint URL"
                className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                API Key
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  value={newProviderApiKey}
                  onChange={(e) => setNewProviderApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="bg-black/40 border-white/10 text-white pl-10 h-10 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                Model
              </Label>
              <Input
                value={newProviderModel}
                onChange={(e) => setNewProviderModel(e.target.value)}
                placeholder="Model ID"
                className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                Authentication Type
              </Label>
              <Select
                value={newProviderAuthType}
                onValueChange={(value) => setNewProviderAuthType(value as 'bearer' | 'api-key' | 'custom')}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="custom">Custom Header</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newProviderAuthType === 'custom' && (
              <div className="space-y-2">
                <Label className="text-[#d4af37] font-bold uppercase text-[10px] tracking-widest">
                  Authentication Header
                </Label>
                <Input
                  value={newProviderAuthHeader}
                  onChange={(e) => setNewProviderAuthHeader(e.target.value)}
                  placeholder="Authorization"
                  className="bg-black/40 border-white/10 text-white h-10 rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleAddCustomProvider}
              className="bg-[#d4af37] hover:bg-[#d4af37]/80 text-black font-bold px-6 h-10 rounded-lg"
            >
              Add Provider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documentation */}
      <Card className="glass-card border-[#d4af37]/20">
        <CardHeader>
          <CardTitle className="text-white">Setup Instructions</CardTitle>
          <CardDescription>
            How to get API keys for each provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-400">
          <div className="space-y-2">
            <h4 className="text-[#d4af37] font-bold">Kimi 2.5 (Default)</h4>
            <p>Already configured with your API key. Visit <a href="https://platform.moonshot.cn/" target="_blank" className="text-[#d4af37] underline">Moonshot Platform</a> to manage.</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[#d4af37] font-bold">OpenAI DALL-E 3</h4>
            <p>1. Go to <a href="https://platform.openai.com/api-keys" target="_blank" className="text-[#d4af37] underline">OpenAI API Keys</a></p>
            <p>2. Create new secret key</p>
            <p>3. Paste the key above (starts with sk-...)</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[#d4af37] font-bold">Stability AI</h4>
            <p>1. Visit <a href="https://platform.stability.ai/account/keys" target="_blank" className="text-[#d4af37] underline">Stability AI</a></p>
            <p>2. Generate API key</p>
            <p>3. Configure endpoint and key above</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[#d4af37] font-bold">Replicate (Flux)</h4>
            <p>1. Sign up at <a href="https://replicate.com/" target="_blank" className="text-[#d4af37] underline">Replicate</a></p>
            <p>2. Get API token from account settings</p>
            <p>3. Flux model provides fast, high-quality generation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}