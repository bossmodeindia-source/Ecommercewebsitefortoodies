// Version check - helps detect browser caching issues
console.log('✅ AI Design Generator v3.0 loaded - Fixed Kimi type');

// Configuration version for auto-upgrades
const CONFIG_VERSION = 3;

// Default provider configuration (fallback if localStorage is empty)
const FALLBACK_PROVIDER = {
  id: 'kimi',
  name: 'Kimi 2.5 (Moonshot)',
  type: 'text' as const, // Kimi is text-only, not image generation
  isActive: true,
  apiKey: 'sk-50SOnqs2BB0WpDIUmHfEqejs4H0CA93u8NkTg8i4yTvre6in',
  endpoint: 'https://api.moonshot.cn/v1',
  model: 'moonshot-v1-8k',
  settings: {
    maxTokens: 1000,
    temperature: 0.7,
    imageSize: '1024x1024'
  }
};

// In-memory cache for providers (fallback if localStorage fails)
let providersCache: any[] | null = null;

/**
 * Initialize default providers if not already configured
 */
function initializeDefaultProviders(): void {
  try {
    // Check if we need to upgrade the configuration
    const configVersion = localStorage.getItem('ai_providers_version');
    const currentVersion = parseInt(configVersion || '0', 10);
    
    if (currentVersion < CONFIG_VERSION) {
      console.log(`🔄 Upgrading AI config from v${currentVersion} to v${CONFIG_VERSION}...`);
      
      // Clear old config and reinitialize
      localStorage.removeItem('ai_providers');
      localStorage.setItem('ai_providers_version', CONFIG_VERSION.toString());
      
      // Force reinitialization below
    }
    
    const saved = localStorage.getItem('ai_providers');
    if (!saved) {
      console.log('🔧 Initializing default AI providers...');
      const defaultProviders = [FALLBACK_PROVIDER];
      const jsonString = JSON.stringify(defaultProviders);
      localStorage.setItem('ai_providers', jsonString);
      localStorage.setItem('ai_providers_version', CONFIG_VERSION.toString());
      
      // Also save to memory cache
      providersCache = defaultProviders;
      
      // Verify it was saved
      const verification = localStorage.getItem('ai_providers');
      if (verification) {
        console.log('✅ Default AI providers initialized successfully');
        console.log('📦 Saved data:', verification);
      } else {
        console.error('❌ Failed to save providers to localStorage - using memory cache');
      }
    } else {
      console.log('📦 AI providers already configured');
      
      // Parse and validate
      const providers = JSON.parse(saved);
      
      // Fix Kimi type if it's wrong
      const kimiProvider = providers.find((p: any) => p.id === 'kimi' || p.name.includes('Kimi'));
      if (kimiProvider && kimiProvider.type !== 'text') {
        console.log('🔧 Fixing Kimi provider type from', kimiProvider.type, 'to text');
        kimiProvider.type = 'text';
        localStorage.setItem('ai_providers', JSON.stringify(providers));
      }
      
      providersCache = providers;
    }
  } catch (error) {
    console.error('❌ Error initializing default providers:', error);
    console.log('🔄 Using in-memory fallback provider');
    providersCache = [FALLBACK_PROVIDER];
  }
}

// Auto-initialize on module load
initializeDefaultProviders();

/**
 * Get active AI provider from admin settings
 */
