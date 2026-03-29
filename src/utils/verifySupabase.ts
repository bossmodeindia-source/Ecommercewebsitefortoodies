/**
 * Supabase Database Verification Script
 * Run this in browser console to verify all 22 tables are accessible
 */

import { supabase } from './supabaseApi';

export async function verifySupabaseTables() {
  console.log('🔍 Verifying Supabase database tables...\n');

  const tables = [
    'users',
    'categories',
    'products',
    'product_variations',
    'orders',
    'order_items',
    'cart_items',
    'custom_designs',
    'saved_customer_designs',
    'printing_methods',
    'three_d_model_configs',
    'coupons',
    'message_templates',
    'popup_messages',
    'chat_conversations',
    'chat_messages',
    'help_articles',
    'business_info',
    'admin_settings',
    'ai_config',
    'invoices',
    'invoice_items',
  ];

  const results: any = {
    success: [],
    failed: [],
    total: tables.length,
  };

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
        results.failed.push({ table, error: error.message });
      } else {
        console.log(`✅ ${table}: Connected`);
        results.success.push(table);
      }
    } catch (err: any) {
      console.error(`❌ ${table}: ${err.message}`);
      results.failed.push({ table, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${results.success.length}/${results.total} tables`);
  console.log(`❌ Failed: ${results.failed.length}/${results.total} tables`);
  console.log('='.repeat(50) + '\n');

  if (results.failed.length > 0) {
    console.log('Failed tables:');
    results.failed.forEach((f: any) => {
      console.log(`  - ${f.table}: ${f.error}`);
    });
  }

  if (results.success.length === results.total) {
    console.log('🎉 All tables are accessible! Your Supabase setup is complete.');
  } else {
    console.log('⚠️  Some tables are not accessible. Check the errors above.');
  }

  return results;
}

export async function checkTableCounts() {
  console.log('📊 Checking table row counts...\n');

  const tables = [
    'users',
    'products',
    'categories',
    'orders',
    'saved_customer_designs',
    'printing_methods',
    'coupons',
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`${table}: ${count} rows`);
      }
    } catch (err: any) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

// Quick test function to run in browser console
export async function quickTest() {
  console.log('🧪 Running quick Supabase test...\n');

  try {
    // Test 1: Check products
    console.log('Test 1: Fetching products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Products test failed:', productsError.message);
    } else {
      console.log(`✅ Found ${products.length} products`);
    }

    // Test 2: Check categories
    console.log('\nTest 2: Fetching categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');

    if (categoriesError) {
      console.error('❌ Categories test failed:', categoriesError.message);
    } else {
      console.log(`✅ Found ${categories.length} categories`);
    }

    // Test 3: Check users (just count)
    console.log('\nTest 3: Checking users table...');
    const { count, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('❌ Users test failed:', usersError.message);
    } else {
      console.log(`✅ Users table has ${count} rows`);
    }

    console.log('\n✅ Quick test completed!');
    return true;
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
}
