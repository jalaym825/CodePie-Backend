const {z} = require("zod");

const loginDto = z.object({
    email: z.string({ required_error: "Email is required" }).trim().email({ message: "Invalid email address" }),
    password: z.string({ required_error: "Password is required" }).trim()
});
module.exports = loginDto;