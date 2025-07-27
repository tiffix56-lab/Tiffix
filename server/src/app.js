import express from 'express';
import router from './router/apiRouter.js';
import globalErrorHandler from './middleware/globalErrorHandler.js';
import responseMessage from './constant/responseMessage.js';
import httpError from './util/httpError.js';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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
