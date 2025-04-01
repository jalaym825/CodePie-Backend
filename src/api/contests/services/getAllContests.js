const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const getAllContests = async (req, res, next) => {
    try {
        const isAdminUser = req.user?.role === 'ADMIN';

        const contests = await prisma.contest.findMany({
            where: {
                isVisible: isAdminUser ? undefined : true
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
        return next(new ApiError(500, "Couldn't fetch contests", error, "contests/getAllContests"))
    }
}

module.exports = getAllContests;