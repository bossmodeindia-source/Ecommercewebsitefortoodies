import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogIn, UserPlus, Mail, Phone, Lock, User as UserIcon, KeyRound, ArrowLeft, FileText, CheckCircle, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import { User } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import tigerLogo from 'figma:asset/404faa741eb4394d917a24330c1566de438eea2b.png';
import { authApi } from '../utils/supabaseApi';

interface CustomerAuthProps {
  onLogin: (user: User) => void;
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export function CustomerAuth({ onLogin, onPrivacyClick, onTermsClick }: CustomerAuthProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Try Supabase Auth first
      const result = await authApi.customerSignin(loginEmail, loginPassword);
      toast.success('Access Granted. Welcome back to the Toodies experience.');
      onLogin(result.user);
    } catch (supabaseError: any) {
      // Fallback to localStorage
      try {
        const user = storageUtils.loginUser(loginEmail, loginPassword);
        if (user) {
          toast.success('Access Granted. Welcome back to the Toodies experience.');
          onLogin(user);
        } else {
          toast.error(supabaseError?.message || 'Authentication failed. Please verify your credentials.');
        }
      } catch {
        toast.error(supabaseError?.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupMobile || !signupPassword || !signupName) {
      toast.error('Please complete all fields to integrate with our platform.');
      return;
    }

    if (!termsAccepted) {
      toast.error('Acceptance of Terms is mandatory for membership.');
      setShowTermsDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      // Try Supabase Auth first
      const result = await authApi.customerSignup(signupEmail, signupPassword, signupName, signupMobile);
      toast.success('Membership activated. Welcome to the world of Toodies.');
      onLogin(result.user);
    } catch (supabaseError: any) {
      // Fallback to localStorage
      try {
        const users = storageUtils.getUsers();
        if (users.some((u: any) => u.email === signupEmail || u.mobile === signupMobile)) {
          toast.error('This identity is already associated with an account.');
          return;
        }
        const user = storageUtils.registerUser(signupEmail, signupMobile, signupPassword, signupName);
        toast.success('Membership activated. Welcome to the world of Toodies.');
        onLogin(user);
      } catch {
        toast.error(supabaseError?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestPasswordReset(resetEmail);
      setResetEmailSent(true);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-4 selection:bg-[#d4af37]/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#c9a227]/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card border-[#d4af37]/20 rounded-[32px] overflow-hidden shadow-2xl luxury-glow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-24 h-24 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center mb-4 border border-[#d4af37]/20">
              <img src={tigerLogo} alt="Toodies" className="w-20 h-20 object-contain" />
            </div>
            <CardTitle className="text-3xl font-black text-white tracking-tight uppercase">Welcome to Toodies</CardTitle>
            <CardDescription className="text-slate-500 font-light text-sm mt-2 uppercase tracking-[2px]">
              Login or create an account to start shopping
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
                <TabsTrigger 
                  value="login"
                  className="rounded-xl data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-slate-400 font-bold uppercase text-[10px] tracking-widest transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-xl data-[state=active]:bg-[#d4af37] data-[state=active]:text-black text-slate-400 font-bold uppercase text-[10px] tracking-widest transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Email or Mobile Number</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" />
                      <Input
                        id="login-email"
                        type="text"
                        placeholder="email@example.com or mobile"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#d4af37]/50 h-14 rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#d4af37]/50 h-14 rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-14 bg-[#d4af37] hover:bg-[#c9a227] text-black font-black text-sm uppercase tracking-[3px] rounded-2xl border-0 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                      {isLoading ? 'Authenticating...' : 'Login'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full h-14 border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 font-bold text-xs uppercase tracking-[2px] rounded-2xl transition-all"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      Forgot Password
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="email@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#d4af37]/50 h-12 rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Mobile Number</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" />
                      <Input
                        id="signup-mobile"
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={signupMobile}
                        onChange={(e) => setSignupMobile(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#d4af37]/50 h-12 rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Full Name</Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#d4af37]/50 h-12 rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#d4af37] transition-colors" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#d4af37]/50 h-12 rounded-2xl transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-14 bg-[#d4af37] hover:bg-[#c9a227] text-black font-black text-sm uppercase tracking-[3px] rounded-2xl border-0 shadow-lg shadow-[#d4af37]/20 transition-all"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-8 text-center px-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                By signing up, you agree to our{' '}
                <button onClick={onTermsClick} className="text-[#d4af37] hover:text-white transition-colors underline decoration-[#d4af37]/30">
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button onClick={onPrivacyClick} className="text-[#d4af37] hover:text-white transition-colors underline decoration-[#d4af37]/30">
                  Privacy Policy
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => { setShowForgotPassword(open); if (!open) { setResetEmail(''); setResetEmailSent(false); } }}>
        <DialogContent className="glass-card border-[#d4af37]/30 bg-black rounded-[32px] max-w-sm">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-4 border border-[#d4af37]/20">
              <KeyRound className="w-6 h-6 text-[#d4af37]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Security Reset</DialogTitle>
            <DialogDescription className="text-slate-500 font-light text-sm uppercase tracking-widest">
              {resetEmailSent ? 'Check your inbox' : 'Enter your email to reset access'}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            {resetEmailSent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-slate-300 text-sm">
                  A password reset link has been sent to <span className="text-[#d4af37] font-bold">{resetEmail}</span>. Please check your inbox and follow the instructions.
                </p>
                <Button
                  onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); setResetEmail(''); }}
                  className="w-full h-12 bg-[#d4af37] text-black font-black text-xs uppercase tracking-[2px] rounded-xl border-0"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="email@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-12 bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-[#d4af37]/50 transition-all"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 bg-[#d4af37] text-black font-black text-xs uppercase tracking-[2px] rounded-xl border-0 shadow-lg shadow-[#d4af37]/10"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest"
                >
                  <ArrowLeft className="w-3 h-3 mr-2" />
                  Back to Login
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="glass-card border-[#d4af37]/30 bg-black max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-[32px]">
          <DialogHeader className="pb-4 border-b border-white/5">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#d4af37]" />
              Membership Protocol
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-light text-sm uppercase tracking-widest">
              Please review our bespoke service conditions
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-slate-400 text-sm font-light py-6 custom-scrollbar">
            <section>
              <h3 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] mb-3">1. Executive Summary</h3>
              <p className="leading-relaxed">
                By entering the Toodies ecosystem, you acknowledge that our high-end custom apparel services are provided under premium conditions designed for the discerning individual.
              </p>
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] mb-3">2. Identity Management</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                  <span>You warrant that all profile data is authentic and precisely maintained.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                  <span>Account security is the sole responsibility of the member.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] mb-3">3. Bespoke Intellectual Property</h3>
              <p className="leading-relaxed mb-3">
                Creativity is the heart of Toodies. You maintain ownership of your concepts while granting us the necessary license for artisanal production.
              </p>
              <div className="p-4 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-2xl italic text-[13px] text-slate-300">
                "Custom masterpieces enter production immediately upon validation and cannot be retracted."
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] mb-3">4. Artisanal Standards & Logistics</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                  <span>Bespoke orders undergo a 7-10 day curation phase before dispatch.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                  <span>Premium shipping ensures your statement piece arrives in pristine condition.</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Checkbox
                id="terms-accept-dialog"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="w-5 h-5 rounded border-[#d4af37]/50 data-[state=checked]:bg-[#d4af37] data-[state=checked]:text-black"
              />
              <Label htmlFor="terms-accept-dialog" className="text-xs font-bold text-slate-300 cursor-pointer flex-1 uppercase tracking-tight">
                I accept the membership protocols and wish to proceed with integration.
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowTermsDialog(false)}
                className="flex-1 h-12 text-slate-500 font-bold uppercase tracking-widest text-[10px]"
              >
                Decline
              </Button>
              <Button
                type="button"
                disabled={!termsAccepted}
                onClick={() => {
                  if (termsAccepted) {
                    setShowTermsDialog(false);
                    toast.success('Protocol Accepted. Welcome aboard.');
                  }
                }}
                className="flex-1 h-12 bg-[#d4af37] text-black font-black uppercase tracking-[2px] text-[10px] rounded-xl border-0 disabled:opacity-30"
              >
                Validate Membership
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}