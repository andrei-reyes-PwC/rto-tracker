import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address.")
    .refine((email) => email.slice(email.lastIndexOf("@") + 1).includes("."), {
      message: "Use an email address with a dotted domain, such as you@company.com.",
    }),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
