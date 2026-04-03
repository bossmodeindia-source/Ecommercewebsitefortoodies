import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  AlertCircle, 
  WifiOff, 
  RefreshCw, 
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  checkSupabaseConnection, 
  attemptWakeup, 
  getConnectionStatus,
  ConnectionStatus 
} from '../utils/supabaseConnectionRecovery';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

export function SupabaseConnectionBanner() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check connection on mount
    const checkConnection = async () => {
      const result = await checkSupabaseConnection();
      setStatus(result);
    };

    checkConnection();

    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    toast.info('Checking Supabase connection...');
    
    const result = await checkSupabaseConnection();
    setStatus(result);
    setIsChecking(false);

    if (result.status === 'online') {
      toast.success('Supabase is online! ✅');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast.warning(result.message);
    }
  };

  const handleWakeup = async () => {
    setIsWakingUp(true);
    toast.info('Attempting to wake up Supabase...');
    
    const result = await attemptWakeup();
    setStatus(result);
    setIsWakingUp(false);

    if (result.status === 'online') {
      toast.success('Supabase is now online! Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast.error('Could not wake up project automatically. Please resume manually in dashboard.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    toast('Banner dismissed. App continues in localStorage mode.');
  };

  // Don't show if online or dismissed
  if (!status || status.status === 'online' || isDismissed) {
    return null;
  }

  const getBannerColor = () => {
    switch (status.status) {
      case 'paused':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'offline':
        return 'border-red-500/30 bg-red-500/10';
      case 'error':
        return 'border-orange-500/30 bg-orange-500/10';
      default:
        return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  const getIcon = () => {
    switch (status.status) {
      case 'paused':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTitle = () => {
    switch (status.status) {
      case 'paused':
        return '⏸️ Supabase Project Paused';
      case 'offline':
        return '🔌 Supabase Connection Lost';
      case 'error':
        return '⚠️ Supabase Connection Error';
      default:
        return '🔍 Checking Connection...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-3xl w-full px-4"
      >
        <div className={`border-2 ${getBannerColor()} backdrop-blur-xl rounded-2xl p-4 shadow-2xl`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm mb-1">{getTitle()}</h3>
              <p className="text-slate-300 text-xs mb-3">
                {status.message}
              </p>

              <div className="flex flex-wrap gap-2">
                {status.status === 'paused' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleWakeup}
                      disabled={isWakingUp}
                      className="bg-[#d4af37] hover:bg-[#c9a227] text-black text-xs h-8"
                    >
                      {isWakingUp ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                          Waking Up...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5" />
                          Wake Up Project
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
                      className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-xs h-8"
                    >
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                      Open Dashboard
                    </Button>
                  </>
                )}

                {status.status === 'offline' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleManualCheck}
                      disabled={isChecking}
                      className="bg-[#d4af37] hover:bg-[#c9a227] text-black text-xs h-8"
                    >
                      {isChecking ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5" />
                          Retry Connection
                        </>
                      )}
                    </Button>
                    {status.fixUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(status.fixUrl!, '_blank')}
                        className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-xs h-8"
                      >
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        Dashboard
                      </Button>
                    )}
                  </>
                )}

                {status.status === 'error' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleManualCheck}
                      disabled={isChecking}
                      className="bg-[#d4af37] hover:bg-[#c9a227] text-black text-xs h-8"
                    >
                      {isChecking ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5" />
                          Check Again
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Navigate to diagnostic tab
                        const event = new CustomEvent('openDiagnostic');
                        window.dispatchEvent(event);
                        handleDismiss();
                      }}
                      className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-xs h-8"
                    >
                      <AlertCircle className="w-3 h-3 mr-1.5" />
                      Run Diagnostic
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white hover:bg-white/5 text-xs h-8 ml-auto"
                >
                  Dismiss
                </Button>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                  💡 App Status: Fully Functional
                </p>
                <p className="text-[10px] text-slate-400">
                  All features work perfectly using localStorage. Supabase is optional for cloud sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
