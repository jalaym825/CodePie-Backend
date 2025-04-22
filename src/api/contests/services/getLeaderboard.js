const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");
const ApiResponse = require("@entities/ApiResponse");

const getLeaderboard = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get all participants
        const participations = await prisma.participation.findMany({
            where: {
                contestId: id
            },
            select: {
                userId: true,
                totalScore: true,
                joinedAt: true,
                scoreUpdatedAt: true,
                user: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: [
                { totalScore: 'desc' },
                { scoreUpdatedAt: 'asc' },
                { user: { name: 'asc' } }
            ]
        });

        // Get all problems for this contest
        const problems = await prisma.problem.findMany({
            where: {
                contestId: id
            },
            select: {
                id: true,
                title: true,
                difficultyLevel: true,
                points: true
            },
            orderBy: [
                { createdAt: 'asc' },
                { points: 'asc' }
            ]
        });

        // Get all submissions for this contest
        const submissions = await prisma.submission.findMany({
            where: {
                problem: {
                    contestId: id
                }
            },
            select: {
                userId: true,
                problemId: true,
                status: true,
                score: true,
                submittedAt: true
            }
        });

        // Process data to create enriched leaderboard
        const leaderboardData = participations.map((participation, index) => {
            // Get all submissions for this user
            const userSubmissions = submissions.filter(sub => sub.userId === participation.userId);

            // Calculate problems solved
            const solvedProblems = new Set(
                userSubmissions
                    .filter(sub => sub.status === "ACCEPTED")
                    .map(sub => sub.problemId)
            );

            // Calculate submission statistics
            const totalSubmissions = userSubmissions.length;
            const acceptedSubmissions = userSubmissions.filter(sub => sub.status === "ACCEPTED").length;

            // Calculate per-problem scores
            const problemScores = {};
            problems.forEach(problem => {
                // Find the best score for this problem
                const problemSubmissions = userSubmissions.filter(sub => sub.problemId === problem.id);
                const bestSubmission = problemSubmissions.length > 0
                    ? problemSubmissions.reduce((best, current) =>
                        (current.score > best.score) ? current : best, problemSubmissions[0])
                    : null;

                problemScores[problem.id] = {
                    problemId: problem.id,
                    title: problem.title,
                    difficulty: problem.difficultyLevel,
                    maxPoints: problem.points,
                    score: bestSubmission ? bestSubmission.score : 0,
                    status: bestSubmission ? bestSubmission.status : null,
                    attempts: problemSubmissions.length
                };
            });

            return {
                rank: index + 1,
                userId: participation.userId,
                user: participation.user,
                totalScore: participation.totalScore,
                solvedCount: solvedProblems.size,
                totalProblems: problems.length,
                submissionCount: totalSubmissions,
                acceptanceRate: totalSubmissions > 0
                    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
                    : 0,
                finishTime: participation.scoreUpdatedAt,
                problemScores: problemScores
            };
        });

        res.json(new ApiResponse({
            leaderboard: leaderboardData,
            problems: problems.map(p => ({
                id: p.id,
                title: p.title,
                difficulty: p.difficultyLevel,
                points: p.points
            }))
        }, "Leaderboard fetched successfully"));
    } catch (error) {
        return next(new ApiError(500, "Couldn't fetch leaderboard", error, "contests/getLeaderboard"));
    }
};

module.exports = getLeaderboard;