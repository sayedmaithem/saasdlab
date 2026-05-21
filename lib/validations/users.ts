import { z } from "zod";

/**
 * Roles that can be created via the in-app invite console.
 *
 * lab_owner and super_admin are EXPLICITLY excluded:
 *  - lab_owner must be assigned directly in Supabase or via a privileged migration
 *  - super_admin is a platform-level role, never assignable per-lab
 *
 * This mirrors the guard in migration 0014 admin_link_portal_account().
 */
export const creatableRoles = [
  "lab_manager",
  "reception",
  "technician",
  "accountant",
  "doctor",
  "delivery",
] as const;

export type CreatableRole = (typeof creatableRoles)[number];

export const linkedRecordTypes = ["technician", "doctor", "staff"] as const;

/**
 * Schema for creating a new portal user or invite record.
 *
 * Two creation modes:
 *  1. "direct" — temporaryPassword provided, admin creates auth user immediately
 *  2. "invite" — no password, creates a pending invitation record only
 *
 * Security rules enforced here (mirrored in the server action):
 *  - Cannot create lab_owner or super_admin
 *  - Email must be valid
 *  - If password provided: min 10 chars, at least one letter and one digit
 *  - linkedRecordId only meaningful when role matches linkedRecordType
 */
export const CreatePortalUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120).trim(),

  email: z.string().email("Enter a valid email address").toLowerCase().trim(),

  role: z.enum(creatableRoles, {
    error: "Select a valid role. lab_owner and super_admin cannot be assigned here.",
  }),

  /**
   * Optional temporary password.
   * When present: user is created immediately with this password.
   * When absent:  a pending invitation record is created only.
   *
   * Never log, display, or return this value after validation.
   */
  temporaryPassword: z
    .string()
    .optional()
    .refine(
      (pw) => !pw || pw.length >= 10,
      "Temporary password must be at least 10 characters",
    )
    .refine(
      (pw) => !pw || /[a-zA-Z]/.test(pw),
      "Password must contain at least one letter",
    )
    .refine(
      (pw) => !pw || /[0-9]/.test(pw),
      "Password must contain at least one number",
    ),

  /** Link this account to an existing doctor or technician record */
  linkedRecordType: z.enum(linkedRecordTypes).optional(),

  /** The UUID of the doctor/technician record to link */
  linkedRecordId: z.string().uuid("Linked record ID must be a valid UUID").optional(),

  /** Whether to activate the account immediately (default: true) */
  isActive: z.boolean().default(true),

  /**
   * Future: trigger an email invite via Resend.
   * Currently ignored (email sending is Phase 14).
   */
  sendEmail: z.boolean().default(false),

  /** Internal notes visible only to the lab owner */
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    // If a linked record is provided, its type must match the role where sensible
    if (data.linkedRecordId && data.linkedRecordType) {
      if (data.role === "technician" && data.linkedRecordType !== "technician") return false;
      if (data.role === "doctor" && data.linkedRecordType !== "doctor") return false;
    }
    return true;
  },
  {
    message: "Linked record type must match the assigned role (e.g. doctor → doctor record)",
    path: ["linkedRecordType"],
  },
);

export type CreatePortalUserInput = z.infer<typeof CreatePortalUserSchema>;
