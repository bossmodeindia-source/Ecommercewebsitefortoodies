import { memo } from 'react';

/**
 * DesignRenderer - XY COORDINATE GRIDLINES SYSTEM
 * 
 * Uses absolute pixel XY coordinates - no conversion needed!
 * - Model and layers both use same 600x600px canvas
 * - XY coordinates are the CENTER point of each element
 * - CSS: left: x, top: y, transform: translate(-50%, -50%)
 */

export interface DesignLayer {
  id: string;
  imageUrl: string;
  x: number;              // Absolute pixel X (center point)
  y: number;              // Absolute pixel Y (center point)
  width: number;          // Absolute pixel width
  height: number;         // Absolute pixel height
  rotation: number;       // degrees
  printingMethodId?: string;
}

interface DesignRendererProps {
  modelUrl: string;
  layers: DesignLayer[];
  canvasSize?: number;    // Default: 600
  className?: string;
}

/**
 * Export design from XY coordinates to high-resolution PNG
 */
export async function exportDesignFromCoordinates(
  modelUrl: string,
  layers: DesignLayer[],
  resolution: number = 2400
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Scale factor from 600px to target resolution
      const scale = resolution / 600;

      // Step 1: Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, resolution, resolution);

      // Step 2: Load and draw mockup model
      const modelImg = new Image();
      modelImg.crossOrigin = 'anonymous';

      modelImg.onload = () => {
        // Draw mockup filling entire square canvas (object-fit: cover behavior)
        const modelAspect = modelImg.width / modelImg.height;
        const canvasAspect = 1; // Square canvas
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (modelAspect > canvasAspect) {
          // Model is wider - fit to height and crop sides
          drawHeight = resolution;
          drawWidth = resolution * modelAspect;
          drawX = (resolution - drawWidth) / 2;
          drawY = 0;
        } else {
          // Model is taller - fit to width and crop top/bottom
          drawWidth = resolution;
          drawHeight = resolution / modelAspect;
          drawX = 0;
          drawY = (resolution - drawHeight) / 2;
        }
        
        // Draw model with cover behavior (fills entire square)
        ctx.drawImage(modelImg, drawX, drawY, drawWidth, drawHeight);

        // Step 3: Draw all design layers
        let loadedLayers = 0;
        const totalLayers = layers.length;

        if (totalLayers === 0) {
          resolve(canvas.toDataURL('image/png', 1.0));
          return;
        }

        layers.forEach((layer) => {
          const layerImg = new Image();
          layerImg.crossOrigin = 'anonymous';

          layerImg.onload = () => {
            // Scale coordinates and dimensions
            const scaledX = layer.x * scale;
            const scaledY = layer.y * scale;
            const scaledWidth = layer.width * scale;
            const scaledHeight = layer.height * scale;
            
            // Calculate top-left corner from center point
            const x = scaledX - scaledWidth / 2;
            const y = scaledY - scaledHeight / 2;

            ctx.save();

            // Apply rotation around center point
            if (layer.rotation !== 0) {
              ctx.translate(scaledX, scaledY);
              ctx.rotate((layer.rotation * Math.PI) / 180);
              ctx.translate(-scaledX, -scaledY);
            }

            // Draw layer
            ctx.drawImage(layerImg, x, y, scaledWidth, scaledHeight);
            ctx.restore();

            loadedLayers++;
            if (loadedLayers === totalLayers) {
              resolve(canvas.toDataURL('image/png', 1.0));
            }
          };

          layerImg.onerror = () => {
            loadedLayers++;
            if (loadedLayers === totalLayers) {
              resolve(canvas.toDataURL('image/png', 1.0));
            }
          };

          layerImg.src = layer.imageUrl;
        });
      };

      modelImg.onerror = () => reject(new Error('Failed to load model image'));
      modelImg.src = modelUrl;
    } catch (error) {
      reject(error);
    }
  });
}

export const DesignRenderer = memo(function DesignRenderer({ 
  modelUrl, 
  layers, 
  canvasSize = 600,
  className = ''
}: DesignRendererProps) {
  // Scale factor to render at different sizes (e.g., 48px for thumbnails)
  const scale = canvasSize / 600;

  return (
    <div 
      className={`relative ${className}`}
      style={{
        width: `${canvasSize}px`,
        height: `${canvasSize}px`,
        aspectRatio: '1/1'
      }}
    >
      {/* Model Background - Same as TwoDDesigner */}
      <img
        src={modelUrl}
        alt="Product Mockup"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ aspectRatio: '1/1' }}
      />
      
      {/* Design Layers - Using absolute XY coordinates */}
      {layers.map((layer) => {
        return (
          <div
            key={layer.id}
            className="absolute"
            style={{
              // Use absolute XY coordinates with scale factor
              left: `${layer.x * scale}px`,
              top: `${layer.y * scale}px`,
              width: `${layer.width * scale}px`,
              height: `${layer.height * scale}px`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
            }}
          >
            <img
              src={layer.imageUrl}
              alt="Design Layer"
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
});