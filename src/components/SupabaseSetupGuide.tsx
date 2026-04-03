import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  CheckCircle, Copy, ExternalLink, Database, ShieldCheck,
  ShoppingCart, Key, ChevronDown, ChevronUp, AlertTriangle,
  Sparkles, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const SQL_SCRIPT = `-- Run this ONCE in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/sql/new

-- See the full script at:
-- /database/rls-admin-and-cart-fix.sql`;

interface Step {
  id: number;
  title: string;
  description: string;
  details: string[];
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Open the Supabase SQL Editor',
    description: 'Navigate to your Supabase project\'s SQL editor.',
    details: [
      'Go to: https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/sql/new',
      'Or: Dashboard → SQL Editor → New Query',
      'Make sure you are logged in as the project owner',
    ],
    icon: ExternalLink,
    badge: 'Required',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  {
    id: 2,
    title: 'Run rls-admin-and-cart-fix.sql',
    description: 'Copy the entire contents of /database/rls-admin-and-cart-fix.sql and paste into the SQL editor, then click Run.',
    details: [
      'Creates the admin (m78787531@gmail.com) directly in auth.users — no manual user creation needed',
      'Creates the auth.identities row so email+password login works immediately',
      'Sets role = admin in public.users',
      'Uses DROP FUNCTION … CASCADE to remove is_admin() AND all its dependent policies in one shot — this is why the previous script failed without CASCADE',
      'Drops remaining old policies via a clean loop, then recreates 30+ fresh ones',
      'Anon key → can read products, categories, printing methods, help articles, etc.',
      'Authenticated customers → full CRUD on their own cart, orders, designs',
      'Authenticated admins → full access on every table',
      'Adds cart_items UNIQUE constraint (user + product + variation) needed by upsert',
      'Adds upsert_cart_item() SQL function for atomic cart updates',
      'Recreates the on_auth_user_created trigger',
    ],
    icon: Database,
    badge: 'Run Once',
    badgeColor: 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30',
  },
  {
    id: 3,
    title: 'Verify the output',
    description: 'The script ends with a SELECT that shows 3 confirmation rows.',
    details: [
      '✅ Admin in auth.users → shows the admin UUID',
      '✅ Admin in public.users → shows the same UUID',
      '✅ Total RLS policies → should be ≥ 30',
      'If any row shows NULL instead of a UUID, check for errors above the SELECT',
    ],
    icon: CheckCircle,
    badge: 'Verify',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    id: 4,
    title: 'Test admin login via Supabase Auth',
    description: 'After running the SQL, the admin can now log in with a real Supabase session.',
    details: [
      'Go to the app and log in as admin: m78787531@gmail.com / 9886510858@TcbToponeAdmin',
      'adminSignin() tries Supabase Auth first; it will now succeed with a real JWT',
      'The JWT contains auth.uid() which matches is_admin() in RLS policies',
      'All admin write operations (products, categories, orders) will now go through Supabase',
      'The local bypass still works as fallback if Supabase Auth is unreachable',
    ],
    icon: Key,
    badge: 'Test',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 5,
    title: 'Cart persists across devices',
    description: 'CustomerDashboard now syncs the cart to Supabase on every mutation.',
    details: [
      'On app load: cartApi.getCart() pulls from Supabase, merged with any local cart',
      'Add to cart → cartApi.upsert() fires async (localStorage stays source of truth)',
      'Update quantity → cartApi.upsert() with new qty',
      'Remove item → cartApi.removeByProduct()',
      'After order placed → cartApi.clearAll() wipes the Supabase cart',
      'Only syncs items with valid UUID product IDs (Supabase-sourced products)',
      'localStorage-only products (non-UUID IDs) are silently kept local only',
    ],
    icon: ShoppingCart,
    badge: 'Auto',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
];

export function SupabaseSetupGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(2);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopiedSql(true);
    toast.success('SQL hint copied — open /database/rls-admin-and-cart-fix.sql for the full script');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleOpenSupabase = () => {
    window.open('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/sql/new', '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 rounded-[28px] bg-gradient-to-br from-[#d4af37]/10 to-transparent border border-[#d4af37]/20">
        <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/15 flex items-center justify-center border border-[#d4af37]/30 shrink-0">
          <Database className="w-6 h-6 text-[#d4af37]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white tracking-tight mb-1">
            Supabase RLS + Cart Setup
          </h2>
          <p className="text-slate-400 text-sm font-light">
            One SQL script unlocks real admin Supabase Auth, correct RLS policies for all 20 tables,
            and persistent cross-device cart for customers.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] uppercase tracking-wider">
              <CheckCircle className="w-3 h-3 mr-1" /> RLS Fixed
            </Badge>
            <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20 text-[10px] uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 mr-1" /> Admin Auth
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase tracking-wider">
              <ShoppingCart className="w-3 h-3 mr-1" /> Cart Sync
            </Badge>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 text-sm font-bold mb-1">Run this script once — it's idempotent</p>
          <p className="text-amber-500/80 text-xs font-light">
            The script uses <code className="bg-amber-500/10 px-1 rounded">ON CONFLICT DO UPDATE</code> and
            <code className="bg-amber-500/10 px-1 ml-1 rounded">DROP POLICY IF EXISTS</code> guards throughout,
            so it's safe to re-run if something fails midway.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleOpenSupabase}
          className="glow-button h-12 px-6 rounded-xl border-0 font-bold text-sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Supabase SQL Editor
        </Button>
        <Button
          variant="outline"
          onClick={handleCopySql}
          className="h-12 px-6 rounded-xl border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 font-bold text-sm"
        >
          {copiedSql ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copiedSql ? 'Copied!' : 'Copy SQL hint'}
        </Button>
      </div>

      {/* File path callout */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
        <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" />
        <p className="text-slate-400 text-xs">
          Full SQL file lives at{' '}
          <code className="text-[#d4af37] bg-[#d4af37]/10 px-1.5 py-0.5 rounded text-xs">
            /database/rls-admin-and-cart-fix.sql
          </code>
          {' '}in the project. Copy its entire content into the Supabase SQL Editor.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const isExpanded = expandedStep === step.id;
          const Icon = step.icon;

          return (
            <Card
              key={step.id}
              className={`glass-card border rounded-[20px] transition-all duration-200 cursor-pointer ${
                isExpanded
                  ? 'border-[#d4af37]/30 bg-[#d4af37]/[0.03]'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10'
              }`}
              onClick={() => setExpandedStep(isExpanded ? null : step.id)}
            >
              <CardContent className="p-0">
                {/* Header row */}
                <div className="flex items-center gap-4 p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    isExpanded
                      ? 'bg-[#d4af37]/15 border-[#d4af37]/30'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${isExpanded ? 'text-[#d4af37]' : 'text-slate-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Step {step.id}
                      </span>
                      <Badge className={`text-[10px] uppercase tracking-wider border px-2 py-0 h-5 ${step.badgeColor}`}>
                        {step.badge}
                      </Badge>
                    </div>
                    <p className={`font-bold text-sm ${isExpanded ? 'text-white' : 'text-slate-300'}`}>
                      {step.title}
                    </p>
                    {!isExpanded && (
                      <p className="text-slate-500 text-xs font-light mt-0.5 truncate">
                        {step.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-[#d4af37]" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-white/5">
                    <p className="text-slate-400 text-sm font-light mb-4 mt-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                          <ArrowRight className="w-3 h-3 text-[#d4af37] shrink-0 mt-0.5" />
                          <span className="font-light leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary table */}
      <Card className="glass-card border-white/5 bg-white/[0.02] rounded-[20px]">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-white">What the script changes</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Tables with RLS', value: '20', color: 'text-[#d4af37]' },
              { label: 'Policies created', value: '≥30', color: 'text-green-400' },
              { label: 'Admin created in auth.users', value: '1', color: 'text-blue-400' },
              { label: 'SQL functions added', value: '3', color: 'text-purple-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-500 text-xs font-light">{item.label}</span>
                <span className={`font-black text-lg ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}