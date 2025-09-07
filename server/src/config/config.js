import dotenvFlow from 'dotenv-flow'

dotenvFlow.config()

const config = {
    env: process.env.ENV || 'development',
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        url: process.env.SERVER_URL || 'http://localhost:5000'
    },
    database: {
        url: process.env.DATABASE_URL
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        jwtExpiresIn: '1d',
        jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_URL || 'http://localhost:5000'}/v1/auth/google/callback`
        },
        facebook: {
            appId: process.env.FACEBOOK_APP_ID,
            appSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${process.env.SERVER_URL || 'http://localhost:5000'}/v1/auth/facebook/callback`
        }
    },
    security: {
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    },
    client: {
        url: process.env.CLIENT_URL || 'http://localhost:5173'
    },
    imageKit: {
        IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || "",
        IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || "",
        IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || "",
    },
    email: {
        smtp: {
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587', 10),
            secure: process.env.EMAIL_SECURE === 'true',
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM || 'noreply@tiffix.com',
        templates: {
            welcomeSubject: 'Welcome to Tiffix Tiffin Management System',
            verificationSubject: 'Verify your email address',
            passwordResetSubject: 'Reset your password',
            referralRewardSubject: 'You earned referral credits!'
        }
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || "",
        keySecret: process.env.RAZORPAY_KEY_SECRET || "",
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ""
    },
    phonepay: {
        keyId: process.env.PHONEPAY_CLIENT_ID,
        keySecret: process.env.PHONEPAY_CLIENT_SECRET,
        merchantId: process.env.PHONEPAY_MERCHANT_ID,
        saltIndex: process.env.PHONEPAY_SALT_INDEX || 1
    },
    olaMaps: {
        apiKey: process.env.OLA_MAPS_API_KEY || '',
        baseUrl: 'https://api.olamaps.io',
        apiVersion: 'v1'
    }
}

export default config