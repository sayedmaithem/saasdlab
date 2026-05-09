import type { CreateCaseInput } from "@/lib/validations/case";

export type PriorityCaseInput = Pick<
  CreateCaseInput,
  "isUrgent" | "dueDate" | "unitsCount" | "isRemake" | "complexity"
> & {
  isVipDoctor?: boolean;
  currentStageDelayDays?: number;
};

export function calculateCasePriority(input: PriorityCaseInput) {
  let score = 0;
  const today = new Date();

  if (input.isUrgent) score += 35;
  if (input.isVipDoctor) score += 15;
  if (input.isRemake) score += 18;
  if (input.unitsCount >= 6) score += 10;
  if (input.unitsCount >= 10) score += 8;
  if (input.complexity === "complex") score += 16;
  if (input.complexity === "standard") score += 8;

  if (input.dueDate) {
    const dueDate = new Date(`${input.dueDate}T00:00:00`);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / 86_400_000,
    );

    if (daysUntilDue < 0) score += 40;
    else if (daysUntilDue <= 1) score += 30;
    else if (daysUntilDue <= 3) score += 20;
    else if (daysUntilDue <= 7) score += 10;
  }

  if (input.currentStageDelayDays && input.currentStageDelayDays > 1) {
    score += Math.min(20, input.currentStageDelayDays * 4);
  }

  return Math.min(100, score);
}
