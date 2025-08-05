import os from 'os';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import bcrypt from "bcrypt"
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { EApplicationEnvironment } from '../constant/application.js';
import { parsePhoneNumber } from 'libphonenumber-js'
import { getTimezonesForCountry } from 'countries-and-timezones'

export default {
    getSystemHealth: () => {
        return {
            cpuUsage: os.loadavg(),
            totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
            freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
        };
    },
    getApplicationHealth: () => {
        return {
            environment: config.ENV,
            uptime: `${process.uptime().toFixed(2)} Seconds`,
            memoryUsage: {
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            },
        };
    },
    hashPassword: (password) => {
        return bcrypt.hash(password, 10)
    },
    comparePassword: (attemptedPassword, encPassword) => {
        return bcrypt.compare(attemptedPassword, encPassword)
    },
    generateToken: (payload, secret, expiry) => {
        return jwt.sign(payload, secret, {
            expiresIn: expiry
        })
    },
    verifyToken: (token, secret) => {
        return jwt.verify(token, secret)
    },
    parsePhoneNumber: (phoneNumber) => {
        try {
            const parsedContactNumber = parsePhoneNumber(phoneNumber)
            if (parsedContactNumber) {
                return {
                    countryCode: parsedContactNumber.countryCallingCode,
                    isoCode: parsedContactNumber.country || null,
                    internationalNumber: parsedContactNumber.formatInternational()
                }
            }

            return {
                countryCode: null,
                isoCode: null,
                internationalNumber: null
            }
        } catch (err) {
            return {
                countryCode: null,
                isoCode: null,
                internationalNumber: null
            }
        }
    },
    countryTimezone: (isoCode) => {
        return getTimezonesForCountry(isoCode)
    },
    generateReferralCode: (length = 8) => {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return nanoid(length).toUpperCase().replace(/[^A-Z0-9]/g, () =>
            alphabet[Math.floor(Math.random() * alphabet.length)]
        );
    },

    generateOTP: () => {
        if (config.env === EApplicationEnvironment.DEVELOPMENT) {
            return "000000"
        }
        return crypto.randomInt(100000, 999999).toString();
    },
    generateSecureToken: (length = 32) => {
        return crypto.randomBytes(length).toString('hex');
    },

    calculateReferralCredits: (subscriptionAmount) => {
        const credits = Math.floor(subscriptionAmount * 0.1);
        return Math.min(Math.max(credits, 50), 500);
    },


    isValidPhoneNumber: (phoneNumber) => {
        const phoneRegex = /^[+]?[0-9]{10,15}$/;
        return phoneRegex.test(phoneNumber);
    },


    isValidPincode: (pincode) => {
        const pincodeRegex = /^[1-9][0-9]{5}$/;
        return pincodeRegex.test(pincode);
    },


    calculateDistance: (coord1, coord2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },


    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '')
            .trim();
    },

    generatePaginationMeta: (page, limit, total) => {
        const totalPages = Math.ceil(total / limit);
        return {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null
        }
    },


    formatCurrency: (amount, currency = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },


    isWithinOperatingHours: (startTime, endTime) => {
        const now = new Date();
        const currentTime = now.toTimeString().substr(0, 5);
        return currentTime >= startTime && currentTime <= endTime;
    },


    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
};
