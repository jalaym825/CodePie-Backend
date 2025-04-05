const ApiResponse = require("@entities/ApiResponse");
const ApiError = require("@entities/ApiError");
const prisma = require("@utils/prisma");
const { createLogger, log } = require("winston");

const getDifficultyLevel = (level) => {
  switch (level) {
    case "EASY":
      return 1;
    case "MEDIUM":
      return 2;
    case "HARD":
      return 3;
    default:
      throw new ApiError(
        400,
        "Invalid difficulty level",
        null,
        "/practice/createProblem"
      );
  }
};

const createProblem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficultyLevel,
      timeLimit,
      memoryLimit,
      points,
      isVisible,
      testCases,
      isPractice,
    } = req.body;

    // Filter only hidden test cases for point calculations
    const hiddenTestCases = testCases.filter(tc => tc.isHidden === true);

    // Calculate distribution weight based on difficulty levels for HIDDEN test cases only
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    hiddenTestCases.forEach((tc) => {
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

    const totalWeight = easyCount + 2 * mediumCount + 3 * hardCount;

    // If no hidden test cases, default points per hidden case will be 0
    const defaultPointsPerCase = 
      hiddenTestCases.length > 0 ? points / hiddenTestCases.length : 0;

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficultyLevel: difficultyLevel || 1,
        timeLimit: timeLimit || 1000,
        memoryLimit: memoryLimit || 256,
        points: points || 100,
        isVisible: isVisible !== undefined ? isVisible : true,
        isPractice,
        testCases: {
          create:
            testCases && Array.isArray(testCases)
              ? testCases.map((tc) => {
                  // If test case is not hidden, assign zero points regardless of difficulty
                  if (!tc.isHidden) {
                    return {
                      input: tc.input || "",
                      output: tc.output || "",
                      explanation: tc.explanation || null,
                      isHidden: false,
                      difficulty: tc.difficulty || "EASY",
                      points: 0,
                    };
                  }
                  
                  // For hidden test cases, calculate points based on difficulty
                  const difficulty = tc.difficulty || "EASY";
                  const difficultyValue = getDifficultyLevel(difficulty);

                  // Calculate points for this test case based on difficulty weighting
                  let testCasePoints =
                    totalWeight > 0
                      ? (points / totalWeight) * difficultyValue
                      : defaultPointsPerCase;

                  // Round to two decimal places
                  testCasePoints = parseFloat(testCasePoints.toFixed(2));

                  return {
                    input: tc.input || "",
                    output: tc.output || "",
                    explanation: tc.explanation || null,
                    isHidden: true,
                    difficulty: difficulty,
                    points: testCasePoints,
                  };
                })
              : [
                  {
                    input: "",
                    output: "",
                    isSample: true,
                    isHidden: false,
                    points: 0,
                  },
                ],
        },
      },
      include: {
        testCases: true,
      },
    });

    // Calculate total points from hidden test cases to verify correct distribution
    const totalAssignedPoints = problem.testCases.reduce(
      (sum, testCase) => (testCase.isHidden ? sum + testCase.points : sum),
      0
    );

    res
      .status(201)
      .json(new ApiResponse({
        ...problem,
        totalPoints: totalAssignedPoints
      }, "Problem created successfully"));
  } catch (err) {
    next(new ApiError(400, err.message, err, "/practice/createProblem"));
  }
};

module.exports = createProblem;