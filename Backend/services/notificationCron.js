const cron = require('node-cron');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendPushToTokens, broadcastAll } = require('./pushNotificationService');

/**
 * Initialize Automated Smart Re-Engagement Notification Schedules (Zepto/Zomato style)
 */
const initNotificationCron = () => {
    console.log('⏰ Initializing Smart Push Notification Cron Jobs...');

    // 1. Daily Discovery Notification at 10:30 AM IST (05:00 UTC)
    cron.schedule('0 5 * * *', async () => {
        try {
            console.log('[Cron] Running Daily 10:30 AM Land Discovery Push...');
            
            // Check if there are recently added active listings
            const recentListings = await Listing.find({ status: 'Approved' })
                .sort({ createdAt: -1 })
                .limit(3)
                .select('title price city landType');

            let title = '🏡 New Verified Plots Added Today!';
            let body = 'Discover newly listed agricultural & residential land plots with verified documents.';
            let targetRoute = '/search';

            if (recentListings.length > 0) {
                const sample = recentListings[0];
                const formattedPrice = sample.price >= 10000000 
                    ? `₹${(sample.price / 10000000).toFixed(1)} Cr` 
                    : `₹${(sample.price / 100000).toFixed(0)} Lakh`;
                
                title = `✨ New in ${sample.city || 'Gujarat'}: ${sample.landType || 'Land'} Plot`;
                body = `Starting from ${formattedPrice}. Zero brokerage, 100% verified legal title. Tap to explore!`;
                targetRoute = `/property/${sample._id}`;
            }

            await broadcastAll({
                title,
                body,
                data: {
                    type: 'DAILY_DISCOVERY',
                    route: targetRoute
                }
            });
        } catch (err) {
            console.error('[Cron Daily Discovery Error]:', err.message);
        }
    });

    // 2. Sunday Special Investment Discovery at 11:00 AM IST (05:30 UTC)
    cron.schedule('30 5 * * 0', async () => {
        try {
            console.log('[Cron] Running Sunday Investment Push...');
            await broadcastAll({
                title: '🚀 Weekend Investment Alert',
                body: 'High-growth commercial, NA & industrial land opportunities with high ROI potential. Check them now!',
                data: {
                    type: 'WEEKEND_SPECIAL',
                    route: '/search?sort=trending'
                }
            });
        } catch (err) {
            console.error('[Cron Sunday Special Error]:', err.message);
        }
    });

    // 3. Daily Inactivity Re-Engagement at 6:30 PM IST (13:00 UTC)
    cron.schedule('0 13 * * *', async () => {
        try {
            console.log('[Cron] Checking Inactive App Users for 48h Retention Prompt...');
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            
            // Find users who haven't been active in 48 hours but have registered device tokens
            const inactiveUsers = await User.find({
                'fcmTokens.0': { $exists: true },
                'fcmTokens.lastActive': { $lt: fortyEightHoursAgo },
                'notificationPreferences.inactivityReminders': { $ne: false }
            }).select('fcmTokens name');

            if (inactiveUsers.length > 0) {
                const tokens = inactiveUsers.flatMap(u => (u.fcmTokens || []).map(t => t.token));
                await sendPushToTokens(tokens, {
                    title: '👀 Still looking for the perfect land plot?',
                    body: 'New prime plots and updated prices in your preferred areas. Take a quick look before they are reserved!',
                    data: {
                        type: 'INACTIVITY_REENGAGE',
                        route: '/search'
                    }
                });
                console.log(`[Cron Inactivity] Re-engagement push sent to ${tokens.length} inactive devices.`);
            }
        } catch (err) {
            console.error('[Cron Inactivity Error]:', err.message);
        }
    });

    console.log('✅ Push Notification Cron Jobs successfully scheduled.');
};

module.exports = { initNotificationCron };
