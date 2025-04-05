const prisma = require('@utils/prisma');
const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");

const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return res.json(new ApiResponse(user, "User profile fetched successfully"));
    } catch (error) {
        return next(new ApiError(500, "Failed to fetch user profile", error, "/users/profile"));
    }
};

module.exports = getUserProfile;