export function getActiveAIProvider() {
  try {
    let saved = localStorage.getItem('ai_providers');
    let providers: any[] = [];
    
    if (!saved) {
      console.warn('⚠️ No AI providers configured in localStorage');
      
      // Try memory cache first
      if (providersCache && providersCache.length > 0) {
        console.log('🔄 Using providers from memory cache');
        providers = providersCache;
      } else {
        console.warn('🔧 Initializing default providers...');
        
        // Initialize with default Kimi provider
        const defaultProviders = [
          {
            id: 'kimi',
            name: 'Kimi 2.5 (Moonshot)',
            type: 'text' as const, // Kimi is text-only, not image generation
            isActive: true,
            apiKey: 'sk-50SOnqs2BB0WpDIUmHfEqejs4H0CA93u8NkTg8i4yTvre6in',
            endpoint: 'https://api.moonshot.cn/v1',
            model: 'moonshot-v1-8k',
            settings: {
              maxTokens: 1000,
              temperature: 0.7,
              imageSize: '1024x1024'
            }
          }
        ];
        
        // Save to localStorage
        try {
          localStorage.setItem('ai_providers', JSON.stringify(defaultProviders));
          console.log('✅ Default providers saved to localStorage');
        } catch (e) {
          console.error('❌ Could not save to localStorage:', e);
        }
        
        // Save to memory cache
        providersCache = defaultProviders;
        providers = defaultProviders;
      }
    } else {
      providers = JSON.parse(saved);
      providersCache = providers; // Update cache
      console.log('📦 Loaded providers from localStorage:', providers.length);
    }
    
    // Get active image provider (or provider that supports both)
    const activeProvider = providers.find((p: any) => {
      console.log('🔍 Checking provider:', p.name, '| Active:', p.isActive, '| Type:', p.type);
      return p.isActive && (p.type === 'image' || p.type === 'both');
    });
    
    if (!activeProvider) {
      console.warn('⚠️ No active AI provider found among', providers.length, 'providers');
      console.warn('Available providers:', providers.map((p: any) => `${p.name} (active: ${p.isActive}, type: ${p.type})`).join(', '));
      
      // Last resort: use FALLBACK_PROVIDER directly
      console.log('🔄 Using hard-coded fallback provider');
      const normalizedFallback = {
        ...FALLBACK_PROVIDER,
        apiEndpoint: FALLBACK_PROVIDER.endpoint,
        modelName: FALLBACK_PROVIDER.model
      };
      console.log('✅ Fallback Provider:', normalizedFallback.name);
      return normalizedFallback;
    }
    
    // Normalize provider properties (handle both 'endpoint' and 'apiEndpoint' formats)
    const normalizedProvider = {
      ...activeProvider,
      apiEndpoint: activeProvider.apiEndpoint || activeProvider.endpoint || '',
      modelName: activeProvider.modelName || activeProvider.model || 'moonshot-v1-8k',
      apiKey: activeProvider.apiKey || ''
    };
    
    console.log('✅ Active AI Provider:', normalizedProvider.name);
    console.log('   Type:', normalizedProvider.type);
    console.log('   Endpoint:', normalizedProvider.apiEndpoint);
    console.log('   Model:', normalizedProvider.modelName);
    console.log('   Has API Key:', !!normalizedProvider.apiKey);
    
    return normalizedProvider;
  } catch (error) {
    console.error('❌ Error getting AI provider:', error);
    
    // Emergency fallback
    console.log('🆘 Using emergency fallback provider');
    return {
      ...FALLBACK_PROVIDER,
      apiEndpoint: FALLBACK_PROVIDER.endpoint,
      modelName: FALLBACK_PROVIDER.model
    };
  }
}

interface AIDesignRequest {
  userPrompt: string;
  productType?: string; // 't-shirt', 'hoodie', 'bag', etc.
}

interface AIDesignResponse {
  imageUrl: string;
  prompt: string;
  success: boolean;
  error?: string;
}

/**
 * Generate T-shirt design using configured AI provider
 */
