const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const updateProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            description, 
            difficultyLevel, 
            timeLimit, 
            memoryLimit, 
            points, 
            isVisible,
            testCases 
        } = req.body;


        // Check if problem exists
        const existingProblem = await prisma.problem.findUnique({
            where: { id },
            include: {
                contest: {
                    select: {
                        startTime: true,
                        endTime: true
                    }
                },
                testCases: true
            }
        });

        if (!existingProblem) {
            return next(new ApiError(404, 'Problem not found', null, '/problems/updateProblem'));
        }

        // Check if the problem is part of any live contest
        const currentTime = new Date();
        const isPartOfLiveContest = existingProblem.contests && existingProblem.contests.some(
            contest => currentTime >= new Date(contest.startTime) && currentTime <= new Date(contest.endTime)
        );

        // Prepare update data for problem
        const updateData = {};
        
        // Always updatable fields
        updateData.title = title ?? existingProblem.title;
        updateData.description = description ?? existingProblem.description;
        updateData.timeLimit = timeLimit ?? existingProblem.timeLimit;
        updateData.memoryLimit = memoryLimit ?? existingProblem.memoryLimit;
        updateData.isVisible = isVisible ?? existingProblem.isVisible;
        
        // Fields that can't be updated if contest is live
        if (!isPartOfLiveContest) {
            updateData.difficultyLevel = difficultyLevel ?? existingProblem.difficultyLevel;
            updateData.points = points ?? existingProblem.points;
        } else if (difficultyLevel !== undefined || points !== undefined) {
            return next(new ApiError(403, 'Cannot update difficulty level or points while the problem is part of a live contest', null, '/problems/updateProblem'));
        }

        // Handle testcases updates if provided
        if (testCases && Array.isArray(testCases)) {
            // Check if trying to add new testcases during live contest
            if (isPartOfLiveContest) {
                const existingTestcaseIds = existingProblem.testCases.map(tc => tc.id);
                const newTestcases = testCases.filter(tc => !tc.id || !existingTestcaseIds.includes(tc.id));
                
                if (newTestcases.length > 0) {
                    return next(new ApiError(403, 'Cannot add new testcases while the problem is part of a live contest', null, '/problems/updateProblem'));
                }
                
                // Check for difficulty updates in existing testcases
                const hasInvalidUpdates = testCases.some(tc => {
                    const existingTestcase = existingProblem.testCases.find(et => et.id === tc.id);
                    return existingTestcase && tc.difficulty !== undefined && tc.difficulty !== existingTestcase.difficulty;
                });
                
                if (hasInvalidUpdates) {
                    return next(new ApiError(403, 'Cannot update testcase difficulty while the problem is part of a live contest', null, '/problems/updateProblem'));
                }
            }
        }

        // Update the problem first
        const updatedProblem = await prisma.problem.update({
            where: { id },
            data: updateData
        });

        // Handle testcase updates separately if provided
        if (testCases && Array.isArray(testCases)) {
            for (const testcase of testCases) {
                if (testcase.id) {
                    // Update existing testcase
                    const testcaseUpdateData = {
                        input: testcase.input,
                        output: testcase.output,
                        explanation: testcase.explanation
                    };
                    
                    // Only update difficulty if not in live contest
                    if (!isPartOfLiveContest && testcase.difficulty !== undefined) {
                        testcaseUpdateData.difficulty = testcase.difficulty;
                    }
                    await prisma.testCase.update({
                        where: { id: testcase.id },
                        data: testcaseUpdateData
                    });
                } else if (!isPartOfLiveContest) {
                    // Create new testcase only if not in live contest
                    await prisma.testCase.create({
                        data: {
                            ...testcase,
                            problemId: id
                        }
                    });
                }
            }
        }

        // Fetch the updated problem with latest testcases
        const finalProblem = await prisma.problem.findUnique({
            where: { id },
            include: {
                testCases: true
            }
        });

        res.json(new ApiResponse(finalProblem, "Problem updated successfully"));
    } catch (err) {
        next(new ApiError(500, err.message, err, '/problems/updateProblem'));
    }
};

module.exports = updateProblem;