const ApiError = require("../entities/ApiError");
module.exports = async (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return next(new ApiError(401, "You are not authorised", {}, "/middleware/isAdmin"));
    }
    next();
}