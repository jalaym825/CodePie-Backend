const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const addTestcases = async (req, res, next) => {
    try {
        const { problemId, testCases } = req.body;

        // Check if problem exists
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { contest: true }
        });

        if (!problem) {
            return next(new ApiError(404, 'Problem not found', null, '/problems/addTestcases'));
        }

        // Create the test cases
        const createdTestCases = await prisma.$transaction(
            testCases.map(testCase =>
                prisma.testCase.create({
                    data: {
                        problemId,
                        input: testCase.input,
                        output: testCase.output,
                        explanation: testCase.explanation,
                        isHidden: testCase.isHidden,
                        points: testCase.points
                    }
                })
            )
        );

        // Return success response with created test cases
        res.status(201).json(
            new ApiResponse(
                { problemId, testCases: createdTestCases },
                'Test cases added successfully'
            )
        );
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/addTestcases'));
    }
};

module.exports = addTestcases;
