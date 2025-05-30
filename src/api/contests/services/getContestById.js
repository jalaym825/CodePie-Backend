const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma")
const ApiResponse = require("@entities/ApiResponse");

const getContestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isAdminUser = req.user?.role === 'ADMIN';
        const userId = req.user?.id;
        
        const contest = await prisma.contest.findUnique({
            where: { id },
            include: {
                problems: {
                    select: {
                        id: true,
                        title: true,
                        difficultyLevel: true,
                        points: true,
                        submissions: {
                            select: {
                                status: true,
                                userId: true
                            }
                        }
                    },
                    orderBy: [
                        { points: "asc" },
                        { createdAt: "asc" }
                    ]
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

        // Calculate acceptance rate for each problem and check if user has solved it
        contest.problems = contest.problems.map(problem => {
            const totalSubmissions = problem.submissions.length;
            console.log(problem.id, totalSubmissions);
            const acceptedSubmissions = problem.submissions.filter(
                submission => submission.status === 'ACCEPTED'
            ).length;

            const acceptanceRate = totalSubmissions > 0
                ? (acceptedSubmissions / totalSubmissions) * 100
                : 0;

            const formattedAcceptanceRate = Number(acceptanceRate.toFixed(2));
            
            // Check if the current user has solved this problem
            const isSolved = userId 
                ? problem.submissions.some(
                    submission => submission.userId === userId && submission.status === 'ACCEPTED'
                  )
                : false;

            const { submissions, ...problemData } = problem;

            return {
                ...problemData,
                acceptanceRate: formattedAcceptanceRate,
                totalSubmissions,
                isSolved
            };
        });

        // if contest isn't started, don't send problems, send other info only
        if (!isAdminUser && new Date() < new Date(contest.startTime)) {
            contest.problems = [];
        }

        // Check if user has joined this contest
        let isJoined = false;
        if (req.user) {
            const participation = await prisma.participation.findUnique({
                where: {
                    userId_contestId: {
                        userId: req.user.id,
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