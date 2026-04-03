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

  // Version check
  console.log('🔧 AdminLogin Component v2.0.0 - Supabase Auth (Secure)');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔑 Attempting admin login via Supabase...');
      
      // Use Supabase API for authentication
      const result = await authApi.adminSignin(email, password);
      
      console.log('📋 Login result received');
      
      if (result && result.user) {
        console.log('✅ Admin login successful - User:', result.user);
        setTimeout(() => {
          setLoading(false);
          onLogin();
        }, 500);
        return;
      } else {
        console.error('❌ Login failed - No user in result');
        setError('Login failed - Please try again');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
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
            <p className="text-slate-500 text-sm font-light">Enter Master Password</p>
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
                  placeholder="Enter email"
                  className="pl-14 bg-white/5 border-white/10 text-white h-16 rounded-2xl focus:border-[#d4af37]/50 focus:ring-0 transition-all"
                  required
                  autoFocus
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
                />
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-red-400 text-xs ml-1">{error}</p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400">
                  <p className="font-bold mb-1">💡 Quick Fix - Copy These Exact Credentials:</p>
                  <div className="bg-black/30 rounded-lg p-2 mb-2 font-mono text-[10px]">
                    <p className="text-white">Email: <span className="text-[#d4af37] select-all">m78787531@gmail.com</span></p>
                    <p className="text-white">Password: <span className="text-[#d4af37] select-all">9886510858@TcbToponeAdmin</span></p>
                  </div>
                  <p className="font-bold mb-1 text-[10px]">⚠️ Common Issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-[10px]">
                    <li>Password is <span className="font-bold">case-sensitive</span>: Capital T, C, T, A</li>
                    <li>No spaces before or after email/password</li>
                    <li>Clear browser cache if still failing</li>
                  </ul>
                  <div className="mt-2 pt-2 border-t border-yellow-500/20">
                    <p className="text-[10px] mb-1">📋 Press F12 to see detailed debug logs</p>
                    <a 
                      href="https://github.com/yourusername/toodies/blob/main/ADMIN_LOGIN_QUICK_FIX.md" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[#d4af37] hover:underline font-bold text-[10px]"
                    >
                      → Complete Troubleshooting Guide
                    </a>
                  </div>
                </div>
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