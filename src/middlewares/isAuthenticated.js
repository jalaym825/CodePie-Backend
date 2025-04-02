const prisma = require("@utils/prisma");
const jwt = require("jsonwebtoken");
const ApiError = require("@entities/ApiError");

module.exports = isAuthenticated = async (req, res, next) => {
    const token = req.cookies?.access_token || req.header("Authorization")?.split(" ")[1];
    console.log(token);
    if (!token) {
        return next(new ApiError(401, "No token provided", {}, "/middleware/verifyJWT"));
    }
    try {
        let payload = jwt.verify(token.toString(), process.env.JWT_SECRET);
        if (!payload.userId) {
            return next(new ApiError(401, "Invalid token", {}, "/middleware/verifyJWT"));
        }
        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId
            }
        });
        delete user.password;
        if (!user) {
            return next(new ApiError(401, "User not found", {}, "/middleware/verifyJWT"));
        }
        req.user = user;
        next();
    } catch (error) {
        next(new ApiError(500, error.message, error, "/middleware/verifyJWT"));
    }
}