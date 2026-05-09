export type DoctorScoreInput = {
  approvalRate: number;
  remakeRate: number;
  averagePaymentDelayDays: number;
};

export function calculateDoctorPerformanceScore(input: DoctorScoreInput) {
  const approvalScore = Math.min(input.approvalRate, 100) * 0.5;
  const remakeScore = Math.max(0, 100 - input.remakeRate * 10) * 0.3;
  const paymentScore =
    Math.max(0, 100 - input.averagePaymentDelayDays * 2) * 0.2;

  return Math.round((approvalScore + remakeScore + paymentScore) * 100) / 100;
}
