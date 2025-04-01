const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const updateProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, difficultyLevel, timeLimit, memoryLimit, points, isVisible } = req.data;

        // Check if problem exists
        const existingProblem = await prisma.problem.findUnique({
            where: { id }
        });

        if (!existingProblem) {
            return next(new ApiError(404, 'Problem not found', null, '/problems/updateProblem'));
        }

        const updatedProblem = await prisma.problem.update({
            where: { id },
            data: {
                title: title ?? existingProblem.title,
                description: description ?? existingProblem.description,
                difficultyLevel: difficultyLevel ?? existingProblem.difficultyLevel,
                timeLimit: timeLimit ?? existingProblem.timeLimit,
                memoryLimit: memoryLimit ?? existingProblem.memoryLimit,
                points: points ?? existingProblem.points,
                isVisible: isVisible ?? existingProblem.isVisible
            }
        });

        res.json(new ApiResponse(updatedProblem, "Problem updated successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/updateProblem'));
    }
};

module.exports = updateProblem;
