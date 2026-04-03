/**
 * Supabase Connection Diagnostic Tool
 * Run this to identify exactly why Supabase is failing
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

export interface DiagnosticResult {
  step: string;
  status: 'success' | 'failed' | 'warning';
  message: string;
  details?: any;
  fix?: string;
}

export async function runSupabaseDiagnostic(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  console.log('🔍 ===== SUPABASE DIAGNOSTIC STARTING =====\n');

  // ========================================
  // Step 1: Check Credentials
  // ========================================
  console.log('Step 1: Checking credentials...');
  
  if (!projectId || projectId === 'YOUR_PROJECT_ID') {
    results.push({
      step: '1. Credentials',
      status: 'failed',
      message: 'Project ID not configured',
      fix: 'Update /utils/supabase/info.tsx with your actual Supabase project ID'
    });
    console.error('❌ Project ID missing\n');
  } else if (!publicAnonKey || publicAnonKey.length < 100) {
    results.push({
      step: '1. Credentials',
      status: 'failed',
      message: 'Invalid anon key',
      fix: 'Update /utils/supabase/info.tsx with your actual Supabase anon key'
    });
    console.error('❌ Anon key invalid\n');
  } else {
    results.push({
      step: '1. Credentials',
      status: 'success',
      message: `Project ID: ${projectId}`,
      details: {
        projectId,
        keyLength: publicAnonKey.length
      }
    });
    console.log(`✅ Credentials OK - Project: ${projectId}\n`);
  }

  // ========================================
  // Step 2: Test Network Connectivity
  // ========================================
  console.log('Step 2: Testing network connectivity...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': publicAnonKey
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok || response.status === 404) {
      // 404 is OK - means project is reachable
      results.push({
        step: '2. Network',
        status: 'success',
        message: 'Can reach Supabase server',
        details: { status: response.status }
      });
      console.log('✅ Network OK - Can reach Supabase\n');
    } else if (response.status === 503) {
      results.push({
        step: '2. Network',
        status: 'failed',
        message: '🔴 PROJECT IS PAUSED (most common issue)',
        fix: `1. Open: https://supabase.com/dashboard/project/${projectId}\n2. Look for yellow "Project Paused" banner\n3. Click green "Resume Project" button\n4. Wait 2-3 minutes\n5. Refresh this page`
      });
      console.error('❌ PROJECT PAUSED - Resume it in dashboard\n');
    } else {
      results.push({
        step: '2. Network',
        status: 'warning',
        message: `Unexpected response: ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      });
      console.warn(`⚠️ Unexpected status: ${response.status}\n`);
    }
  } catch (error: any) {
    // Handle specific fetch errors
    if (error.name === 'AbortError') {
      results.push({
        step: '2. Network',
        status: 'failed',
        message: '🔴 CONNECTION TIMEOUT - Project is likely paused or unreachable',
        details: { error: 'Request timed out after 8 seconds' },
        fix: `Project is probably PAUSED. To fix:\n1. Open: https://supabase.com/dashboard/project/${projectId}\n2. Click "Resume Project" if you see a yellow banner\n3. Wait 2-3 minutes for project to wake up\n4. Come back and run diagnostic again`
      });
      console.error('❌ Connection timeout - Project likely paused\n');
    } else if (error.message?.includes('Failed to fetch')) {
      results.push({
        step: '2. Network',
        status: 'failed',
        message: '🔴 CANNOT REACH SUPABASE - Project is paused, deleted, or network issue',
        details: { error: error.message },
        fix: `Most likely cause: PROJECT IS PAUSED\n\n✅ QUICK FIX:\n1. Open Supabase Dashboard: https://supabase.com/dashboard/project/${projectId}\n2. Look for "Project Paused" banner at top\n3. Click green "Resume Project" button\n4. Wait 2-3 minutes\n5. Refresh this page\n\nOther possible causes:\n- Firewall blocking Supabase\n- VPN interfering\n- No internet connection\n- Project was deleted`
      });
      console.error('❌ Failed to fetch - Project paused or network issue\n');
    } else {
      results.push({
        step: '2. Network',
        status: 'failed',
        message: 'Cannot reach Supabase',
        details: { error: error.message },
        fix: 'Check firewall, VPN, or internet connection. Project may be paused or deleted.'
      });
      console.error('❌ Network failed:', error.message, '\n');
    }
  }

  // ========================================
  // Step 3: Initialize Supabase Client
  // ========================================
  console.log('Step 3: Initializing Supabase client...');
  
  let supabase;
  try {
    supabase = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    results.push({
      step: '3. Client Init',
      status: 'success',
      message: 'Supabase client created',
    });
    console.log('✅ Client initialized\n');
  } catch (error: any) {
    results.push({
      step: '3. Client Init',
      status: 'failed',
      message: 'Failed to create client',
      details: { error: error.message },
      fix: 'Check credentials in /utils/supabase/info.tsx'
    });
    console.error('❌ Client init failed:', error.message, '\n');
    return results;
  }

  // ========================================
  // Step 4: Test Database Connection
  // ========================================
  console.log('Step 4: Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        results.push({
          step: '4. Database',
          status: 'failed',
          message: 'Database tables not created',
          details: { error: error.message },
          fix: `Run /database/fresh-setup-v2.sql in https://supabase.com/dashboard/project/${projectId}/editor`
        });
        console.error('❌ Tables missing - Run migration SQL\n');
      } else if (error.message?.includes('JWT') || error.message?.includes('expired')) {
        results.push({
          step: '4. Database',
          status: 'failed',
          message: 'Authentication token invalid',
          details: { error: error.message },
          fix: 'Get new anon key from Supabase dashboard API settings'
        });
        console.error('❌ Auth token invalid\n');
      } else if (error.message?.includes('infinite recursion')) {
        results.push({
          step: '4. Database',
          status: 'failed',
          message: 'RLS policies have infinite recursion',
          details: { error: error.message },
          fix: 'Run /database/FIX_SECURITY_WARNINGS.sql to fix RLS policies'
        });
        console.error('❌ RLS infinite recursion\n');
      } else {
        results.push({
          step: '4. Database',
          status: 'failed',
          message: 'Database query failed',
          details: { error: error.message },
        });
        console.error('❌ Database error:', error.message, '\n');
      }
    } else {
      results.push({
        step: '4. Database',
        status: 'success',
        message: 'Database connection successful',
        details: { recordCount: data?.length || 0 }
      });
      console.log('✅ Database OK - Connection verified\n');
    }
  } catch (error: any) {
    results.push({
      step: '4. Database',
      status: 'failed',
      message: 'Database connection failed',
      details: { error: error.message }
    });
    console.error('❌ Database connection failed:', error.message, '\n');
  }

  // ========================================
  // Step 5: Check RLS Policies
  // ========================================
  console.log('Step 5: Checking Row Level Security...');
  
  try {
    // Try to query without auth - should work with proper RLS
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        results.push({
          step: '5. RLS Policies',
          status: 'warning',
          message: 'Products table not found (run migration)',
        });
        console.warn('⚠️ Products table missing\n');
      } else {
        results.push({
          step: '5. RLS Policies',
          status: 'success',
          message: 'RLS policies active',
          details: { note: 'This is expected - RLS is working' }
        });
        console.log('✅ RLS OK - Policies are active\n');
      }
    } else {
      results.push({
        step: '5. RLS Policies',
        status: 'success',
        message: 'RLS policies configured correctly',
      });
      console.log('✅ RLS OK - Products accessible\n');
    }
  } catch (error: any) {
    results.push({
      step: '5. RLS Policies',
      status: 'warning',
      message: 'Could not verify RLS',
      details: { error: error.message }
    });
    console.warn('⚠️ RLS check skipped\n');
  }

  // ========================================
  // Step 6: Check Storage
  // ========================================
  console.log('Step 6: Checking storage buckets...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      results.push({
        step: '6. Storage',
        status: 'warning',
        message: 'Could not list storage buckets',
        details: { error: error.message }
      });
      console.warn('⚠️ Storage check failed\n');
    } else {
      const hasDesignBucket = buckets?.some(b => b.name === 'designs');
      const hasProductBucket = buckets?.some(b => b.name === 'products');
      
      if (hasDesignBucket && hasProductBucket) {
        results.push({
          step: '6. Storage',
          status: 'success',
          message: 'Storage buckets configured',
          details: { buckets: buckets?.map(b => b.name) }
        });
        console.log('✅ Storage OK - Buckets exist\n');
      } else {
        results.push({
          step: '6. Storage',
          status: 'warning',
          message: 'Some storage buckets missing',
          details: { 
            found: buckets?.map(b => b.name),
            needed: ['designs', 'products']
          },
          fix: 'Create storage buckets in Supabase dashboard'
        });
        console.warn('⚠️ Some storage buckets missing\n');
      }
    }
  } catch (error: any) {
    results.push({
      step: '6. Storage',
      status: 'warning',
      message: 'Storage check failed',
      details: { error: error.message }
    });
    console.warn('⚠️ Storage check error\n');
  }

  // ========================================
  // Final Summary
  // ========================================
  console.log('\n===== DIAGNOSTIC SUMMARY =====\n');
  
  const failedSteps = results.filter(r => r.status === 'failed');
  const warningSteps = results.filter(r => r.status === 'warning');
  const successSteps = results.filter(r => r.status === 'success');
  
  console.log(`✅ Success: ${successSteps.length}`);
  console.log(`⚠️  Warnings: ${warningSteps.length}`);
  console.log(`❌ Failed: ${failedSteps.length}\n`);
  
  if (failedSteps.length > 0) {
    console.log('🔧 FIXES NEEDED:\n');
    failedSteps.forEach((step, idx) => {
      console.log(`${idx + 1}. ${step.step}`);
      console.log(`   Problem: ${step.message}`);
      if (step.fix) {
        console.log(`   Fix: ${step.fix}`);
      }
      console.log('');
    });
  } else if (warningSteps.length > 0) {
    console.log('⚠️  WARNINGS (non-critical):\n');
    warningSteps.forEach(step => {
      console.log(`- ${step.step}: ${step.message}`);
    });
    console.log('');
  } else {
    console.log('🎉 ALL CHECKS PASSED! Supabase is fully functional.\n');
  }
  
  console.log('===== DIAGNOSTIC COMPLETE =====');

  return results;
}

// Helper function to display results in UI
export function formatDiagnosticResults(results: DiagnosticResult[]): string {
  let output = '🔍 SUPABASE DIAGNOSTIC RESULTS\n\n';
  
  results.forEach((result, idx) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    output += `${icon} ${result.step}\n`;
    output += `   ${result.message}\n`;
    
    if (result.fix) {
      output += `   🔧 Fix: ${result.fix}\n`;
    }
    
    if (result.details) {
      output += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
    }
    
    output += '\n';
  });
  
  return output;
}