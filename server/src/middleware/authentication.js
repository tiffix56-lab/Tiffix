import config from '../config/config.js'
import responseMessage from '../constant/responseMessage.js'
import userModel from '../models/user.model.js'
import httpError from '../util/httpError.js'
import quicker from '../util/quicker.js'

export default async (request, _res, next) => {
    try {
        const req = request

        let accessToken

        const cookies = req.cookies
        if (cookies?.accessToken) {
            accessToken = cookies.accessToken
        }

        if (!accessToken) {
            const authHeader = req.headers.authorization
            if (authHeader?.startsWith('Bearer ')) {
                accessToken = authHeader.split(' ')[1]
            }
        }



        if (!accessToken) {
            return httpError(next, new Error(responseMessage.AUTH.UNAUTHORIZED), req, 401)
        }

        try {
            const { userId } = await quicker.verifyToken(accessToken, config.auth.jwtSecret)

            const user = await userModel.findOne({ _id: userId }).select('-password')

            if (!user) {
                return httpError(next, new Error(responseMessage.AUTH.UNAUTHORIZED), req, 401)
            }

            req.authenticatedUser = user
            req.authenticatedUser.userId = user?._id

            return next()
        } catch (tokenError) {
            return httpError(next, new Error(responseMessage.AUTH.UNAUTHORIZED), req, 401)
        }
    } catch (err) {
        httpError(next, err, request, 500)
    }
}