const crypto = require('crypto');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'zyronova_premium_licensing_fallback_secret_key_2026';

/**
 * Generates a real cryptographic signature for the given SaaS parameters.
 * @param {number} rentLimit - Limit of vehicles for Rent-A-Car
 * @param {number} tourLimit - Limit of branches/offices for Tour-Tracking
 * @param {string} expDays - Expiration key (e.g. '30D' or '365D')
 * @returns {string} The dynamic signature (first 8 hex characters of HMAC-SHA256)
 */
function calculateCryptoSignature(rentLimit, tourLimit, expDays) {
    const rawData = `RC:${rentLimit}|TT:${tourLimit}|EXP:${expDays}`;
    return crypto
        .createHmac('sha256', SECRET)
        .update(rawData)
        .digest('hex')
        .substring(0, 10) // 10 characters signature
        .toUpperCase();
}

/**
 * Creates a complete secure license key string.
 */
function generateLicenseKey(rentLimit, tourLimit, expDays) {
    const formattedExp = expDays.toString().endsWith('D') ? expDays : `${expDays}D`;
    const sig = calculateCryptoSignature(rentLimit, tourLimit, formattedExp);
    return `ZY-LCS-[RC:${rentLimit}]-[TT:${tourLimit}]-[EXP:${formattedExp}]-[SIG:${sig}]`;
}

/**
 * Parses and cryptographically verifies a license key.
 * @param {string} licenseKey - The complete license key string
 * @returns {object} An object containing validation status, limits, and expiration details
 */
function verifyLicenseKey(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
        return { isValid: false, error: 'Lisans anahtarı boş veya geçersiz.' };
    }

    // Match format: ZY-LCS-[RC:X]-[TT:Y]-[EXP:ZD]-[SIG:HASH]
    const regex = /^ZY-LCS-\[RC:(\d+)\]-\[TT:(\d+)\]-\[EXP:(\d+D)\]-\[SIG:([A-F0-9]+)\]$/i;
    const match = licenseKey.match(regex);

    if (!match) {
        return { isValid: false, error: 'Lisans anahtarı formatı geçersiz.' };
    }

    const rentLimit = parseInt(match[1], 10);
    const tourLimit = parseInt(match[2], 10);
    const expDays = match[3];
    const signature = match[4];

    // Re-calculate signature to verify integrity
    const expectedSignature = calculateCryptoSignature(rentLimit, tourLimit, expDays);

    if (signature !== expectedSignature) {
        return { isValid: false, error: 'Lisans imzası doğrulaması başarısız! Anahtar değiştirilmiş.' };
    }

    return {
        isValid: true,
        limits: {
            rentLimit,
            tourLimit,
            expDays: parseInt(expDays, 10)
        }
    };
}

module.exports = {
    generateLicenseKey,
    verifyLicenseKey,
    calculateCryptoSignature
};
