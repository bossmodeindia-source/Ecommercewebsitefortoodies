import React from 'react';
import { AlertCircle, Database, Copy, CheckCircle } from 'lucide-react';

export function DatabaseSetupGuide() {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      // In a real scenario, you'd copy the actual SQL file content
      await navigator.clipboard.writeText('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/sql');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Database Setup Required</h1>
              <p className="text-zinc-400 text-sm">Initialize your Toodies database tables</p>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium mb-1">Database tables not found</p>
                <p className="text-red-300/70 text-sm">
                  Your Supabase database needs to be initialized with the Toodies schema.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Open Supabase SQL Editor</h3>
                  <p className="text-zinc-400 text-sm mb-3">
                    Click the button below to open your project's SQL editor
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2 rounded-lg hover:bg-[#C5A028] transition-colors text-sm font-medium"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy SQL Editor Link
                      </>
                    )}
                  </button>
                  <a
                    href="https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/sql"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium"
                  >
                    Open SQL Editor →
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="w-full">
                  <h3 className="text-white font-medium mb-1">Copy & Run SQL Script</h3>
                  <p className="text-zinc-400 text-sm mb-3">
                    Copy all contents from <code className="bg-zinc-800 px-2 py-0.5 rounded text-xs">/database/fresh-setup-v2.sql</code>
                  </p>
                  <div className="bg-black border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-400">
                    <div className="text-zinc-500">-- Copy all 671 lines from:</div>
                    <div className="text-[#D4AF37]">/database/fresh-setup-v2.sql</div>
                    <div className="text-zinc-500 mt-2">-- Then paste into SQL Editor and click "Run"</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Refresh the Page</h3>
                  <p className="text-zinc-400 text-sm">
                    After the SQL completes successfully (~15 seconds), refresh this page
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What Gets Created */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-3">📋 What Gets Created:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
                20 Database Tables
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
                Row Level Security
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
                Admin Auto-Trigger
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
                Optimized Indexes
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs text-center">
              Need detailed instructions? Check <code className="bg-zinc-800 px-2 py-0.5 rounded">/database/SETUP_INSTRUCTIONS.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
