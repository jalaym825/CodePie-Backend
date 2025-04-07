const { z } = require("zod");

// Define the test case schema
const testCaseSchema = z.object({
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

// Update the problem schema to include test cases
const problemSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title is required"),
  description: z
    .string({ required_error: "Description is required" })
    .min(1, "Description is required"),
  difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD"], {
    required_error: "Difficulty level is required",
  }),
  timeLimit: z
    .number({ required_error: "Time limit is required" })
    .positive("Time limit must be a positive number"),
  memoryLimit: z
    .number({ required_error: "Memory limit is required" })
    .positive("Memory limit must be a positive number"),
  points: z
    .number({ required_error: "Points are required" })
    .int()
    .nonnegative("Points must be a non-negative integer"),
  isVisible: z.boolean({ required_error: "Visibility status is required" }),
  isPractice: z.boolean({ required_error: "Practice status is required" }),
  contestId: z.string(),
  testCases: z
    .array(testCaseSchema, { required_error: "Test cases is required" })
    .min(1, { message: "At least one test case is required" }),
});

module.exports = problemSchema;
