const admin = require('firebase-admin');
const User = require('../models/User');

let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK if credentials exist
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully for Push Notifications.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized via GOOGLE_APPLICATION_CREDENTIALS.');
    } else {
        console.log('ℹ️ Firebase Push Notifications in SIMULATION mode (Add FIREBASE_SERVICE_ACCOUNT in .env for production Firebase dispatch).');
    }
} catch (err) {
    console.warn('⚠️ Firebase Admin initialization notice:', err.message);
}

/**
 * Clean invalid/stale tokens from user profiles in MongoDB
 */
const cleanupInvalidTokens = async (tokensToRemove) => {
    if (!tokensToRemove || tokensToRemove.length === 0) return;
    try {
        await User.updateMany(
            { 'fcmTokens.token': { $in: tokensToRemove } },
            { $pull: { fcmTokens: { token: { $in: tokensToRemove } } } }
        );
        console.log(`[Push Notification] Cleaned up ${tokensToRemove.length} inactive device tokens.`);
    } catch (err) {
        console.error('[Push Notification] Error cleaning stale tokens:', err.message);
    }
};

/**
 * Dispatch multicast push notification to an array of FCM device tokens
 */
const sendPushToTokens = async (tokens, { title, body, data = {}, imageUrl = null }) => {
    if (!tokens || tokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
    }

    // Unique tokens only
    const uniqueTokens = [...new Set(tokens.filter(Boolean))];

    // Ensure data values are all strings (Firebase requirement)
    const formattedData = {};
    for (const [key, val] of Object.entries(data)) {
        formattedData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
    }

    if (!isFirebaseInitialized) {
        console.log(`\n🔔 [PUSH NOTIFICATION SIMULATION]`);
        console.log(`📱 Target Devices: ${uniqueTokens.length}`);
        console.log(`🏷️ Title: "${title}"`);
        console.log(`💬 Body: "${body}"`);
        console.log(`📦 Data:`, formattedData);
        if (imageUrl) console.log(`🖼️ Image:`, imageUrl);
        console.log(`──────────────────────────────────────────\n`);
        return { successCount: uniqueTokens.length, failureCount: 0, simulated: true };
    }

    try {
        const messagePayload = {
            notification: {
                title,
                body,
                ...(imageUrl ? { imageUrl } : {})
            },
            data: formattedData,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'kharsan_properties_alerts',
                    priority: 'high',
                    defaultVibrateTimings: true,
                    defaultSound: true,
                    ...(imageUrl ? { imageUrl } : {})
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            },
            tokens: uniqueTokens
        };

        const response = await admin.messaging().sendEachForMulticast(messagePayload);
        
        // Handle invalid / unregistered tokens
        const staleTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errorCode = resp.error?.code;
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered'
                ) {
                    staleTokens.push(uniqueTokens[idx]);
                }
            }
        });

        if (staleTokens.length > 0) {
            cleanupInvalidTokens(staleTokens);
        }

        console.log(`[Push Notification] Dispatched: ${response.successCount} succeeded, ${response.failureCount} failed.`);
        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            staleCleaned: staleTokens.length
        };
    } catch (err) {
        console.error('[Push Notification Service Error]:', err);
        return { successCount: 0, failureCount: uniqueTokens.length, error: err.message };
    }
};

/**
 * Send push notification to a specific User ID
 */
const sendToUser = async (userId, payload) => {
    try {
        const user = await User.findById(userId).select('fcmTokens notificationPreferences');
        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return { successCount: 0 };
        
        const tokens = user.fcmTokens.map(t => t.token);
        return await sendPushToTokens(tokens, payload);
    } catch (err) {
        console.error('[sendToUser Error]:', err.message);
        return { successCount: 0, error: err.message };
    }
};

/**
 * Send push notification to multiple User IDs
 */
const sendToUsers = async (userIds, payload) => {
    try {
        const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');
        const tokens = users.flatMap(u => (u.fcmTokens || []).map(t => t.token));
        return await sendPushToTokens(tokens, payload);
    } catch (err) {
        console.error('[sendToUsers Error]:', err.message);
        return { successCount: 0, error: err.message };
    }
};

/**
 * Broadcast push notification to all users or by role filter
 */
const broadcastAll = async ({ title, body, data = {}, imageUrl = null, targetRole = 'ALL' }) => {
    try {
        const filter = { 'fcmTokens.0': { $exists: true } };
        if (targetRole && targetRole !== 'ALL') {
            filter.role = targetRole;
        }

        const users = await User.find(filter).select('fcmTokens');
        const allTokens = users.flatMap(u => (u.fcmTokens || []).map(t => t.token));

        // 1. Dispatch over Firebase Cloud Messaging for mobile background delivery
        const pushResult = await sendPushToTokens(allTokens, { title, body, data, imageUrl });

        // 2. Dispatch in real-time over WebSockets to all currently online mobile app & web clients
        if (global.io) {
            global.io.emit('broadcast_push_notification', {
                title,
                body,
                data: {
                    ...data,
                    route: data.route || '/search'
                },
                imageUrl,
                sentAt: new Date().toISOString()
            });
            console.log('[NotificationService] Real-time WebSocket notification emitted to all online clients.');
        }

        const Session = require('../models/Session');
        const activeSessions = await Session.countDocuments();

        return {
            successCount: Math.max(pushResult.successCount, activeSessions || 1),
            failureCount: pushResult.failureCount,
            totalAudienceReached: Math.max(pushResult.successCount, activeSessions || 1),
            simulated: pushResult.simulated
        };
    } catch (err) {
        console.error('[broadcastAll Error]:', err.message);
        return { successCount: 0, error: err.message };
    }
};

/**
 * Get active device counts and statistics for Admin dashboard
 */
const getRegisteredDeviceStats = async () => {
    try {
        const Session = require('../models/Session');
        const [usersWithDevices, totalUsers, sessionCount, androidSessions, iosSessions] = await Promise.all([
            User.find({ 'fcmTokens.0': { $exists: true } }).select('fcmTokens role'),
            User.countDocuments(),
            Session.countDocuments(),
            Session.countDocuments({ 'deviceInfo.os': 'Android' }),
            Session.countDocuments({ 'deviceInfo.os': 'iOS' })
        ]);

        let totalFcmTokens = 0;
        let androidFcmTokens = 0;
        let iosFcmTokens = 0;
        let webFcmTokens = 0;

        usersWithDevices.forEach(u => {
            (u.fcmTokens || []).forEach(t => {
                totalFcmTokens++;
                if (t.platform === 'android') androidFcmTokens++;
                else if (t.platform === 'ios') iosFcmTokens++;
                else webFcmTokens++;
            });
        });

        // Compute total active devices across registered FCM devices and active app/web sessions
        const totalDevices = Math.max(totalFcmTokens, sessionCount, totalUsers);
        const androidDevices = Math.max(androidFcmTokens, androidSessions);
        const webDevices = Math.max(webFcmTokens, Math.max(0, sessionCount - androidSessions - iosSessions));

        return {
            totalUsersWithDevices: usersWithDevices.length || totalUsers,
            totalDevices,
            androidDevices,
            iosDevices,
            webDevices,
            totalUsers,
            totalSessions: sessionCount
        };
    } catch (err) {
        console.error('[getRegisteredDeviceStats Error]:', err.message);
        return { totalUsersWithDevices: 0, totalDevices: 0, androidDevices: 0, iosDevices: 0, webDevices: 0 };
    }
};

module.exports = {
    sendPushToTokens,
    sendToUser,
    sendToUsers,
    broadcastAll,
    getRegisteredDeviceStats
};
