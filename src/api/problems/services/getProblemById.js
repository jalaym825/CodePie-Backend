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

        // if contest is not started then don't return the problem
        if (problem.contest && new Date() < new Date(problem.contest.startTime)) {
            return next(new ApiError(403, 'Contest has not started yet', null, '/problems/getProblemById'));
        }

        // If we found the problem and it has associated contest data
        if (problem && problem.contest) {
            const contestEnded = new Date() > new Date(problem.contest.endTime);

            // Filter test cases based on visibility conditions
            if (!isAdminUser && !contestEnded) {
                problem.testCases = problem.testCases.map(tc => {
                    if(tc.isHidden) {
                        return {
                            id: tc.id,
                            isHidden: true,
                        }
                    } else {
                        return tc;
                    }
                });
            }
        } else if (problem && !isAdminUser) {
            // If no contest or contest not found, regular users still can't see hidden test cases
            problem.testCases = problem.testCases.map(tc => {
                if(tc.isHidden) {
                    return {
                        id: tc.id,
                        isHidden: true,
                    }
                } else {
                    return tc;
                }
            });
        }
        console.log(problem);

        res.json(new ApiResponse(problem, "Problem fetched successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/getAllProblems'));
    }
};

module.exports = getProblemById;
