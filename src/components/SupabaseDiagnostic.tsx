import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { runSupabaseDiagnostic, DiagnosticResult } from '../utils/supabaseDiagnostic';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

export function SupabaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState<{ [key: number]: boolean }>({});

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const diagnosticResults = await runSupabaseDiagnostic();
      setResults(diagnosticResults);
      
      const failedCount = diagnosticResults.filter(r => r.status === 'failed').length;
      if (failedCount === 0) {
        toast.success('All Supabase checks passed! ✅');
      } else {
        toast.warning(`${failedCount} issue(s) found. Check the results below.`);
      }
    } catch (error: any) {
      toast.error('Diagnostic failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const copyResults = () => {
    const text = results.map(r => 
      `${r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '⚠️'} ${r.step}: ${r.message}${r.fix ? `\nFix: ${r.fix}` : ''}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(text);
    toast.success('Results copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      default:
        return null;
    }
  };

  const failedCount = results.filter(r => r.status === 'failed').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const successCount = results.filter(r => r.status === 'success').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Supabase Connection Diagnostic</h2>
          <p className="text-slate-400 text-sm mt-1">
            Run this to identify exactly why Supabase is not connecting
          </p>
        </div>
        
        <Button
          onClick={handleRunDiagnostic}
          disabled={isRunning}
          className="bg-[#d4af37] hover:bg-[#c9a227] text-black"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Diagnostic
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{successCount}</div>
                <div className="text-sm text-slate-400">Passed</div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{warningCount}</div>
                <div className="text-sm text-slate-400">Warnings</div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{failedCount}</div>
                <div className="text-sm text-slate-400">Failed</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Overall Status Banner */}
      {results.length > 0 && (
        <Card className={`p-6 border-2 ${
          failedCount === 0 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-start gap-4">
            {failedCount === 0 ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-500 mb-2">
                    🎉 All Checks Passed!
                  </h3>
                  <p className="text-white/80">
                    Supabase is fully functional and connected. All tables, authentication, 
                    and storage are working correctly.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-500 mb-2">
                    {failedCount} Issue{failedCount !== 1 ? 's' : ''} Found
                  </h3>
                  <p className="text-white/80 mb-3">
                    Your app is still functional (using localStorage), but Supabase needs attention. 
                    Check the failed items below for specific fixes.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={copyResults}
                      variant="outline"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Results
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => window.open('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod', '_blank')}
                      variant="outline"
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Supabase Dashboard
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Detailed Results</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyResults}
              className="text-slate-400 hover:text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
          </div>

          {results.map((result, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`p-4 border ${
                result.status === 'success' 
                  ? 'bg-white/5 border-white/10' 
                  : result.status === 'failed'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-yellow-500/5 border-yellow-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{result.step}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    <p className="text-slate-300 text-sm mb-2">{result.message}</p>
                    
                    {result.fix && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[#d4af37] font-semibold text-sm whitespace-nowrap">🔧 Fix:</span>
                          <div className="text-slate-300 text-sm flex-1 whitespace-pre-line font-mono leading-relaxed">
                            {result.fix}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                          Show technical details
                        </summary>
                        <pre className="mt-2 text-xs bg-black/30 rounded p-3 overflow-x-auto text-slate-300">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isRunning && (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-[#d4af37]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to Diagnose</h3>
            <p className="text-slate-400 mb-6">
              Click "Run Diagnostic" to check your Supabase connection status and identify any issues.
            </p>
            <Button
              onClick={handleRunDiagnostic}
              className="bg-[#d4af37] hover:bg-[#c9a227] text-black"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Diagnostic
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Links */}
      {results.length > 0 && failedCount > 0 && (
        <Card className="bg-white/5 border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Access Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 justify-start"
              onClick={() => window.open('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Supabase Dashboard
            </Button>
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 justify-start"
              onClick={() => window.open('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/editor', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              SQL Editor
            </Button>
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 justify-start"
              onClick={() => window.open('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/settings/api', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              API Settings
            </Button>
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 justify-start"
              onClick={() => window.open('https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/storage/buckets', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Storage Buckets
            </Button>
          </div>
        </Card>
      )}

      {/* Common Fixes */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Common Issues & Fixes</h3>
        <div className="space-y-4">
          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-semibold text-white mb-1">🔴 Project is Paused</h4>
            <p className="text-sm text-slate-400 mb-2">
              Most common issue. Supabase free tier pauses projects after 7 days of inactivity.
            </p>
            <p className="text-sm text-[#d4af37]">
              Fix: Go to dashboard and click "Resume Project" (takes 2-3 minutes)
            </p>
          </div>

          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-semibold text-white mb-1">🔴 Tables Not Found</h4>
            <p className="text-sm text-slate-400 mb-2">
              Database migration hasn't been run yet.
            </p>
            <p className="text-sm text-[#d4af37]">
              Fix: Run /database/fresh-setup-v2.sql in SQL Editor
            </p>
          </div>

          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-semibold text-white mb-1">🔴 Network Error</h4>
            <p className="text-sm text-slate-400 mb-2">
              Cannot reach Supabase servers. Could be firewall, VPN, or connectivity issue.
            </p>
            <p className="text-sm text-[#d4af37]">
              Fix: Disable VPN, check firewall, or try different network
            </p>
          </div>

          <div className="border-l-2 border-[#d4af37] pl-4">
            <h4 className="font-semibold text-white mb-1">🟡 Storage Buckets Missing</h4>
            <p className="text-sm text-slate-400 mb-2">
              Required storage buckets not created (designs, products).
            </p>
            <p className="text-sm text-[#d4af37]">
              Fix: Create buckets in Supabase Dashboard → Storage
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}