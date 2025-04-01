const logger = require('@utils/logger');
const prisma = require("@utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        });
        if (!user) {
            logger.warn(`[/auth/login] - email not found`);
            logger.debug(`[/auth/login] - email: ${email}`);
            return next(new ApiError(400, "Invalid email or password", {}, "/login"));
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            logger.warn(`[/auth/login] - invalid password`);
            logger.debug(`[/auth/login] - email: ${email}`);
            return next(new ApiError(400, "Invalid email or password", {}, "/auth/login"));
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        logger.info(`[/auth/login] - success - ${user.email}`);

        delete user.password;

        res.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });

        return res.json(new ApiResponse({}, "User logged in successfully"));
    } catch (err) {
        next(new ApiError(400, err.message, err, "/auth/login"));
    }
}

module.exports = login;