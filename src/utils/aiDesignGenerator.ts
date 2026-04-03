// Version check - helps detect browser caching issues
console.log('✅ AI Design Generator v4.0 loaded - Supabase-backed providers');

// Configuration version for auto-upgrades
const CONFIG_VERSION = 3;

// In-memory cache for providers (fallback if localStorage fails)
let providersCache: any[] | null = null;

/**
 * Get active AI provider — reads from Supabase first, falls back to localStorage.
 * Import is lazy so we don't create circular dependency issues.
 */
export function getActiveAIProvider() {
  // Synchronous path: use localStorage / memory cache
  try {
    let saved = localStorage.getItem('ai_providers');
    let providers: any[] = [];

    if (saved) {
      providers = JSON.parse(saved);
      providersCache = providers;
    } else if (providersCache && providersCache.length > 0) {
      providers = providersCache;
    } else {
      providers = [];
    }

    const activeProvider = providers.find((p: any) =>
      p.isActive && (p.type === 'image' || p.type === 'both')
    );

    if (!activeProvider) return null;

    return {
      ...activeProvider,
      apiEndpoint: activeProvider.apiEndpoint || activeProvider.endpoint || '',
      modelName: activeProvider.modelName || activeProvider.model || '',
      apiKey: activeProvider.apiKey || '',
    };
  } catch {
    return null;
  }
}

/**
 * Async version — pulls from Supabase then updates cache.
 * Use this when you can await (e.g. before generation starts).
 */
