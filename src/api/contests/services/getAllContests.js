const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");
const ApiResponse = require("@entities/ApiResponse");

const getAllContests = async (req, res, next) => {
    try {
        const isAdminUser = req.user?.role === 'ADMIN';
        const now = new Date();

        const contests = await prisma.contest.findMany({
            where: isAdminUser ? {} : {
                NOT: {
                    // Exclude only live contests that are not visible
                    AND: [
                        { startTime: { lte: now } },
                        { endTime: { gte: now } },
                        { isVisible: false }
                    ]
                }
            },
            include: {
                _count: {
                    select: {
                        problems: true,
                        participations: true
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        res.json(new ApiResponse(contests, "Contests fetched successfully"));
    } catch (error) {
        return next(new ApiError(500, "Couldn't fetch contests", error, "contests/getAllContests"));
    }
};

module.exports = getAllContests;
