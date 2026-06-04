import { z } from "zod";

export const ADMIN_ROLES = ["admin", "staff"] as const;

/** Grant a role to an EXISTING Firebase Auth user, looked up by email. */
export const grantStaffSchema = z.object({
  email: z.string().email("И-мэйл буруу байна"),
  role: z.enum(ADMIN_ROLES),
});

export const updateRoleSchema = z.object({
  role: z.enum(ADMIN_ROLES),
});

export type GrantStaffInput = z.infer<typeof grantStaffSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
