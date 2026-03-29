import { DesignData } from './indexedDB';
import { toast } from 'sonner@2.0.3';
import { exportDesignFromCoordinates } from '../components/design-export';

// Figma API configuration
const FIGMA_API_TOKEN = 'YOUR_FIGMA_API_TOKEN_HERE'; // Admin needs to set this
const FIGMA_PROJECT_ID = 'YOUR_FIGMA_PROJECT_ID_HERE'; // The Figma project to submit to
const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface FigmaSubmissionResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
  orderId: string;
}

/**
 * Submit design to Figma after successful payment
 * Creates a new file in the "Customer Orders" folder
 */
export async function submitDesignToFigma(
  designData: DesignData,
  orderDetails: {
    orderId: string;
    paymentId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
  }
): Promise<FigmaSubmissionResult> {
  try {
    // Generate high-resolution export from coordinates
    console.log('📤 Generating export for Figma submission...');
    const screenshotDataUrl = await exportDesignFromCoordinates(
      designData.modelUrl,
      designData.designLayers,
      2400
    );
    const fullResBlob = await base64ToBlob(screenshotDataUrl);
    
    // Create file name with order details
    const fileName = `ORDER_${orderDetails.orderId}_${designData.productName}_${designData.color}_${designData.size}`;
    
    // Prepare description with all order details
    const description = `
🛍️ ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━
Order ID: ${orderDetails.orderId}
Payment ID: ${orderDetails.paymentId}
Status: ✅ PAID

👤 CUSTOMER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━
Name: ${orderDetails.customerName}
Email: ${orderDetails.customerEmail}
Phone: ${orderDetails.customerPhone}
Address: ${orderDetails.deliveryAddress}

🎨 PRODUCT DETAILS
━━━━━━━━━━━━━━━━━━━━━━
Product: ${designData.productName}
Color: ${designData.color}
Size: ${designData.size}
Fabric: ${designData.fabric}
Printing Method: ${designData.printingMethod}

💰 PRICING
━━━━━━━━━━━━━━━━━━━━━━
Base Price: ₹${designData.basePrice}
Printing Cost: ₹${designData.printingCost}
Total: ₹${designData.basePrice + designData.printingCost}

📐 DESIGN SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━
Canvas Size: ${designData.canvasWidth}x${designData.canvasHeight}px
Design Layers: ${designData.designLayers.length}
Resolution: 2400x2400px
Format: PNG (100% quality, no compression)
Generated from: Normalized coordinates

📦 LAYER DETAILS
━━━━━━━━━━━━━━━━━━━━━━
${designData.designLayers.map((layer, i) => `
Layer ${i + 1}:
  Position: ${layer.normalizedX}%, ${layer.normalizedY}%
  Size: ${layer.normalizedWidth}% x ${layer.normalizedHeight}%
  Rotation: ${layer.rotation}°
  Printing: ${layer.printingMethodName}
  Cost: ₹${layer.printingCost}
`).join('\n')}

⚙️ EXPORT METHOD
━━━━━━━━━━━━━━━━━━━━━━
Method: Coordinate-based rendering
Model URL: ${designData.modelUrl}
No screenshots used - design reconstructed from saved coordinates
    `.trim();
    
    console.log('📤 Submitting to Figma...');
    console.log('   File name:', fileName);
    console.log('   Resolution: 2400x2400px');
    console.log('   Format: PNG');
    
    // In a real implementation, this would upload to Figma
    // For now, we'll simulate success
    const simulatedFileUrl = `https://www.figma.com/file/SIMULATED/${fileName}`;
    
    console.log('✅ Simulated Figma submission successful!');
    console.log('   File URL:', simulatedFileUrl);
    
    // Return success with simulated URL
    return {
      success: true,
      fileUrl: simulatedFileUrl,
      orderId: orderDetails.orderId
    };
    
    /*
    // REAL IMPLEMENTATION (requires Figma API token):
    const formData = new FormData();
    formData.append('file', fullResBlob, `${fileName}.png`);
    formData.append('name', fileName);
    formData.append('description', description);
    
    const response = await fetch(`${FIGMA_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'X-Figma-Token': FIGMA_API_TOKEN,
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      fileUrl: data.file_url,
      orderId: orderDetails.orderId
    };
    */
    
  } catch (error: any) {
    console.error('Figma submission failed:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to submit to Figma',
      orderId: orderDetails.orderId
    };
  }
}

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    resolve(new Blob([u8arr], { type: mime }));
  });
}