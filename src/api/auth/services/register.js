const logger = require('@utils/logger');
const prisma = require("@utils/prisma");
const bcrypt = require("bcrypt");
const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
// const mailer = require("@utils/mailer");

const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        const user = await prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        });
        if (user) {
            logger.warn(`[/auth/register] - email already exists`);
            logger.debug(`[/auth/register] - email: ${email}`);
            return next(new ApiError(400, "Email already exists", {}, "/auth/register"));
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUser;
        try {
            newUser = await prisma.$transaction(async (_prisma) => {
                const createdUser = await _prisma.user.create({
                    data: {
                        name: firstName + " " + lastName,
                        email: email.toLowerCase(),
                        password: hashedPassword,
                    },
                });

                logger.info(`[/auth/register] - success - ${createdUser.sys_id}`);
                logger.debug(`[/auth/register] - email: ${email}`);

                // send verification email with link
                // const token = crypto.randomBytes(20).toString("hex");
                // const verificationToken = await _prisma.verificationTokens.create({
                //     data: {
                //         userId: createdUser.sys_id,
                //         token,
                //         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                //     },
                // });
                // const verificationLink = `${process.env.FRONTEND_URL}/verify/${verificationToken.token}`;
                // await mailer.sendVerificationLink(createdUser.email, verificationLink);

                return createdUser;
            }, { timeout: 10000 });

            delete newUser.password;
            return res.status(201).json(new ApiResponse(newUser, "User created successfully"));
        } catch (transactionError) {
            return next(new ApiError(400, transactionError.message, transactionError, "/auth/register"));
        }
    } catch (err) {
        next(new ApiError(400, err.message, err, "/auth/register"));
    }
}

module.exports = register;