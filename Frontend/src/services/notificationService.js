import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

let isInitialized = false;

/**
 * Sync FCM device token with Backend API
 */
export const syncTokenWithBackend = async (token) => {
    if (!token) return;
    try {
        const platform = Capacitor.getPlatform(); // 'android', 'ios', or 'web'
        await axios.post('/api/auth/fcm-token', {
            token,
            platform: platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : 'web',
            deviceModel: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : ''
        });
        localStorage.setItem('kharsan_fcm_token', token);
        console.log('[NotificationService] FCM Token synced with backend successfully.');
    } catch (err) {
        console.warn('[NotificationService] Token sync skipped/pending auth:', err.response?.data?.message || err.message);
    }
};

/**
 * Remove FCM device token from Backend API on user logout
 */
export const unregisterTokenOnLogout = async () => {
    const savedToken = localStorage.getItem('kharsan_fcm_token');
    if (!savedToken) return;
    try {
        await axios.delete('/api/auth/fcm-token', { data: { token: savedToken } });
        localStorage.removeItem('kharsan_fcm_token');
        console.log('[NotificationService] FCM Token removed on logout.');
    } catch (err) {
        console.warn('[NotificationService] Token removal error:', err.message);
    }
};

/**
 * Schedule smart retention local notifications (Zepto/Zomato style)
 * Triggered when user exits or pauses the app.
 */
export const scheduleSmartRetentionNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Cancel existing pending retention reminders before setting fresh ones
        await LocalNotifications.cancel({
            notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }]
        }).catch(() => {});

        const now = Date.now();

        await LocalNotifications.schedule({
            notifications: [
                // 1. Alert at 4 Hours after exit
                {
                    id: 1001,
                    title: '🏡 3 New Verified Plots Just Listed!',
                    body: 'Explore freshly approved agricultural & NA land plots with verified clear title in Gujarat.',
                    schedule: { at: new Date(now + 4 * 60 * 60 * 1000) },
                    sound: 'default',
                    channelId: 'kharsan_properties_alerts',
                    extra: { route: '/search?sort=newest' }
                },
                // 2. Alert at 24 Hours
                {
                    id: 1002,
                    title: '👀 Still exploring prime land plots?',
                    body: 'Price updates & high-growth investment plots are live. Connect directly with owners with 0 broker fee.',
                    schedule: { at: new Date(now + 24 * 60 * 60 * 1000) },
                    sound: 'default',
                    channelId: 'kharsan_properties_alerts',
                    extra: { route: '/search' }
                },
                // 3. Alert at 72 Hours (3 Days)
                {
                    id: 1003,
                    title: '⚡ Weekend Special Land Discoveries',
                    body: 'Check top-rated RERA verified industrial, commercial & farm lands before they are reserved!',
                    schedule: { at: new Date(now + 72 * 60 * 60 * 1000) },
                    sound: 'default',
                    channelId: 'kharsan_properties_alerts',
                    extra: { route: '/search?sort=trending' }
                }
            ]
        });
        console.log('[NotificationService] Smart retention reminders scheduled.');
    } catch (err) {
        console.warn('[NotificationService] Local notification schedule notice:', err.message);
    }
};

/**
 * Clear retention reminders when user opens/resumes the app
 */
export const clearRetentionReminders = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await LocalNotifications.cancel({
            notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }]
        }).catch(() => {});
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
        // silent
    }
};

/**
 * Initialize Push Notifications & Local Notification Channel
 */
export const initNotificationService = async (navigate) => {
    if (isInitialized) return;
    isInitialized = true;

    // ── Native Android / iOS Initialization ──
    if (Capacitor.isNativePlatform()) {
        try {
            // Create Android Notification Channel
            await PushNotifications.createChannel({
                id: 'kharsan_properties_alerts',
                name: 'Kharsan Properties Alerts',
                description: 'Real-time property updates, new listings and price drops',
                importance: 5,
                visibility: 1,
                vibration: true,
                sound: 'default'
            }).catch(() => {});

            // Check & Request Permissions
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive === 'granted') {
                try {
                    await PushNotifications.register();
                } catch (regErr) {
                    console.warn('[PushNotifications] PushNotifications.register error:', regErr);
                }
            }

            // Register Token Listener
            PushNotifications.addListener('registration', (token) => {
                console.log('[PushNotifications] Device registered with FCM token:', token.value);
                syncTokenWithBackend(token.value);
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.warn('[PushNotifications] Registration error:', error);
            });

            // Foreground Notification Received
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[PushNotifications] Push received in foreground:', notification);
            });

            // Notification Action Performed (User Tapped Notification)
            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('[PushNotifications] Action performed:', notification);
                const data = notification.notification?.data || {};
                const targetRoute = data.route || data.url;
                if (targetRoute && navigate) {
                    navigate(targetRoute);
                }
            });

            // Local Notification Tap Action
            LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
                const targetRoute = action.notification?.extra?.route;
                if (targetRoute && navigate) {
                    navigate(targetRoute);
                }
            });

            // Clear retention reminders since user is active
            clearRetentionReminders();

        } catch (err) {
            console.warn('[PushNotifications] Native init notice:', err.message);
        }
    }
};
