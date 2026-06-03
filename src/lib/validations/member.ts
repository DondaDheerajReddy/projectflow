import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
});

export const updateMemberSchema = z.object({
  role: z.enum(["OWNER", "MEMBER"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;