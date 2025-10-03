import z, { email } from "zod";

export const loginUserSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .trim()
    .min(5, { message: "Password must be at least 5 chars long" }),
});

export const registerUserSchema = loginUserSchema.extend({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 chars long" })
    .max(100, { message: "Name must be less than 100 chars" })
});
 
export const verifyEmailSchema=  z.object({
  token:z.string().trim().length(8),
  email:z.string().trim().email()
});