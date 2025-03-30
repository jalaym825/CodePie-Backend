const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const createProblem = async (req, res, next) => {
    try {
        const {
            contestId, title, description, difficultyLevel, timeLimit, memoryLimit, points, isVisible, testCases
        } = req.body;

        // Check if contest exists
        const contest = await prisma.contest.findUnique({
            where: {id: contestId}
        });

        if (!contest) {
            return res.json(new ApiError(404, 'Contest not found', null, "/problems/createProblem"));
        }

        const problem = await prisma.problem.create({
            data: {
                contestId,
                title,
                description,
                difficultyLevel: difficultyLevel || 1,
                timeLimit: timeLimit || 1000,
                memoryLimit: memoryLimit || 256,
                points: points || 100,
                isVisible: isVisible !== undefined ? isVisible : true,
                testCases: {
                    create: testCases && Array.isArray(testCases) ? testCases.map(tc => ({
                        input: tc.input || '',
                        output: tc.output || '',
                        explanation: tc.explanation || null,
                        isHidden: tc.isHidden || false,
                        points: tc.points || 10,
                    })) : [{
                        input: '', output: '', isSample: true, isHidden: false, points: 0
                    }]
                }
            }, include: {
                testCases: true
            }
        });

        res.status(201).json(new ApiResponse(problem, 'Problem created successfully'));
    } catch (err) {
        next(new ApiError(400, err.message, err, '/problems/createProblem'));
    }
}

module.exports = createProblem;