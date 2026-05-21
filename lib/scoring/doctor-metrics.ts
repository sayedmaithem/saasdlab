export type DoctorMetricInput = {
  totalCases: number;
  missingInfoCases: number;
  remakes: number;
  urgentCases: number;
  rejectedDesigns: number;
  invoicesTotal: number;
  remainingBalance: number;
};

function rate(part: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 1000) / 10;
}

export function calculateDoctorMetrics(input: DoctorMetricInput) {
  const missingInformationRate = rate(
    input.missingInfoCases,
    input.totalCases,
  );
  const remakeRate = rate(input.remakes, input.totalCases);
  const urgentCasePercentage = rate(input.urgentCases, input.totalCases);
  const designRejectionRate = rate(input.rejectedDesigns, input.totalCases);
  const balanceRate = rate(input.remainingBalance, input.invoicesTotal || 1);
  const paymentCommitmentScore = Math.max(0, Math.round(100 - balanceRate));

  return {
    missingInformationRate,
    remakeRate,
    urgentCasePercentage,
    designRejectionRate,
    paymentCommitmentScore,
    averageResponseTimeHours: null as number | null,
  };
}
