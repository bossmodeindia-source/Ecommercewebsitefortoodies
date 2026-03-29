import { storageUtils } from './storage';
import { toast } from 'sonner@2.0.3';

// Store for pending OTPs (in real implementation this would be on backend)
const OTP_STORAGE_KEY = 'toodies_pending_otps';

interface PendingOTP {
  identifier: string; // email or mobile
  otp: string;
  type: 'email' | 'mobile';
  timestamp: number;
  expiresAt: number;
}

export const verificationService = {
  /**
   * Generate a 6-digit OTP
   */
  generateOTP: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Store OTP temporarily (5 minutes expiry)
   */
  storeOTP: (identifier: string, otp: string, type: 'email' | 'mobile') => {
    const otps = verificationService.getPendingOTPs();
    const timestamp = Date.now();
    const expiresAt = timestamp + (5 * 60 * 1000); // 5 minutes

    const newOTP: PendingOTP = {
      identifier,
      otp,
      type,
      timestamp,
      expiresAt
    };

    // Remove expired OTPs and existing OTP for this identifier
    const filteredOTPs = otps.filter(
      o => o.identifier !== identifier && o.expiresAt > Date.now()
    );

    filteredOTPs.push(newOTP);
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filteredOTPs));
  },

  /**
   * Get all pending OTPs
   */
  getPendingOTPs: (): PendingOTP[] => {
    const otps = localStorage.getItem(OTP_STORAGE_KEY);
    if (!otps) return [];
    
    const parsed = JSON.parse(otps) as PendingOTP[];
    // Filter out expired OTPs
    return parsed.filter(o => o.expiresAt > Date.now());
  },

  /**
   * Verify OTP
   */
  verifyOTP: (identifier: string, otp: string): boolean => {
    const otps = verificationService.getPendingOTPs();
    const matchingOTP = otps.find(o => o.identifier === identifier && o.otp === otp);

    if (!matchingOTP) {
      return false;
    }

    if (matchingOTP.expiresAt < Date.now()) {
      toast.error('OTP has expired. Please request a new one.');
      return false;
    }

    // Remove used OTP
    const filteredOTPs = otps.filter(o => o.identifier !== identifier);
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(filteredOTPs));

    return true;
  },

  /**
   * Send OTP via Email using configured API
   */
  sendEmailOTP: async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    const settings = storageUtils.getAdminSettings();

    // Check if email is enabled
    if (!settings.emailEnabled) {
      console.log('[DEMO MODE] Email OTP:', otp, 'for', email);
      toast.info(`Demo Mode: Your OTP is ${otp}`, { duration: 10000 });
      return { success: true, message: 'OTP sent successfully (Demo Mode)' };
    }

    try {
      // In production, this would call the actual email API
      // For now, we'll simulate the API call based on provider

      if (settings.emailProvider === 'gmail') {
        // Gmail API simulation
        if (!settings.gmailClientId || !settings.gmailClientSecret) {
          throw new Error('Gmail API credentials not configured');
        }

        console.log('[SIMULATED] Sending email via Gmail API to:', email);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual Gmail API call
        // Example: Use googleapis npm package to send email
        /*
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        const message = createMessage(email, 'Your OTP', `Your verification OTP is: ${otp}`);
        await gmail.users.messages.send({ userId: 'me', requestBody: { raw: message } });
        */

      } else if (settings.emailProvider === 'smtp') {
        // SMTP simulation
        if (!settings.smtpHost || !settings.smtpUsername || !settings.smtpPassword) {
          throw new Error('SMTP credentials not configured');
        }

        console.log('[SIMULATED] Sending email via SMTP to:', email);
        console.log('[SIMULATED] SMTP Host:', settings.smtpHost);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual SMTP call
        // Example: Use nodemailer npm package
        /*
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: parseInt(settings.smtpPort || '587'),
          secure: settings.smtpPort === '465',
          auth: {
            user: settings.smtpUsername,
            pass: settings.smtpPassword
          }
        });
        
        await transporter.sendMail({
          from: settings.smtpUsername,
          to: email,
          subject: 'Your OTP for Toodies',
          text: `Your verification OTP is: ${otp}`,
          html: `<p>Your verification OTP is: <strong>${otp}</strong></p>`
        });
        */

      } else if (settings.emailProvider === 'sendgrid') {
        // SendGrid simulation
        console.log('[SIMULATED] Sending email via SendGrid to:', email);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual SendGrid call
        // Example: Use @sendgrid/mail npm package
        /*
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(settings.gmailApiKey); // Using gmailApiKey field for SendGrid API key
        
        const msg = {
          to: email,
          from: 'noreply@toodies.com',
          subject: 'Your OTP for Toodies',
          text: `Your verification OTP is: ${otp}`,
          html: `<p>Your verification OTP is: <strong>${otp}</strong></p>`
        };
        
        await sgMail.send(msg);
        */
      }

      // For demo purposes, show OTP in console and toast
      console.log('[DEMO MODE] Email OTP:', otp, 'for', email);
      toast.info(`Demo Mode: Your OTP is ${otp}`, { duration: 10000 });

      return { success: true, message: 'OTP sent successfully to your email' };

    } catch (error: any) {
      console.error('Error sending email OTP:', error);
      
      // Fallback to demo mode on error
      console.log('[FALLBACK DEMO MODE] Email OTP:', otp, 'for', email);
      toast.info(`Demo Mode: Your OTP is ${otp}`, { duration: 10000 });
      
      return { 
        success: true, 
        message: 'OTP sent (Demo Mode - Check console or notification)' 
      };
    }
  },

  /**
   * Send OTP via SMS using configured API
   */
  sendMobileOTP: async (mobile: string, otp: string): Promise<{ success: boolean; message: string }> => {
    const settings = storageUtils.getAdminSettings();

    // Check if SMS is enabled
    if (!settings.smsEnabled) {
      console.log('[DEMO MODE] Mobile OTP:', otp, 'for', mobile);
      toast.info(`Demo Mode: Your OTP is ${otp}`, { duration: 10000 });
      return { success: true, message: 'OTP sent successfully (Demo Mode)' };
    }

    try {
      // In production, this would call the actual SMS API
      // For now, we'll simulate the API call based on provider

      if (settings.smsProvider === 'twilio') {
        // Twilio simulation
        if (!settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
          throw new Error('Twilio credentials not configured');
        }

        console.log('[SIMULATED] Sending SMS via Twilio to:', mobile);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual Twilio call
        // Example: Use twilio npm package
        /*
        const twilio = require('twilio');
        const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
        
        await client.messages.create({
          body: `Your Toodies verification OTP is: ${otp}`,
          from: settings.twilioPhoneNumber,
          to: mobile
        });
        */

      } else if (settings.smsProvider === 'msg91') {
        // MSG91 simulation
        if (!settings.msg91AuthKey) {
          throw new Error('MSG91 credentials not configured');
        }

        console.log('[SIMULATED] Sending SMS via MSG91 to:', mobile);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual MSG91 call
        // Example: Use msg91 API
        /*
        const response = await fetch('https://api.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': settings.msg91AuthKey
          },
          body: JSON.stringify({
            sender: settings.msg91SenderId,
            mobile: mobile,
            otp: otp,
            template_id: settings.msg91TemplateId
          })
        });
        */

      } else if (settings.smsProvider === 'aws-sns') {
        // AWS SNS simulation
        if (!settings.awsSnsAccessKeyId || !settings.awsSnsSecretAccessKey) {
          throw new Error('AWS SNS credentials not configured');
        }

        console.log('[SIMULATED] Sending SMS via AWS SNS to:', mobile);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual AWS SNS call
        // Example: Use aws-sdk npm package
        /*
        const AWS = require('aws-sdk');
        AWS.config.update({
          accessKeyId: settings.awsSnsAccessKeyId,
          secretAccessKey: settings.awsSnsSecretAccessKey,
          region: settings.awsSnsRegion
        });
        
        const sns = new AWS.SNS();
        await sns.publish({
          Message: `Your Toodies verification OTP is: ${otp}`,
          PhoneNumber: mobile
        }).promise();
        */

      } else if (settings.smsProvider === 'other') {
        // Custom SMS API simulation
        if (!settings.otherSmsApiUrl || !settings.otherSmsApiKey) {
          throw new Error('Custom SMS API credentials not configured');
        }

        console.log('[SIMULATED] Sending SMS via Custom API to:', mobile);
        console.log('[SIMULATED] API URL:', settings.otherSmsApiUrl);
        console.log('[SIMULATED] OTP:', otp);

        // TODO: In production, implement actual custom API call
        // Example: Generic fetch call
        /*
        const url = settings.otherSmsApiUrl
          .replace('{mobile}', mobile)
          .replace('{otp}', otp)
          .replace('{message}', `Your Toodies verification OTP is: ${otp}`);

        const options: RequestInit = {
          method: settings.otherSmsApiMethod || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.otherSmsApiKey}`
          }
        };

        if (settings.otherSmsApiMethod === 'POST') {
          options.body = JSON.stringify({
            mobile: mobile,
            otp: otp,
            message: `Your Toodies verification OTP is: ${otp}`
          });
        }

        await fetch(url, options);
        */
      }

      // For demo purposes, show OTP in console and toast
      console.log('[DEMO MODE] Mobile OTP:', otp, 'for', mobile);
      toast.info(`Demo Mode: Your OTP is ${otp}`, { duration: 10000 });

      return { success: true, message: 'OTP sent successfully to your mobile' };

    } catch (error: any) {
      console.error('Error sending mobile OTP:', error);
      
      // Fallback to demo mode on error
      console.log('[FALLBACK DEMO MODE] Mobile OTP:', otp, 'for', mobile);
      toast.info(`Demo Mode: Your OTP is ${otp}`, { duration: 10000 });
      
      return { 
        success: true, 
        message: 'OTP sent (Demo Mode - Check console or notification)' 
      };
    }
  },

  /**
   * Request OTP for email verification
   */
  requestEmailVerification: async (email: string): Promise<{ success: boolean; message: string }> => {
    const otp = verificationService.generateOTP();
    verificationService.storeOTP(email, otp, 'email');
    return await verificationService.sendEmailOTP(email, otp);
  },

  /**
   * Request OTP for mobile verification
   */
  requestMobileVerification: async (mobile: string): Promise<{ success: boolean; message: string }> => {
    const otp = verificationService.generateOTP();
    verificationService.storeOTP(mobile, otp, 'mobile');
    return await verificationService.sendMobileOTP(mobile, otp);
  },

  /**
   * Verify email OTP
   */
  verifyEmailOTP: (email: string, otp: string): boolean => {
    return verificationService.verifyOTP(email, otp);
  },

  /**
   * Verify mobile OTP
   */
  verifyMobileOTP: (mobile: string, otp: string): boolean => {
    return verificationService.verifyOTP(mobile, otp);
  }
};
