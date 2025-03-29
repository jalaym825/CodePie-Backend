const ApiError = require("../entities/ApiError");

const zodValidator = (schema) => async (req, res, next) => {
    try {
        req.body = await schema.parseAsync(req.body);
        next();
    }
    catch (err) {
        next(new ApiError(422, err.errors[0].message, err.errors, `${req.originalUrl}/middleware/validate`));
    }
}

module.exports = zodValidator;