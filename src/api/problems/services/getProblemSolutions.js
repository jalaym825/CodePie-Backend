const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");


const getProblemSolustions = async (req, res, next) => {
    try {
     const {problemId} = req.params;
        const { userId } = req.user;

        // Check if problem exists
        const problem = await prisma.problem.findUnique({
            where: { id: problemId, isPractice: true },
        });

        if (!problem) {
            return next(
                new ApiError(404, "Problem not found", null, `/problem/solustions//${req.params.problemId}`)
            );
        }

        // Fetch solutions for the problem
        const solutions = await prisma.submission.findMany({
            where: {
                problemId,
                userId,
                isPublished: true,
            },
            select:{
                id:true,
                languageId:true,
                memoryUsed:true,
                submittedAt:true,
                userId:true,
            }
        });

        res.status(200).json(new ApiResponse(solutions, "Solutions fetched successfully"));
    } catch (error) {
        console.log(error);
        next(new ApiError(500, error.message, error, `/problem/solustions//${req.params.problemId}`));
    }
}

module.exports = getProblemSolustions;