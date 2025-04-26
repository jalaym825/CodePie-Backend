const { z } = require("zod");

// Define the test case schema
const testCaseSchema = z.object({
    id: z.string({required_error: "Test case ID is required"}).min(1, "Test case ID is required"),
    input: z
        .string({ required_error: "Test case input is required" })
        .min(1, "Test case input is required"),
    output: z
        .string({ required_error: "Test case output is required" })
        .min(1, "Test case output is required"),
    isHidden: z
        .boolean({ required_error: "Hidden status is required" })
        .default(false),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"], {
        required_error: "Difficulty level is required",
    }),
});

const updateProblemDto = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    timeLimit: z.number().int().min(100).max(10000).optional(),
    memoryLimit: z.number().int().min(32).max(1024).optional(),
    points: z.number().int().min(0).optional(),
    isVisible: z.boolean().optional(),
    testCases: z
        .array(testCaseSchema, { required_error: "Test cases is required" })
        .min(1, { message: "At least one test case is required" }),
});

module.exports = updateProblemDto;