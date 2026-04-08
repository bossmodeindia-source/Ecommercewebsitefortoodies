import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { User, Mail, Phone, MapPin, Shield, CheckCircle2, XCircle, Edit2, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { storageUtils } from '../utils/storage';
import { User as UserType } from '../types';
import { toast } from 'sonner@2.0.3';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';

interface CustomerProfileProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
}

export function CustomerProfile({ user, onUpdate }: CustomerProfileProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [address, setAddress] = useState(user.address || '');
  
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [verificationType, setVerificationType] = useState<'email' | 'mobile'>('email');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleSaveName = () => {
    const updatedUser = { ...user, name };
    storageUtils.updateCurrentUser(updatedUser);
    onUpdate(updatedUser);
    setIsEditingName(false);
    toast.success('Name updated successfully!');
  };

  const handleSaveAddress = () => {
    const updatedUser = { ...user, address };
    storageUtils.updateCurrentUser(updatedUser);
    onUpdate(updatedUser);
    setIsEditingAddress(false);
    toast.success('Address updated successfully!');
  };

  const generateOtp = () => {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    return otp;
  };

  const handleVerifyEmail = () => {
    const otp = generateOtp();
    setVerificationType('email');
    setOtp('');
    setShowOtpDialog(true);
    
    // OTP generated in-memory for mock verification flow
    toast.info(`Verification code sent to ${user.email}`);
  };

  const handleVerifyMobile = () => {
    const otp = generateOtp();
    setVerificationType('mobile');
    setOtp('');
    setShowOtpDialog(true);
    
    toast.info(`Verification code sent to ${user.mobile}`);
  };

  const handleSubmitOtp = () => {
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    if (otp === generatedOtp) {
      const updatedUser = {
        ...user,
        emailVerified: verificationType === 'email' ? true : user.emailVerified,
        mobileVerified: verificationType === 'mobile' ? true : user.mobileVerified
      };
      
      storageUtils.updateCurrentUser(updatedUser);
      onUpdate(updatedUser);
      setShowOtpDialog(false);
      setOtp('');
      
      toast.success(`${verificationType === 'email' ? 'Email' : 'Mobile'} verified successfully!`);
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="glass-card border-2 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-cyan-100 flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            My Profile
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your account information and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-cyan-100 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Full Name
              </Label>
              {!isEditingName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500"
                />
                <Button
                  onClick={handleSaveName}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingName(false);
                    setName(user.name || '');
                  }}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-slate-300 text-lg">
                {user.name || <span className="text-slate-500 italic">Not set</span>}
              </p>
            )}
          </div>

          {/* Email Section */}
          <div className="space-y-3">
            <Label className="text-cyan-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              Email Address
            </Label>
            <div className="flex items-center gap-3">
              <p className="text-slate-300 text-lg flex-1">{user.email}</p>
              {user.emailVerified ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="border-red-500/30 text-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Verified
                  </Badge>
                  <Button
                    onClick={handleVerifyEmail}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Section */}
          <div className="space-y-3">
            <Label className="text-cyan-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              Mobile Number
            </Label>
            <div className="flex items-center gap-3">
              <p className="text-slate-300 text-lg flex-1">{user.mobile}</p>
              {user.mobileVerified ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="border-red-500/30 text-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Verified
                  </Badge>
                  <Button
                    onClick={handleVerifyMobile}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-cyan-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Shipping Address
              </Label>
              {!isEditingAddress && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingAddress(true)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {isEditingAddress ? (
              <div className="space-y-2">
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete shipping address"
                  className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 min-h-24"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveAddress}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Address
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingAddress(false);
                      setAddress(user.address || '');
                    }}
                    className="border-slate-700 text-slate-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-300 text-lg whitespace-pre-wrap">
                {user.address || <span className="text-slate-500 italic">No address added yet</span>}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="glass-card border-2 border-cyan-500/10">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-100">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-400">Account ID</span>
            <span className="text-slate-300 font-mono text-sm">{user.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-400">Total Orders</span>
            <span className="text-cyan-400 font-bold">{user.orders.length}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400">Cart Items</span>
            <span className="text-cyan-400 font-bold">{user.cart.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="glass-card border-2 border-cyan-500/30 bg-[#0a0e1a]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-100 flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              Verify {verificationType === 'email' ? 'Email' : 'Mobile Number'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the 6-digit OTP sent to your {verificationType === 'email' ? 'email' : 'mobile number'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center"
              >
                {verificationType === 'email' ? (
                  <Mail className="w-10 h-10 text-cyan-400" />
                ) : (
                  <Phone className="w-10 h-10 text-cyan-400" />
                )}
              </motion.div>
              
              <p className="text-sm text-slate-400 text-center">
                {verificationType === 'email' ? user.email : user.mobile}
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={otp} 
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100" />
                  <InputOTPSlot index={1} className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100" />
                  <InputOTPSlot index={2} className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100" />
                  <InputOTPSlot index={3} className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100" />
                  <InputOTPSlot index={4} className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100" />
                  <InputOTPSlot index={5} className="bg-[#0f172a]/50 border-cyan-500/30 text-cyan-100" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
              <p className="text-xs text-cyan-300 font-mono text-center">
                💡 Development Mode: Check browser console for OTP
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitOtp}
                disabled={otp.length !== 6}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50"
              >
                Verify OTP
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowOtpDialog(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
            </div>

            <button
              onClick={() => {
                const newOtp = generateOtp();
                toast.info('New OTP sent!');
              }}
              className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Didn't receive? Resend OTP
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
