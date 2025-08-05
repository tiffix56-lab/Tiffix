import express from 'express';
import session from 'express-session';
import router from './router/apiRouter.js';
import globalErrorHandler from './middleware/globalErrorHandler.js';
import responseMessage from './constant/responseMessage.js';
import httpError from './util/httpError.js';
import helmet from 'helmet';
import cors from 'cors';
import passport from './config/passport.js';
import config from './config/config.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: config.security.corsOrigin,
    credentials: true
}));
app.use(express.json());

// Session configuration for OAuth
app.use(session({
    secret: config.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.env === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/v1', router);

app.use((req, res, next) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('route'));
    } catch (err) {
        httpError(next, err, req, 404);
    }
});

app.use(globalErrorHandler);

export default app;
