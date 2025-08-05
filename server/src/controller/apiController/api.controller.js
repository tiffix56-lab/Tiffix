import httpResponse from '../../util/httpResponse.js';
import responseMessage from '../../constant/responseMessage.js';
import httpError from '../../util/httpError.js';
import quicker from '../../util/quicker.js';
import { uploadOnImageKit } from '../../service/imageKitService.js';

export default {
    self: (req, res, next) => {
        try {
            httpResponse(req, res, 200, responseMessage.SUCCESS);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },
    health: (req, res, next) => {
        try {
            const healthData = {
                application: quicker.getApplicationHealth(),
                system: quicker.getSystemHealth(),
                timestamp: Date.now(),
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, healthData);
        } catch (err) {
            httpError(next, err, req, 500);
        }
    },
    uploadFile: async (req, res, next) => {
        try {
            const { body } = req



            if (!req.file) {
                return httpError(next, new Error(responseMessage.CUSTOM_MESSAGE('No file uploaded')), req, 400)
            }

            if (!body.category) {
                return httpError(next, new Error(responseMessage.CUSTOM_MESSAGE('Category is required')), req, 400)
            }

            const uploadedFile = await uploadOnImageKit(req.file.path, body.category)

            if (!uploadedFile) {
                return httpError(next, new Error(responseMessage.CUSTOM_MESSAGE('File upload failed')), req, 500)
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, uploadedFile)
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    },
};
