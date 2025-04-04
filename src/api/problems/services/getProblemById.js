const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const getProblemById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log("User: ",req.user);
        
        const isAdminUser = (req.user?.role === 'ADMIN');

        const problem = await prisma.problem.findUnique({
            where: { id },
            include: {
                testCases: {
                    where: {
                        // Regular users can only see non-hidden test cases
                        isHidden: isAdminUser ? undefined : false
                    }
                },
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

        res.json(new ApiResponse(problem, "Problem fetched successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/getAllProblems'));
    }
};

module.exports = getProblemById;
