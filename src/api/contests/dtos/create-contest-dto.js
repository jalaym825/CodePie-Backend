const { z } = require("zod");

const createContestSchema = z.object({
    title: z.string({ required_error: "Title is required" }).min(1, "Title is required"),
    description: z.string({ required_error: "Description is required" }).min(1, "Description is required"),
    startTime: z.string({ required_error: "Start time is required" })
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start time" }),
    endTime: z.string({ required_error: "End time is required" })
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end time" }),
    isVisible: z.boolean().optional(),
});

module.exports = createContestSchema;
