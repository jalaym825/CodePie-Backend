const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const getContestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isAdminUser = req.user?.role === 'ADMIN';

        const contest = await prisma.contest.findUnique({
            where: { id },
            include: {
                problems: {
                    where: {
                        isVisible: isAdminUser ? undefined : true
                    },
                    orderBy: {
                        orderInContest: 'asc'
                    },
                    select: {
                        id: true,
                        title: true,
                        difficultyLevel: true,
                        points: true,
                        orderInContest: true
                    }
                },
                participations: {
                    select: {
                        userId: true,
                        totalScore: true,
                        rank: true,
                        user: {
                            select: {
                                username: true,
                                fullName: true
                            }
                        }
                    },
                    orderBy: {
                        totalScore: 'desc'
                    },
                    take: 100 // Top 100 participants
                }
            }
        });

        if (!contest) {
            return next(new ApiError(404, 'Contest not found', null, `/contests/${id}`));
        }

        // Check if contest is visible to non-admin users
        if (!isAdminUser && !contest.isVisible) {
            return next(new ApiError(403, 'Contest is not visible', null, `/contests/${id}`));
        }

        res.json(new ApiResponse(contest, "Fetched contest successfully"));
    } catch (error) {
        return next(new ApiError(500, "Couldn't fetch contests", error, "contests/getContestById"))
    }
}

module.exports = getContestById;