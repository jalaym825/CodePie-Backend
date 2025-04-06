const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const getContestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isAdminUser = req.user?.role === 'ADMIN';
        const userId = req.user?.id || req.body.userId; // Get userId from authenticated user or request body

        const contest = await prisma.contest.findUnique({
            where: { id },
            include: {
                problems: {
                    where: {
                        isVisible: isAdminUser ? undefined : true
                    },
                    select: {
                        id: true,
                        title: true,
                        difficultyLevel: true,
                        points: true,
                    }
                },
            }
        });

        if (!contest) {
            return next(new ApiError(404, 'Contest not found', null, `/contests/${id}`));
        }

        // Check if contest is visible to non-admin users
        if (!isAdminUser && !contest.isVisible) {
            return next(new ApiError(403, 'Contest is not visible', null, `/contests/${id}`));
        }

        // Check if user has joined this contest
        let isJoined = false;
        if (userId) {
            const participation = await prisma.participation.findUnique({
                where: {
                    userId_contestId: {
                        userId: userId,
                        contestId: id
                    }
                }
            });
            isJoined = !!participation;
        }

        // Add isJoined field to the response
        const responseData = {
            ...contest,
            isJoined
        };

        res.json(new ApiResponse(responseData, "Fetched contest successfully"));
    } catch (error) {
        return next(new ApiError(500, "Couldn't fetch contests", error, "contests/getContestById"))
    }
}

module.exports = getContestById;