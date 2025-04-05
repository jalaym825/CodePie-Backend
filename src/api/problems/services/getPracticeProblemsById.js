const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const getPracticeProblemsById = async (req, res, next) => {
    try {
        const { problemId } = req.params;
    
        // Check if problem exists and include only non-hidden test cases
        const problem = await prisma.problem.findUnique({
            where: { id: problemId, isPractice: true },
            include: { 
                testCases: {
                    where: {
                        isHidden: false
                    }
                } 
            },
        });
    
        if (!problem) {
            return next(
                new ApiError(404, "Problem not found", null, `/problems/practice/${problemId}`)
            );
        }
    
        res.status(200).json(new ApiResponse(problem, "Problem fetched successfully"));
    } catch (error) {
        console.log(error);
        next(new ApiError(500, error.message, error, `/problems/practice/${problemId}`));
    }
}

module.exports = getPracticeProblemsById;