import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    // Length matters more than symbol rules. The max stops absurdly long inputs
    // from wasting CPU, since hashing cost grows with the input.
    password: z.string().min(10, "Use at least 10 characters.").max(128, "Use 128 characters or fewer."),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{9,15}$/, "Use digits only, like 0712345678.")
      .optional(),
    organizationName: z.string().trim().min(2, "Enter your organization or building name.").max(100),
  })
  .strict(); // unknown fields (like "role") are an error, not silently ignored

export type SignupInput = z.infer<typeof signupSchema>;


export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    // No length rule here: login should never reveal what the password rules are.
    password: z.string().min(1, "Enter your password.").max(128),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;