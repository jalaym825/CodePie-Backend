const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");

const getMe = async (req, res, next) => {
    try {
        return res.json(new ApiResponse(req.user, "User is logged in"));
    } catch (err) {
        next(new ApiError(400, err.message, err, '/auth/me'));
    }
}

module.exports = getMe;