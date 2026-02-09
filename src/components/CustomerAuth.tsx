import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogIn, UserPlus, Mail, Phone, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import { User } from '../types';

interface CustomerAuthProps {
  onLogin: (user: User) => void;
}

export function CustomerAuth({ onLogin }: CustomerAuthProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageUtils.loginUser(loginEmail, loginPassword);
    if (user) {
      toast.success('Login successful!');
      onLogin(user);
    } else {
      toast.error('Invalid credentials');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupMobile || !signupPassword) {
      toast.error('Please fill all fields');
      return;
    }

    const users = storageUtils.getUsers();
    if (users.some(u => u.email === signupEmail || u.mobile === signupMobile)) {
      toast.error('Email or mobile already registered');
      return;
    }

    const user = storageUtils.registerUser(signupEmail, signupMobile, signupPassword);
    toast.success('Account created successfully!');
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] relative overflow-hidden p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card border-2 border-cyan-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-cyan-100 glow-text">Welcome to Toodies</CardTitle>
            <CardDescription className="text-slate-300 text-base mt-2">
              Login or create an account to start shopping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#0f172a]/50 border border-cyan-500/20">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-cyan-100">Email or Mobile Number</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <Input
                        id="login-email"
                        type="text"
                        placeholder="email@example.com or mobile"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-cyan-100">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0 py-6 text-lg rounded-xl"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-cyan-100">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="email@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile" className="text-cyan-100">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <Input
                        id="signup-mobile"
                        type="tel"
                        placeholder="+1234567890"
                        value={signupMobile}
                        onChange={(e) => setSignupMobile(e.target.value)}
                        className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-cyan-100">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white glow-button border-0 py-6 text-lg rounded-xl"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