export async function generateAIDesign(request: AIDesignRequest): Promise<AIDesignResponse> {
  try {
    const { userPrompt, productType = 't-shirt' } = request;
    
    console.log('🎨 generateAIDesign called:', { userPrompt, productType });
    
    // Get active AI provider
    const provider = getActiveAIProvider();
    
    if (!provider) {
      return {
        imageUrl: '',
        prompt: '',
        success: false,
        error: 'No active AI provider configured. Please go to Admin Dashboard > AI Design tab and configure an AI provider (e.g., OpenAI DALL-E, Stability AI, etc.)'
      };
    }
    
    if (!provider.apiKey) {
      return {
        imageUrl: '',
        prompt: '',
        success: false,
        error: `API key not configured for ${provider.name}. Please add your API key in Admin > AI Design settings.`
      };
    }

    console.log('✅ Using provider:', provider.name, 'Type:', provider.type);

    // Construct strict design prompt
    const systemPrompt = `You are an expert T-shirt graphic designer specializing in streetwear and custom apparel. Generate ONLY design concepts, never actual images.`;

    const structuredPrompt = `Create a high-resolution vector-style graphic for ${productType} printing.

STRICT REQUIREMENTS:
- Transparent background (PNG format)
- NO mockups
- NO clothing or garments
- NO human models or mannequins
- NO 3D rendering
- NO shadows or drop shadows
- NO lighting effects or gradients
- Flat design style ONLY
- Centered composition
- Clean, crisp edges
- Suitable for oversized streetwear ${productType}
- Perfect square format (1:1 aspect ratio)
- High contrast for printing
- Bold, clear lines
- Print-ready quality

Design concept:
${userPrompt}

OUTPUT: Describe the exact flat graphic design (colors, shapes, typography, layout) that would be printed directly on the ${productType}. Focus on the graphic element only, not the product itself.`;

    // For text models (chat/both), get design description first
    if (provider.type === 'chat' || provider.type === 'both') {
      console.log('📝 Fetching design concept from chat model...');
      
      // Build correct endpoint URL for chat
      let chatEndpoint = provider.apiEndpoint || provider.endpoint;
      if (!chatEndpoint.includes('/chat/completions')) {
        chatEndpoint = chatEndpoint.replace(/\/$/, '') + '/chat/completions';
      }
      
      console.log('🔗 Chat endpoint:', chatEndpoint);
      
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.modelName || provider.model || 'moonshot-v1-8k',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: structuredPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', response.status, errorText);
        
        return {
          imageUrl: '',
          prompt: '',
          success: false,
          error: `AI Provider Error (${response.status}): ${errorText.substring(0, 200)}`
        };
      }

      const data = await response.json();
      const designDescription = data.choices?.[0]?.message?.content || '';

      console.log('✅ Design concept received:', designDescription.substring(0, 100) + '...');
      
      return {
        imageUrl: '', // Will be generated via image API
        prompt: designDescription,
        success: true
      };
    }
    
    // For image-only models, skip description step
    console.log('🖼️ Image-only provider, skipping concept generation');
    return {
      imageUrl: '',
      prompt: userPrompt,
      success: true
    };

  } catch (error) {
    console.error('❌ AI Design Generation Error:', error);
    
    return {
      imageUrl: '',
      prompt: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate design image using configured image generation provider
 */
export async function generateDesignImage(prompt: string): Promise<string> {
  try {
    console.log('🖼️ generateDesignImage called');
    
    // Get active AI provider
    const provider = getActiveAIProvider();
    
    if (!provider) {
      throw new Error('No active AI provider configured. Please configure one in Admin > AI Design settings.');
    }
    
    if (!provider.apiKey) {
      throw new Error(`API key not configured for ${provider.name}. Please add it in Admin settings.`);
    }
    
    // Check if provider supports image generation
    if (provider.type !== 'image' && provider.type !== 'both') {
      throw new Error(`${provider.name} does not support image generation. Please configure an image-capable AI provider like OpenAI DALL-E or Stability AI.`);
    }
    
    console.log('✅ Using image provider:', provider.name);
    
    // Build image generation request based on provider
    const response = await fetch(provider.apiEndpoint || provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.modelName || provider.model || 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image API Response Error:', response.status, errorText);
      throw new Error(`Image generation failed (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || '';

    if (!imageUrl) {
      throw new Error('No image URL returned from AI provider');
    }

    console.log('✅ Image URL received:', imageUrl.substring(0, 50) + '...');

    // Convert URL to base64 for storage
    console.log('📥 Downloading image for base64 conversion...');
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ Image converted to base64');
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

  } catch (error) {
    console.error('❌ Image Generation Error:', error);
    throw error;
  }
}

/**
 * Complete AI design generation flow
 */
export async function generateCompleteDesign(userPrompt: string, productType: string = 't-shirt'): Promise<AIDesignResponse> {
  try {
    console.log('🎨 Starting AI design generation...');
    console.log('📝 User prompt:', userPrompt);
    console.log('👕 Product type:', productType);
    
    // Step 1: Generate design concept
    const conceptResult = await generateAIDesign({ userPrompt, productType });
    
    if (!conceptResult.success) {
      console.error('❌ Concept generation failed:', conceptResult.error);
      return conceptResult;
    }

    console.log('✅ Concept generated successfully');
    console.log('📝 Concept:', conceptResult.prompt.substring(0, 200) + '...');

    // Step 2: Check if we need to generate an actual image
    const provider = getActiveAIProvider();
    
    // If we have a text-only provider (text, chat, or Kimi/Moonshot), return the concept without image generation
    if (provider && (provider.type === 'text' || provider.type === 'chat' || provider.id === 'kimi' || provider.name.includes('Kimi') || provider.name.includes('Moonshot'))) {
      console.log('ℹ️ Text-only provider detected:', provider.name);
      console.log('💡 To generate actual images, please configure an image-capable provider in Admin > AI Design settings.');
      
      return {
        imageUrl: '', // No image for text-only providers
        prompt: conceptResult.prompt,
        success: true
      };
    }

    // Step 3: Generate actual image (only if we have an image-capable provider)
    const structuredImagePrompt = `${conceptResult.prompt}\n\nTECHNICAL SPECS:\n- Flat vector illustration\n- Transparent background\n- No shadows or 3D effects\n- Clean edges\n- Bold colors\n- Centered composition\n- Square 1024x1024px\n- Print-ready quality`;

    console.log('🖼️ Generating image from refined prompt...');
    const imageUrl = await generateDesignImage(structuredImagePrompt);
    
    console.log('✅ Design generation completed successfully!');

    return {
      imageUrl,
      prompt: conceptResult.prompt,
      success: true
    };

  } catch (error) {
    console.error('❌ Complete Design Generation Error:', error);
    
    // Return detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    
    return {
      imageUrl: '',
      prompt: '',
      success: false,
      error: errorMessage
    };
  }
}