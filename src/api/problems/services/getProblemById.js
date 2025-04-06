const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const getProblemById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isAdminUser = (req.user?.role === 'ADMIN');

        const problem = await prisma.problem.findUnique({
            where: { id },
            include: {
                testCases: true,
                contest: true
            }
        });

        if (!problem) {
            return next(new ApiError(404, 'Problem not found', null, '/problems/getProblemById'));
        }

        // Check if the problem is visible to the user
        if (!isAdminUser && !problem.isVisible) {
            return next(new ApiError(403, 'Problem is not visible to you', null, '/problems/getProblemById'));
        }

        // If we found the problem and it has associated contest data
        if (problem && problem.contest) {
            const contestEnded = new Date() > new Date(problem.contest.endTime);

            // Filter test cases based on visibility conditions
            if (!isAdminUser && !contestEnded) {
                problem.testCases = problem.testCases.filter(tc => !tc.isHidden);
            }
        } else if (problem && !isAdminUser) {
            // If no contest or contest not found, regular users still can't see hidden test cases
            problem.testCases = problem.testCases.map(tc => {
                return {
                    id: tc.id
                }
            });
        }

        res.json(new ApiResponse(problem, "Problem fetched successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/getAllProblems'));
    }
};

module.exports = getProblemById;
