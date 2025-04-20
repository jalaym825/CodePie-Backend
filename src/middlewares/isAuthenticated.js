const prisma = require("@utils/prisma");
const jwt = require("jsonwebtoken");
const ApiError = require("@entities/ApiError");

const isAuthenticated = (req, res, next) => {
    if(!req.user) {
        return next(new ApiError(401, "User not found", {}, "/middleware/verifyJWT"));
    }
    next();
}
module.exports = isAuthenticated;