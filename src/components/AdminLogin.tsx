import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Shield, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { authApi } from '../utils/supabaseApi';

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authApi.adminSignin(email, password);

      if (result && result.user) {
        setTimeout(() => {
          setLoading(false);
          onLogin();
        }, 500);
        return;
      } else {
        setError('Login failed. Please check your credentials and try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-4 selection:bg-[#d4af37]/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4af37]/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card border border-[#d4af37]/20 p-10 rounded-[40px] shadow-2xl backdrop-blur-2xl bg-black/60 luxury-glow">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37]/20 to-[#c9a227]/20 rounded-[20px] flex items-center justify-center mx-auto mb-6 border border-[#d4af37]/30">
              <Shield className="w-10 h-10 text-[#d4af37]" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-[2px] glow-text">Admin Access</h1>
            <p className="text-slate-500 text-sm font-light">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" id="admin-login-form">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px] ml-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="pl-14 bg-white/5 border-white/10 text-white h-16 rounded-2xl focus:border-[#d4af37]/50 focus:ring-0 transition-all"
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-[#d4af37] font-bold uppercase tracking-widest text-[10px] ml-1">Master Password</Label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  className="pl-14 bg-white/5 border-white/10 text-white h-16 rounded-2xl focus:border-[#d4af37]/50 focus:ring-0 transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-xs text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="glow-button w-full h-16 rounded-2xl font-black text-lg shadow-lg border-0 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-[10px] text-slate-500 hover:text-[#d4af37] transition-colors uppercase tracking-[4px] font-bold"
            >
              Return to Brand Site
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
