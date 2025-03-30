const prisma = require("@utils/prisma");
const jwt = require("jsonwebtoken");
const ApiError = require("@entities/ApiError");

module.exports = isAuthenticated = async (req, res, next) => {
    const token = req.cookies?.token || req.header("Authorization")?.split(" ")[1];
    console.log(token);
    if (!token) {
        return next(new ApiError(401, "No token provided", {}, "/middleware/verifyJWT"));
    }
    try {
        let payload = await jwt.verify(token.toString(), process.env.JWT_SECRET);

        if (!payload.id) {
            return next(new ApiError(401, "Invalid token", {}, "/middleware/verifyJWT"));
        }
        const user = await prisma.user.findUnique({
            where: {
                id: payload.id
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