const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");


const getProblemSolustionsById = async (req, res, next) => {
    try {
        const { solutionId,problemId } = req.params;

        // Fetch the solution for the given problemId and userId
       const solution = await prisma.submission.findUnique({
            where: {
                id: solutionId,
                problemId: problemId,
                problem:{
                    isPractice: true,
                }
            },
            select: {
                id: true,
                sourceCode: true,
                languageId: true,
                memoryUsed: true,
                submittedAt: true,
                score: true,
                status: true,
            },
        });

        if (!solution) {
            return next(
                new ApiError(404, "Solution not found", null, `/problem/${problemId}/solution/${solutionId}`)
            );
        }
        res.status(200).json(new ApiResponse(solution, "Solution fetched successfully"));
    } catch (error) {
        console.log(error);
        next(new ApiError(500, error.message, error, `/problem/${problemId}/solution/${solutionId}`));
    }
}

module.exports = getProblemSolustionsById;

