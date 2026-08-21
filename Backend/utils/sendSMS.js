const logger = require('./logger');
const axios = require('axios');

const sendSMS = async ({ phone, message }) => {
  if (!phone) return { success: false, error: 'No phone number provided' };

  // Format phone number to E.164 (+919409553232)
  let formattedPhone = phone.trim();
  const cleanNum = formattedPhone.replace(/\D/g, '').slice(-10);

  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${cleanNum}`;
  }

  // 1. Twilio Verify API Service (Highest Priority - Official Twilio Verify)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      const twilio = require('twilio');
      const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: formattedPhone, channel: 'sms' });

      logger.info(`[SMS] Twilio Verify OTP dispatch status: ${verification.status} to ${formattedPhone}`);
      console.log(`📱 [SMS SENT via Twilio Verify] To ${formattedPhone} (Status: ${verification.status})`);
      return { success: true, provider: 'TwilioVerify', sid: verification.sid };
    } catch (err) {
      logger.error(`[SMS] Twilio Verify Error sending to ${formattedPhone}: ${err.message}`);
      console.error(`[SMS] Twilio Verify Error:`, err.message);
    }
  }

  // 2. Fast2SMS Provider (Instant Indian SMS)
  if (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY !== 'your_fast2sms_api_key_here') {
    try {
      await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
          authorization: process.env.FAST2SMS_API_KEY,
          variables_values: message,
          route: 'otp',
          numbers: cleanNum
        }
      });
      logger.info(`[SMS] Fast2SMS OTP sent to ${cleanNum}`);
      console.log(`📱 [SMS SENT via Fast2SMS] To ${cleanNum}: ${message}`);
      return { success: true, provider: 'Fast2SMS' };
    } catch (err) {
      logger.error(`[SMS] Fast2SMS Error: ${err.message}`);
    }
  }

  // 3. Twilio Messages API Fallback
  const canSendTwilioMsg = process.env.TWILIO_ACCOUNT_SID && 
                           process.env.TWILIO_AUTH_TOKEN && 
                           process.env.TWILIO_FROM_NUMBER && 
                           !process.env.TWILIO_FROM_NUMBER.includes('18005550199');

  if (canSendTwilioMsg) {
    try {
      const twilio = require('twilio');
      const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to: formattedPhone
      });
      logger.info(`[SMS] OTP Message sent to ${formattedPhone} via Twilio Messages API`);
      console.log(`📱 [SMS SENT via Twilio Messages] To ${formattedPhone}: ${message}`);
      return { success: true, provider: 'TwilioMessages' };
    } catch (smsErr) {
      logger.error(`[SMS] Twilio Messages error sending to ${formattedPhone}: ${smsErr.message}`);
    }
  }

  // 4. Fallback Development Simulation Log
  console.log(`--------------------------------------------------`);
  console.log(`📱 [SMS OTP DISPATCH LOG] To: ${formattedPhone} (${cleanNum})`);
  console.log(`MESSAGE: "${message}"`);
  console.log(`--------------------------------------------------`);
  return { success: true, simulated: true };
};

// Function to check OTP via Twilio Verify API
const verifyTwilioOTP = async ({ phone, code }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    return { success: false, fallbackToLocal: true };
  }

  let formattedPhone = phone.trim();
  const cleanNum = formattedPhone.replace(/\D/g, '').slice(-10);
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${cleanNum}`;
  }

  try {
    const twilio = require('twilio');
    const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: formattedPhone, code: code.trim() });

    console.log(`📱 [Twilio Verify Check] Status: ${verificationCheck.status}, Valid: ${verificationCheck.valid}`);

    if (verificationCheck.status === 'approved' && verificationCheck.valid) {
      return { success: true, valid: true };
    } else {
      return { success: false, valid: false, status: verificationCheck.status };
    }
  } catch (err) {
    logger.error(`[SMS] Twilio Verify Check Error: ${err.message}`);
    return { success: false, fallbackToLocal: true, error: err.message };
  }
};

module.exports = { sendSMS, verifyTwilioOTP };
