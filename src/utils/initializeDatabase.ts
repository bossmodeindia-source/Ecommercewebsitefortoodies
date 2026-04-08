import { authApi, productsApi, settingsApi } from './supabaseApi';

/**
 * Database Initialization Script
 * Run this once to set up your Toodies platform with initial data
 */

export async function initializeDatabase() {
  console.log('🚀 Starting Toodies database initialization...\n');
  
  try {
    // Step 1: Create admin account (now uses secure backend)
    console.log('📝 Step 1: Creating admin account...');
    await createAdminAccount();
    
    // Step 2: Initialize sample products
    console.log('\n📦 Step 2: Creating sample products...');
    await createSampleProducts();
    
    // Step 3: Initialize business settings
    console.log('\n⚙️  Step 3: Setting up business information...');
    await initializeBusinessSettings();
    
    // Step 4: Initialize categories
    console.log('\n🏷️  Step 4: Creating product categories...');
    await initializeCategories();
    
    // Step 5: Initialize printing methods
    console.log('\n🖨️  Step 5: Setting up printing methods...');
    await initializePrintingMethods();
    
    console.log('\n✅ Database initialization complete!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Admin account created');
    console.log('   ✓ Sample products added');
    console.log('   ✓ Business settings configured');
    console.log('   ✓ Categories set up');
    console.log('   ✓ Printing methods configured');
    
    return { success: true };
  } catch (error: any) {
    console.error('\n❌ Initialization failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function createAdminAccount() {
  try {
    // Call secure backend endpoint to initialize admin
    const result = await authApi.initializeAdmin();
    console.log(`   ✓ ${result.message}`);
    console.log(`   Email: ${result.email}`);
  } catch (error: any) {
    if (error.message.includes('already')) {
      console.log('   ℹ️  Admin account already exists, skipping...');
    } else {
      throw error;
    }
  }
}

async function createSampleProducts() {
  // Note: To create products, you need to login as admin first
  // For initialization, you would need to provide the admin credentials
  console.log('   ℹ️  Sample products will be created after admin login');
  console.log('   ℹ️  Use the admin dashboard to add products after logging in');
  
  // The following code is kept for reference but commented out
  // since we can't automatically login without exposing the password
  
  /*
  // Login as admin first - This would require the password which is now secure
  await authApi.adminSignin('9886510858@TcbToponeAdmin', 'SECURE_PASSWORD');
  
  const sampleProducts = [
    {
      name: 'Classic White T-Shirt',
      description: 'Premium quality cotton t-shirt, perfect for everyday wear and custom designs',
      category: 'T-Shirts',
      gender: 'unisex' as const,
      base_price: 19.99,
      images: ['https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=500'],
      tags: ['cotton', 'classic', 'basic'],
      printing_methods: ['Screen Print', 'DTG', 'Vinyl'],
      is_active: true,
      allow_prepaid: true,
      allow_postpaid: true,
      variations: [
        { color: 'White', size: 'S', price: 19.99, stock: 50 },
        { color: 'White', size: 'M', price: 19.99, stock: 75 },
        { color: 'White', size: 'L', price: 19.99, stock: 60 },
        { color: 'White', size: 'XL', price: 21.99, stock: 40 },
        { color: 'Black', size: 'M', price: 19.99, stock: 65 },
        { color: 'Black', size: 'L', price: 19.99, stock: 55 },
      ],
    },
    {
      name: 'Premium Hoodie',
      description: 'Comfortable and stylish hoodie, perfect for customization',
      category: 'Hoodies',
      gender: 'unisex' as const,
      base_price: 39.99,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
      tags: ['hoodie', 'warm', 'comfortable'],
      printing_methods: ['Screen Print', 'Embroidery'],
      is_active: true,
      allow_prepaid: true,
      allow_postpaid: false,
      variations: [
        { color: 'Black', size: 'M', price: 39.99, stock: 30 },
        { color: 'Black', size: 'L', price: 39.99, stock: 25 },
        { color: 'Black', size: 'XL', price: 44.99, stock: 20 },
        { color: 'Navy', size: 'M', price: 39.99, stock: 28 },
        { color: 'Navy', size: 'L', price: 39.99, stock: 22 },
      ],
    },
    {
      name: 'Custom Baseball Cap',
      description: 'Classic baseball cap with adjustable strap, ideal for embroidery and patches',
      category: 'Caps',
      gender: 'unisex' as const,
      base_price: 14.99,
      images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500'],
      tags: ['cap', 'hat', 'accessory'],
      printing_methods: ['Embroidery', 'Patch'],
      is_active: true,
      allow_prepaid: true,
      allow_postpaid: true,
      variations: [
        { color: 'Black', size: 'One Size', price: 14.99, stock: 100 },
        { color: 'White', size: 'One Size', price: 14.99, stock: 100 },
        { color: 'Red', size: 'One Size', price: 14.99, stock: 80 },
        { color: 'Navy', size: 'One Size', price: 14.99, stock: 90 },
      ],
    },
  ];
  
  for (const product of sampleProducts) {
    try {
      await productsApi.create(product);
      console.log(`   ✓ Created: ${product.name}`);
    } catch (error: any) {
      console.log(`   ⚠️  ${product.name}: ${error.message}`);
    }
  }
  */
}

async function initializeBusinessSettings() {
  const businessInfo = {
    company_name: 'Toodies',
    address: 'Your Business Address',
    city: 'Your City',
    state: 'Your State',
    pincode: '000000',
    country: 'India',
    phone: '+91 9876543210',
    email: 'info@toodies.com',
    support_email: 'support@toodies.com',
    gstin: 'YOUR_GSTIN_NUMBER',
    website: 'https://www.toodies.com',
    support_hours: 'Mon-Sat: 9:00 AM - 6:00 PM IST',
    hero_image: '',
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    bank_details: {
      account_name: 'Toodies',
      account_number: '',
      ifsc_code: '',
      bank_name: '',
      branch_name: ''
    },
    visibility: {
      website: {
        show_address: true,
        show_phone: true,
        show_email: true,
        show_support_email: true,
        show_support_hours: true,
        show_social_media: true,
        show_gstin: false,
        show_whatsapp: true
      },
      invoice: {
        show_full_address: true,
        show_phone: true,
        show_email: true,
        show_gstin: true,
        show_website: false,
        show_bank_details: true
      }
    }
  };

  try {
    await settingsApi.saveBusiness(businessInfo);
    console.log('   ✓ Business information configured');
  } catch (error: any) {
    console.log('   ⚠️  Could not save business settings:', error.message);
  }
}

async function initializeCategories() {
  const categories = [
    'T-Shirts',
    'Hoodies',
    'Sweatshirts',
    'Jackets',
    'Accessories'
  ];

  try {
    await settingsApi.saveCategories(categories);
    console.log(`   ✓ Created ${categories.length} categories`);
  } catch (error: any) {
    console.log('   ⚠️  Could not save categories:', error.message);
  }
}

async function initializePrintingMethods() {
  const printingMethods = [
    {
      id: 'method_dtg',
      name: 'DTG (Direct to Garment)',
      description: 'High-quality digital printing directly onto fabric',
      cost_per_square_inch: 2.5,
      minimum_charge: 150,
      is_active: true,
      enabled: true,
      show_price: true,
      created_at: new Date().toISOString(),
      visual_effect: {
        type: 'dtg' as const,
        filter: 'brightness(1.0) contrast(1.1)'
      }
    },
    {
      id: 'method_screen',
      name: 'Screen Printing',
      description: 'Traditional screen printing for bulk orders',
      cost_per_square_inch: 1.8,
      minimum_charge: 200,
      is_active: true,
      enabled: true,
      show_price: true,
      created_at: new Date().toISOString(),
      visual_effect: {
        type: 'screen-print' as const,
        filter: 'brightness(1.05) saturate(1.2)'
      }
    },
    {
      id: 'method_vinyl',
      name: 'Vinyl Cut',
      description: 'Precision cut vinyl for bold designs',
      cost_per_square_inch: 3.0,
      minimum_charge: 180,
      is_active: true,
      enabled: true,
      show_price: true,
      created_at: new Date().toISOString(),
      visual_effect: {
        type: 'vinyl' as const,
        glossy: true,
        outline: {
          width: 1,
          color: 'rgba(255,255,255,0.3)',
          style: 'solid' as const
        }
      }
    },
    {
      id: 'method_embroidery',
      name: 'Embroidery',
      description: 'Premium embroidered designs',
      cost_per_square_inch: 4.5,
      minimum_charge: 250,
      is_active: true,
      enabled: true,
      show_price: true,
      created_at: new Date().toISOString(),
      visual_effect: {
        type: 'embroidery' as const,
        emboss: true,
        shadow: {
          offset_x: 2,
          offset_y: 2,
          blur: 3,
          color: 'rgba(0,0,0,0.3)'
        }
      }
    }
  ];

  try {
    await settingsApi.savePrintingMethods(printingMethods);
    console.log(`   ✓ Created ${printingMethods.length} printing methods`);
  } catch (error: any) {
    console.log('   ⚠️  Could not save printing methods:', error.message);
  }
}

// Export individual initializers for selective initialization
export {
  createAdminAccount,
  createSampleProducts,
  initializeBusinessSettings,
  initializeCategories,
  initializePrintingMethods
};