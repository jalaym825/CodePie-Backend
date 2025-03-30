const { z } = require("zod");

// Schema for adding test cases to an existing problem
const addTestcasesSchema = z.object({
    problemId: z.string({ required_error: "Problem ID is required" }).uuid({ message: "Invalid problem ID format" }),
    testCases: z.array(
        z.object({
            input: z.string({ required_error: "Test case input is required" }).min(1, "Test case input cannot be empty"),
            output: z.string({ required_error: "Test case output is required" }).min(1, "Test case output cannot be empty"),
            explanation: z.string().optional().nullable(),
            isHidden: z.boolean().default(false),
            points: z.number({ required_error: "Test case points are required" })
                .int()
                .nonnegative("Points must be a non-negative integer")
                .default(10)
        })
    ).min(1, { message: "At least one test case must be provided" })
});

module.exports = addTestcasesSchema;

