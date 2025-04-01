const { z } = require("zod");

const updateProblemDto = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    timeLimit: z.number().int().min(100).max(10000).optional(),
    memoryLimit: z.number().int().min(32).max(1024).optional(),
    points: z.number().int().min(0).optional(),
    isVisible: z.boolean().optional()
});

module.exports = updateProblemDto;