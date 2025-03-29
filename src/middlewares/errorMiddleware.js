// In error middleware
const ApiError = require("../entities/ApiError");

const errorMiddleware = (err, req, res, next) => {
    let apiError;

    if (err instanceof ApiError) {
        apiError = err;
    } else {
        const code = err.code || 400;
        const message = err.message || "Something went wrong";
        const path = err.path || "unknown";
        apiError = new ApiError(code, message, err, path);
    }

    console.error('Error:', {
        code: apiError.code,
        message: apiError.message,
        path: apiError.path,
        error: apiError.error
    });

    return res.status(apiError.code).json(apiError);
};

module.exports = errorMiddleware;