const crypto = require('crypto');
const Setting = require('../models/Setting');
const logger = require('../utils/logger');

// In-memory failed attempt rate limiter for PIN brute-force defense
const failedAttemptsMap = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

const checkBruteForceLockout = (key) => {
    const record = failedAttemptsMap.get(key);
    if (!record) return false;

    const now = Date.now();
    if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
        failedAttemptsMap.delete(key);
        return false;
    }

    return record.count >= MAX_FAILED_ATTEMPTS;
};

const recordFailedAttempt = (key) => {
    const now = Date.now();
    const record = failedAttemptsMap.get(key) || { count: 0, lastAttempt: now };
    record.count += 1;
    record.lastAttempt = now;
    failedAttemptsMap.set(key, record);
    return record.count;
};

const clearFailedAttempts = (key) => {
    failedAttemptsMap.delete(key);
};

/**
 * Middleware: Requires Master Admin Security PIN for sensitive financial operations
 * (Updating coin economy, feature toggles, approving/rejecting cash withdrawals).
 */
const requireAdminSecurityPin = async (req, res, next) => {
    try {
        const clientIdentifier = `${req.ip}_${req.user?._id || 'admin'}`;

        // Check if locked out due to brute force
        if (checkBruteForceLockout(clientIdentifier)) {
            logger.warn(`[SECURITY ALERT] Blocked brute-force PIN attempt from: ${clientIdentifier}`);
            return res.status(429).json({
                success: false,
                requiresPin: true,
                error: 'SECURITY LOCKOUT: Too many incorrect PIN attempts. Access locked for 15 minutes.'
            });
        }

        const providedPin = req.headers['x-admin-pin'] || req.body?.adminPin;

        if (!providedPin) {
            return res.status(403).json({
                success: false,
                requiresPin: true,
                error: 'Security Verification Required: Please enter your Master Admin Security PIN to authorize this sensitive action.'
            });
        }

        const cleanPin = String(providedPin).trim();
        const envPin = process.env.ADMIN_SECURITY_PIN;

        // Check custom hashed PIN from Settings collection
        const pinSetting = await Setting.findOne({ key: 'admin_master_pin_hash' });
        
        let isValid = false;

        if (pinSetting && pinSetting.value) {
            const hashedAttempt = crypto.createHash('sha256').update(cleanPin).digest('hex');
            isValid = (hashedAttempt === pinSetting.value) || (envPin && cleanPin === envPin);
        } else if (envPin) {
            isValid = (cleanPin === envPin);
        }

        if (!isValid) {
            const failedCount = recordFailedAttempt(clientIdentifier);
            const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - failedCount);
            logger.warn(`[SECURITY ALERT] Invalid Admin PIN attempt (${failedCount}/${MAX_FAILED_ATTEMPTS}) from IP: ${req.ip}, User: ${req.user?.email || req.user?._id}`);
            
            return res.status(403).json({
                success: false,
                requiresPin: true,
                error: `ACCESS DENIED: Invalid Master Admin Security PIN. (${remaining} attempts remaining before lockout)`
            });
        }

        // Validated successfully: clear failed attempts
        clearFailedAttempts(clientIdentifier);
        next();
    } catch (err) {
        logger.error(`Admin Security PIN error: ${err.message}`);
        return res.status(500).json({ success: false, error: 'Security authorization error' });
    }
};

module.exports = {
    requireAdminSecurityPin
};
