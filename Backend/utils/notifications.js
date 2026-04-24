const nodemailer = require('nodemailer');

const sendPaymentNotification = async (buyer, seller, listing, transaction) => {
    // Email Configuration
    const canSendEmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    let transporter;
    if (canSendEmail) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    const receiptHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0;">LandToken Receipt</h2>
                <p style="color: #64748b; font-size: 14px;">Direct P2P Payment Confirmation</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Receipt No:</strong> ${transaction.receiptNumber}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div style="margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Listing:</strong> ${listing.title}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${listing.location}</p>
                <p style="margin: 5px 0;"><strong>Token Amount:</strong> ₹${transaction.amount.toLocaleString('en-IN')}</p>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Buyer</p>
                    <p style="margin: 5px 0;"><strong>${buyer.name}</strong></p>
                    <p style="margin: 0; font-size: 12px;">${buyer.phone || 'No phone provided'}</p>
                </div>
                <div style="flex: 1; text-align: right;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Seller</p>
                    <p style="margin: 5px 0;"><strong>${seller.name}</strong></p>
                </div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="color: #065f46; margin: 0; font-weight: bold;">Property Status: SECURED (TOKENED)</p>
            </div>
            <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 20px;">
                This transaction was facilitated directly between buyer and seller accounts. LandSelling Platform does not hold funds.
            </p>
        </div>
    `;

    try {
        if (canSendEmail) {
            // Send to Buyer
            await transporter.sendMail({
                from: '"LandSelling Admin" <noreply@landselling.com>',
                to: buyer.email,
                subject: `[SECURE] Token Confirmation: ${listing.title}`,
                html: receiptHtml
            });

            // Send to Seller
            await transporter.sendMail({
                from: '"LandSelling Admin" <noreply@landselling.com>',
                to: seller.email,
                subject: `[PAYMENT RECEIVED] Token for ${listing.title}`,
                html: `<p>User <strong>${buyer.name}</strong> has paid the token for your property. Funds have been routed to your selected account.</p>` + receiptHtml
            });
            console.log(`[Email] Notifications sent to ${buyer.email} and ${seller.email}`);
        } else {
            console.log('[Email] EMAIL_USER/PASS not configured. Skipping email notifications.');
        }


        // --- Real SMS Integration (Twilio Example) ---
        const canSendSMS = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER;
        
        const buyerMsg = `[LandToken] Hi ${buyer.name}, your token for "${listing.title}" is confirmed! Receipt: ${transaction.receiptNumber}. The property is now reserved for you.`;
        const sellerMsg = `[LandToken] Great news! A buyer has tokened "${listing.title}". ₹${transaction.amount} has been sent to your chosen account. Check your dashboard for details.`;

        if (canSendSMS) {
            try {
                const twilio = require('twilio');
                const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                
                if (buyer.phone) {
                    await client.messages.create({
                        body: buyerMsg,
                        from: process.env.TWILIO_FROM_NUMBER,
                        to: buyer.phone
                    });
                }
                
                if (seller.phone) {
                    await client.messages.create({
                        body: sellerMsg,
                        from: process.env.TWILIO_FROM_NUMBER,
                        to: seller.phone
                    });
                }
                console.log(`[SMS] Notifications sent via Twilio`);
            } catch (smsErr) {
                console.error('[SMS] Twilio Error:', smsErr.message);
                // Fallback to simulation log if twilio fails
                console.log(`🚀 SMS Fallback Log - To ${buyer.phone}: ${buyerMsg}`);
            }
        } else {
            console.log(`----------------------------------------`);
            console.log(`🚀 SMS NOTIFICATION SIMULATION (Configure TWILIO_... in .env for real SMS)`);
            console.log(`To Buyer (${buyer.phone || 'N/A'}): ${buyerMsg}`);
            console.log(`To Seller (${seller.phone || 'N/A'}): ${sellerMsg}`);
            console.log(`----------------------------------------`);
        }

    } catch (error) {
        console.error('Notification Service Error:', error);
    }
};

module.exports = { sendPaymentNotification };
