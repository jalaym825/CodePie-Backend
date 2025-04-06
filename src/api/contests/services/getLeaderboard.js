const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const getLeaderboard = async (req, res, next) => {
    try {
        const { id } = req.params;

        const leaderboard = await prisma.participation.findMany({
            where: {
                contestId: id
            },
            select: {
                userId: true,
                totalScore: true,
                rank: true,
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: [
                { totalScore: 'desc' },
                {scoreUpdatedAt: 'asc'},
                { user: { name: 'asc' } }
            ]
        });

        res.json(new ApiResponse(leaderboard, "Leaderboard fetched successfully"));
    } catch (error) {
        return next(new ApiError(500, "Couldn't fetch contests", error, "contests/getLeaderboard"));
    }
}

module.exports = getLeaderboard;