export async function getActiveAIProviderAsync(): Promise<any | null> {
  try {
    // Dynamically import to avoid circular deps
    const { aiConfigApi } = await import('./supabaseApi');
    const provider = await aiConfigApi.getActiveImageProvider();
    if (provider) {
      // Update localStorage cache so synchronous reads stay fresh
      const all = await aiConfigApi.getProviders();
      if (all.length > 0) {
        localStorage.setItem('ai_providers', JSON.stringify(all));
        providersCache = all;
      }
      return {
        ...provider,
        apiEndpoint: provider.apiEndpoint || provider.endpoint || '',
        modelName: provider.modelName || provider.model || '',
        apiKey: provider.apiKey || '',
      };
    }
    return null;
  } catch {
    // Fall back to synchronous path
    return getActiveAIProvider();
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
 * Generate design image using Paperspace Stable Diffusion API
 * The prompt automatically includes "no background" for print-ready results
 */
export async function generateWithPaperspaceSD(userPrompt: string, productType: string = 't-shirt'): Promise<string> {
  try {
    // Get providers from localStorage
    let providers: any[] = [];
    const saved = localStorage.getItem('ai_providers');
    if (saved) {
      providers = JSON.parse(saved);
    } else if (providersCache) {
      providers = providersCache;
    }

    // Find active Paperspace SD provider
    const sdProvider = providers.find((p: any) =>
      p.isActive && (p.id === 'paperspace-sd' || (p.id?.startsWith('custom-') && p.type === 'image'))
    );

    if (!sdProvider) {
      throw new Error(
        'Stable Diffusion (Paperspace) is not configured or active. ' +
        'Please go to Admin Dashboard → AI Integration Settings and activate the Paperspace provider.'
      );
    }

    if (!sdProvider.apiKey) {
      throw new Error(
        `API key not set for "${sdProvider.name}". ` +
        'Please add your Paperspace API key in Admin → AI Integration Settings.'
      );
    }

    if (!sdProvider.endpoint) {
      throw new Error(
        `Endpoint URL not set for "${sdProvider.name}". ` +
        'Please configure the Paperspace deployment URL in Admin → AI Integration Settings.'
      );
    }

    console.log('🎨 Generating with Paperspace SD:', sdProvider.name);
    console.log('📍 Endpoint:', sdProvider.endpoint);

    // Build enhanced prompt with strict no-background requirement
    const enhancedPrompt = [
      userPrompt,
      `for ${productType} printing`,
      'transparent background',
      'no background',
      'isolated graphic design',
      'flat vector art style',
      'centered composition',
      'print ready',
      'high quality',
      'crisp edges',
      'bold colors',
      '1024x1024'
    ].join(', ');

    const negativePrompt =
      'background, clothing, garment, model, person, human, shadow, drop shadow, ' +
      '3d render, blurry, low quality, watermark, text overlay, noise, grain, ' +
      'realistic photo, photograph, photorealistic, dark background, white background, ' +
      'gradient background, bokeh, lens flare';

    const imageSize = sdProvider.settings?.imageSize || '1024x1024';
    const [imgWidth, imgHeight] = imageSize.split('x').map(Number);

    const requestBody: any = {
      prompt: enhancedPrompt,
      negative_prompt: negativePrompt,
      width: imgWidth || 1024,
      height: imgHeight || 1024,
      steps: sdProvider.settings?.steps || 25,
      cfg_scale: sdProvider.settings?.cfgScale || 7.5,
      samples: 1,
      n: 1,
      num_inference_steps: sdProvider.settings?.steps || 25,
      guidance_scale: sdProvider.settings?.cfgScale || 7.5,
    };

    // If model is specified, include it
    if (sdProvider.model) {
      requestBody.model = sdProvider.model;
      requestBody.model_id = sdProvider.model;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Support multiple auth styles
    const authType = sdProvider.authType || 'bearer';
    if (authType === 'bearer') {
      headers['Authorization'] = `Bearer ${sdProvider.apiKey}`;
    } else if (authType === 'api-key') {
      headers['X-Api-Key'] = sdProvider.apiKey;
    } else if (authType === 'paperspace') {
      headers['Authorization'] = sdProvider.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${sdProvider.apiKey}`;
    }

    console.log('📤 Sending request to Paperspace SD...');

    const response = await fetch(sdProvider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Paperspace SD Error:', response.status, errorText);
      throw new Error(
        `Stable Diffusion API error (${response.status}): ${errorText.substring(0, 300)}`
      );
    }

    const data = await response.json();
    console.log('✅ Paperspace SD response received');

    // Handle multiple common SD API response formats
    let imageData: string | null = null;

    // Format 1: A1111/Automatic1111 WebUI format → { "images": ["base64..."] }
    if (data.images && Array.isArray(data.images) && data.images[0]) {
      imageData = data.images[0];
      console.log('📦 Using A1111 format response');
    }
    // Format 2: Stability AI / DreamStudio → { "artifacts": [{ "base64": "..." }] }
    else if (data.artifacts && data.artifacts[0]?.base64) {
      imageData = data.artifacts[0].base64;
      console.log('📦 Using Stability AI format response');
    }
    // Format 3: Generic output array → { "output": ["base64..." or "url..."] }
    else if (data.output && Array.isArray(data.output) && data.output[0]) {
      imageData = data.output[0];
      console.log('📦 Using generic output format response');
    }
    // Format 4: Single base64 field → { "image": "base64..." }
    else if (data.image) {
      imageData = data.image;
      console.log('📦 Using single image format response');
    }
    // Format 5: Hugging Face Inference API → { "data": [{ "url": "..." }] }
    else if (data.data && Array.isArray(data.data) && data.data[0]) {
      imageData = data.data[0].url || data.data[0].base64 || data.data[0];
      console.log('📦 Using HuggingFace format response');
    }
    // Format 6: Replicate → { "urls": { "get": "..." } } or poll URL
    else if (data.urls?.get) {
      // For replicate, we'd need to poll - simplified to error
      throw new Error('Replicate polling format not supported directly. Use a synchronous SD endpoint.');
    }

    if (!imageData) {
      console.error('❌ Unknown response format:', JSON.stringify(data).substring(0, 500));
      throw new Error(
        'Could not extract image from API response. ' +
        'Ensure the endpoint returns images in A1111, Stability AI, or standard base64 format.'
      );
    }

    // If it's a URL (not base64), fetch and convert
    if (typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
      console.log('📥 Image returned as URL, downloading...');
      const imgResponse = await fetch(imageData);
      if (!imgResponse.ok) throw new Error('Failed to download generated image from URL');
      const blob = await imgResponse.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Return as data URL (base64)
    if (typeof imageData === 'string') {
      const dataUrl = imageData.startsWith('data:')
        ? imageData
        : `data:image/png;base64,${imageData}`;
      console.log('✅ Image ready as data URL');
      return dataUrl;
    }

    throw new Error('Invalid image data format received from API');

  } catch (error) {
    console.error('❌ Paperspace SD generation error:', error);
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
    const imageUrl = await generateDesignImage(structuredImagePrompt, productType);
    
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

/**
 * Generate a design image using the best available image provider.
 * Now fetches provider from Supabase before calling the API.
 */
export async function generateDesignImage(prompt: string, productType: string = 't-shirt'): Promise<string> {
  // Refresh provider cache from Supabase before generating
  try {
    const { aiConfigApi } = await import('./supabaseApi');
    const all = await aiConfigApi.getProviders();
    if (all.length > 0) {
      localStorage.setItem('ai_providers', JSON.stringify(all));
      providersCache = all;
    }
  } catch {
    // Continue with cached providers
  }

  // Try Paperspace SD first (primary image provider)
  try {
    return await generateWithPaperspaceSD(prompt, productType);
  } catch (paperspaceError) {
    console.warn('⚠️ Paperspace SD failed, checking other image providers...', paperspaceError);
  }

  // Fallback: check for any other active image provider
  let providers: any[] = [];
  try {
    const saved = localStorage.getItem('ai_providers');
    if (saved) providers = JSON.parse(saved);
    else if (providersCache) providers = providersCache;
  } catch (_) {}

  const imageProvider = providers.find(
    (p: any) => p.isActive && (p.type === 'image' || p.type === 'both') && p.id !== 'paperspace-sd'
  );

  if (!imageProvider) {
    throw new Error(
      'No active image generation provider found. ' +
      'Please configure a Paperspace SD or compatible image API in Admin → AI Integration Settings.'
    );
  }

  if (!imageProvider.apiKey) {
    throw new Error(
      `API key not set for "${imageProvider.name}". ` +
      'Please add it in Admin → AI Integration Settings.'
    );
  }

  console.log('🔄 Using fallback image provider:', imageProvider.name);

  switch (imageProvider.id) {
    case 'openai-dalle': {
      const endpoint = `${imageProvider.endpoint}/images/generations`;
      const body = {
        model: imageProvider.model || 'dall-e-3',
        prompt,
        n: 1,
        size: imageProvider.settings?.imageSize || '1024x1024',
        quality: imageProvider.settings?.quality || 'standard',
        response_format: 'b64_json'
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${imageProvider.apiKey}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`DALL-E error (${res.status}): ${await res.text()}`);
      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image data in DALL-E response');
      return `data:image/png;base64,${b64}`;
    }

    case 'stability': {
      const endpoint = `${imageProvider.endpoint}/generation/${imageProvider.model || 'stable-diffusion-xl-1024-v1-0'}/text-to-image`;
      const body = {
        text_prompts: [{ text: prompt, weight: 1 }, { text: 'blurry, low quality, background', weight: -1 }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${imageProvider.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Stability AI error (${res.status}): ${await res.text()}`);
      const data = await res.json();
      const b64 = data.artifacts?.[0]?.base64;
      if (!b64) throw new Error('No image data in Stability AI response');
      return `data:image/png;base64,${b64}`;
    }

    default: {
      return await generateWithPaperspaceSD(prompt, productType);
    }
  }
}