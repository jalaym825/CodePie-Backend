const {z} = require("zod");

const updateContestDto = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    isVisible: z.boolean().optional()
}).refine((data) => {
    if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
}, {
    message: "End time must be after start time", path: ["endTime"]
});

module.exports = updateContestDto;
