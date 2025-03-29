const {z} = require("zod")

const registerDto = z.object({
    email: z.string({ required_error: "Email is required" }).trim().email({ message: "Invalid email address" }),
    password: z.string({ required_error: "Password is required" }).trim().min(6, "Password must be at least 6 characters long"),
    firstName: z.string({ required_error: "First name is required" }).trim().min(2, "First name must be at least 2 characters long"),
    lastName: z.string({ required_error: "Last name is required" }).trim().min(2, "Last name must be at least 2 characters long"),
});
module.exports = registerDto;