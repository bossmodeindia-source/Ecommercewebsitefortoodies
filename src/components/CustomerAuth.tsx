import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogIn, UserPlus, Mail, Phone, Lock, User as UserIcon, KeyRound, ArrowLeft, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import { User } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import tigerLogo from 'figma:asset/404faa741eb4394d917a24330c1566de438eea2b.png';

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
  const [resetMobile, setResetMobile] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageUtils.loginUser(loginEmail, loginPassword);
    if (user) {
      toast.success('Access Granted. Welcome back to the Toodies experience.');
      onLogin(user);
    } else {
      toast.error('Authentication failed. Please verify your credentials.');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
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

    const users = storageUtils.getUsers();
    if (users.some(u => u.email === signupEmail || u.mobile === signupMobile)) {
      toast.error('This identity is already associated with an account.');
      return;
    }

    const user = storageUtils.registerUser(signupEmail, signupMobile, signupPassword, signupName);
    toast.success('Membership activated. Welcome to the world of Toodies.');
    onLogin(user);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageUtils.getUserByMobile(resetMobile);
    if (user) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);
      setResetUserId(user.id);
      setOtpSent(true);
      toast.success('Security code dispatched to your registered mobile.');
    } else {
      toast.error('This mobile number is not in our records.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetOtp || !newPassword || !confirmPassword) {
      toast.error('Please fulfill all security requirements.');
      return;
    }

    if (resetOtp !== generatedOtp) {
      toast.error('Invalid security code.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password confirmation mismatch.');
      return;
    }

    const user = storageUtils.getUserById(resetUserId);
    if (user) {
      storageUtils.updateUserPassword(user.id, newPassword);
      toast.success('Security protocols updated. Password reset successful.');
      setShowForgotPassword(false);
    } else {
      toast.error('Account identity could not be verified.');
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
                      className="w-full h-14 bg-[#d4af37] hover:bg-[#c9a227] text-black font-black text-sm uppercase tracking-[3px] rounded-2xl border-0 shadow-lg shadow-[#d4af37]/20 active:scale-95 transition-all"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
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
                      className="w-full h-14 bg-[#d4af37] hover:bg-[#c9a227] text-black font-black text-sm uppercase tracking-[3px] rounded-2xl border-0 shadow-lg shadow-[#d4af37]/20 transition-all"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
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
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="glass-card border-[#d4af37]/30 bg-black rounded-[32px] max-w-sm">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-4 border border-[#d4af37]/20">
              <KeyRound className="w-6 h-6 text-[#d4af37]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Security Reset</DialogTitle>
            <DialogDescription className="text-slate-500 font-light text-sm uppercase tracking-widest">
              Enter your mobile number to reset access
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-mobile" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Mobile Number</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="reset-mobile"
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={resetMobile}
                    onChange={(e) => setResetMobile(e.target.value)}
                    className="pl-12 bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-[#d4af37]/50 transition-all"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#d4af37] text-black font-black text-xs uppercase tracking-[2px] rounded-xl border-0 shadow-lg shadow-[#d4af37]/10"
              >
                Dispatch Code
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={otpSent} onOpenChange={setOtpSent}>
        <DialogContent className="glass-card border-[#d4af37]/30 bg-black rounded-[32px] max-w-sm">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-4 border border-[#d4af37]/20">
              <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
            </div>
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Identity Verified</DialogTitle>
            <DialogDescription className="text-slate-500 font-light text-sm uppercase tracking-widest">
              Establish your new security credentials
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-otp" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Security Code</Label>
                <Input
                  id="reset-otp"
                  type="text"
                  placeholder="0000"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl text-center text-xl font-black tracking-[8px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] ml-1">Confirm Identity</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                />
              </div>
              <div className="pt-4 space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#d4af37] text-black font-black text-xs uppercase tracking-[2px] rounded-xl border-0"
                >
                  Finalize Access
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  className="w-full text-slate-500 font-bold text-[10px] uppercase tracking-widest"
                  onClick={() => setOtpSent(false)}
                >
                  <ArrowLeft className="w-3 h-3 mr-2" />
                  Back
                </Button>
              </div>
            </form>
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

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}