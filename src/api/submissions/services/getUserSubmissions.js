const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const getUserSubmissions = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const submissions = await prisma.submission.findMany({
            where: { userId },
            include: {
                problem: {
                    select: {
                        id: true,
                        title: true,
                        contestId: true,
                        points: true
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            }
        });

        return res.json(new ApiResponse(submissions, 'User submissions retrieved successfully'));
    } catch (error) {
        return next(new ApiError(500, error.message, error, '/submissions/my'));
    }
};

module.exports = getUserSubmissions;