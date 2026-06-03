const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    // 1. Try Resend API (HTTP) if RESEND_API_KEY is defined.
    // This bypasses SMTP port blocks (25, 465, 587) in production environments like Railway.
    if (process.env.RESEND_API_KEY) {
        try {
            logger.info('Attempting to send email via Resend HTTP API...');
            
            // Note: Resend's free tier requires the sender address to be 'onboarding@resend.dev'
            // unless you have verified a custom domain on your Resend account.
            const senderEmail = process.env.FROM_EMAIL && process.env.FROM_EMAIL.includes('gmail.com')
                ? 'onboarding@resend.dev'
                : (process.env.FROM_EMAIL || 'onboarding@resend.dev');

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: `${process.env.FROM_NAME || 'LandSell'} <${senderEmail}>`,
                    to: options.email,
                    subject: options.subject,
                    text: options.message,
                    html: options.html
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Resend API returned status ${response.status}`);
            }

            logger.info(`Message sent successfully via Resend API: ${data.id}`);
            return;
        } catch (error) {
            logger.error(`Resend API Error: ${error.message}. Falling back...`);
        }
    }

    // 2. Try Brevo API (HTTP) if BREVO_API_KEY is defined.
    // Brevo is great because their free tier allows sending to any recipient without domain verification!
    if (process.env.BREVO_API_KEY) {
        try {
            logger.info('Attempting to send email via Brevo HTTP API...');
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { 
                        name: process.env.FROM_NAME || 'LandSell', 
                        email: process.env.FROM_EMAIL || 'saumyachaudhary9409@gmail.com' 
                    },
                    to: [{ email: options.email }],
                    subject: options.subject,
                    textContent: options.message,
                    htmlContent: options.html
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Brevo API returned status ${response.status}`);
            }

            logger.info(`Message sent successfully via Brevo API: ${data.messageId}`);
            return;
        } catch (error) {
            logger.error(`Brevo API Error: ${error.message}. Falling back...`);
        }
    }

    // 3. Try SendGrid API (HTTP) if SENDGRID_API_KEY is defined.
    if (process.env.SENDGRID_API_KEY) {
        try {
            logger.info('Attempting to send email via SendGrid HTTP API...');
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: options.email }] }],
                    from: { 
                        email: process.env.FROM_EMAIL || 'noreply@landsell.com', 
                        name: process.env.FROM_NAME || 'LandSell' 
                    },
                    subject: options.subject,
                    content: [
                        { type: 'text/plain', value: options.message },
                        { type: 'text/html', value: options.html }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`SendGrid API returned status ${response.status}: ${errText}`);
            }

            logger.info('Message sent successfully via SendGrid API');
            return;
        } catch (error) {
            logger.error(`SendGrid API Error: ${error.message}. Falling back...`);
        }
    }

    // 3. Fallback to standard SMTP (works on localhost, but blocked by Railway's firewall)
    logger.info('Sending email via SMTP...');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    logger.info(`Message sent successfully via SMTP: ${info.messageId}`);
};

module.exports = sendEmail;
