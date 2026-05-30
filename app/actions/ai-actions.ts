"use server";

import {
  checkCaseForMissingInfo,
  MissingInfoResult,
} from "@/lib/ai/missing-info-checker";

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server action to check a case for missing information using AI.
 * Designed to be called safely from client components.
 *
 * @param caseNotes The raw text or notes provided by the doctor for the case.
 * @param workType The type of dental work (e.g., "Zircon Crown", "Emax", "Implant").
 * @returns A standard result object containing either the missing info analysis or an error message.
 */
export async function checkCaseForMissingInfoAction(
  caseNotes: string,
  workType: string
): Promise<ServerActionResult<MissingInfoResult>> {
  try {
    if (!caseNotes || typeof caseNotes !== "string") {
      return {
        success: false,
        error: "Case notes must be a valid string.",
      };
    }

    if (!workType || typeof workType !== "string") {
      return {
        success: false,
        error: "Work type must be a valid string.",
      };
    }

    const result = await checkCaseForMissingInfo(caseNotes, workType);

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("[checkCaseForMissingInfoAction] Internal error:", error);
    return {
      success: false,
      error:
        error?.message ||
        "An unexpected error occurred while verifying case information.",
    };
  }
}
