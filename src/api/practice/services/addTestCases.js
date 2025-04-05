const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");

const getDifficultyLevel = (level) => {
    switch (level) {
        case "EASY":
            return 1;
        case "MEDIUM":
            return 2;
        case "HARD":
            return 3;
        default:
            return 1; // Default to EASY if not specified
    }
};

const addTestcases = async (req, res, next) => {
    try {
        const { problemId, testCases } = req.body;

        // Check if problem exists and get existing test cases
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { 
                contest: true,
                testCases: true 
            }
        });

        if (!problem) {
            return next(new ApiError(404, 'Problem not found', null, '/practice/addTestcases'));
        }

        // Get existing test cases
        const existingTestCases = problem.testCases || [];
        
        // Filter only hidden test cases for point calculations
        const existingHiddenTestCases = existingTestCases.filter(tc => tc.isHidden);
        const newHiddenTestCases = testCases.filter(tc => tc.isHidden);
        const allHiddenTestCases = [...existingHiddenTestCases, ...newHiddenTestCases];
        
        // Calculate distribution weight based on difficulty levels for all hidden test cases
        let easyCount = 0;
        let mediumCount = 0;
        let hardCount = 0;

        // Count existing hidden test cases by difficulty
        existingHiddenTestCases.forEach(tc => {
            switch (tc.difficulty) {
                case "EASY":
                    easyCount++;
                    break;
                case "MEDIUM":
                    mediumCount++;
                    break;
                case "HARD":
                    hardCount++;
                    break;
                default:
                    easyCount++; // Default to EASY if not specified
            }
        });

        // Count new hidden test cases by difficulty
        newHiddenTestCases.forEach(tc => {
            switch (tc.difficulty || "EASY") {
                case "EASY":
                    easyCount++;
                    break;
                case "MEDIUM":
                    mediumCount++;
                    break;
                case "HARD":
                    hardCount++;
                    break;
            }
        });

        const totalWeight = easyCount + (2 * mediumCount) + (3 * hardCount);
        
        // If totalWeight is 0 (no hidden test cases), default to equal distribution
        const pointsToDistribute = problem.points || 100;
        const defaultPointsPerCase = allHiddenTestCases.length > 0 ? pointsToDistribute / allHiddenTestCases.length : 0;

        // Recalculate points for all existing hidden test cases
        if (existingHiddenTestCases.length > 0 && totalWeight > 0) {
            await Promise.all(existingHiddenTestCases.map(async tc => {
                const difficultyValue = getDifficultyLevel(tc.difficulty);
                const newPoints = parseFloat(((pointsToDistribute / totalWeight) * difficultyValue).toFixed(2));
                
                await prisma.testCase.update({
                    where: { id: tc.id },
                    data: { points: newPoints }
                });
            }));
        }

        // Create the new test cases with calculated points
        const createdTestCases = await prisma.$transaction(
            testCases.map(testCase => {
                if (!testCase.isHidden) {
                    // Non-hidden test cases always get 0 points
                    return prisma.testCase.create({
                        data: {
                            problemId,
                            input: testCase.input || "",
                            output: testCase.output || "",
                            explanation: testCase.explanation || null,
                            isHidden: false,
                            difficulty: testCase.difficulty || "EASY",
                            points: 0
                        }
                    });
                } else {
                    // For hidden test cases, calculate points based on difficulty
                    const difficulty = testCase.difficulty || "EASY";
                    const difficultyValue = getDifficultyLevel(difficulty);
                    
                    // Calculate points for this test case: (problemPoint / totalWeight * difficultyValue)
                    let testCasePoints = totalWeight > 0 
                        ? (pointsToDistribute / totalWeight) * difficultyValue 
                        : defaultPointsPerCase;
                    
                    // Round to two decimal places
                    testCasePoints = parseFloat(testCasePoints.toFixed(2));
                    
                    return prisma.testCase.create({
                        data: {
                            problemId,
                            input: testCase.input || "",
                            output: testCase.output || "",
                            explanation: testCase.explanation || null,
                            isHidden: true,
                            difficulty: difficulty,
                            points: testCasePoints
                        }
                    });
                }
            })
        );

        // Get updated test cases after all changes
        const updatedTestCases = await prisma.testCase.findMany({
            where: { problemId }
        });
        
        // Calculate total points from updated test cases
        const totalPoints = updatedTestCases.reduce((sum, testCase) => 
            testCase.isHidden ? sum + testCase.points : sum, 0);

        // Return success response with created test cases and total points
        res.status(201).json(
            new ApiResponse(
                { 
                    problemId, 
                    newTestCases: createdTestCases,
                    allTestCases: updatedTestCases,
                    totalPoints
                },
                'Test cases added successfully'
            )
        );
    } catch (err) {
        next(new ApiError(500, err.message, err, '/practice/addTestcases'));
    }
};

module.exports = addTestcases;
