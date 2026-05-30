"use server";

export type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// --- Generate Invoice ---

export interface InvoiceData {
  id: string;
  labId: string;
  doctorId: string;
  caseIds: string[];
  totalAmount: number;
  status: "DRAFT" | "PENDING" | "PAID";
  createdAt: Date;
}

/**
 * Generates an invoice for a specific doctor and set of cases.
 * 
 * @param labId - The ID of the lab generating the invoice
 * @param doctorId - The ID of the doctor being billed
 * @param caseIds - Array of case IDs to include in this invoice
 * @returns An action response containing the newly generated InvoiceData or an error message
 */
export async function generateInvoiceAction(
  labId: string,
  doctorId: string,
  caseIds: string[]
): Promise<ActionResponse<InvoiceData>> {
  try {
    // TODO: Implement actual database logic (fetch cases, calculate totals, insert invoice, insert items)
    
    // Mock success response
    const mockInvoice: InvoiceData = {
      id: `INV-${Date.now()}`,
      labId,
      doctorId,
      caseIds,
      totalAmount: 1250.00, // Mock calculated amount
      status: "DRAFT",
      createdAt: new Date(),
    };

    return {
      success: true,
      data: mockInvoice,
    };
  } catch (error) {
    console.error("Error generating invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred while generating the invoice.",
    };
  }
}

// --- Record Payment ---

export interface PaymentData {
  id: string;
  invoiceId: string;
  amount: number;
  recordedAt: Date;
}

/**
 * Records a payment made against a specific invoice.
 * 
 * @param invoiceId - The ID of the invoice being paid
 * @param amount - The amount paid
 * @returns An action response containing the recorded PaymentData or an error message
 */
export async function recordPaymentAction(
  invoiceId: string,
  amount: number
): Promise<ActionResponse<PaymentData>> {
  try {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    // TODO: Implement actual database logic (insert payment, update invoice status/balance)
    
    // Mock success response
    const mockPayment: PaymentData = {
      id: `PAY-${Date.now()}`,
      invoiceId,
      amount,
      recordedAt: new Date(),
    };

    return {
      success: true,
      data: mockPayment,
    };
  } catch (error) {
    console.error("Error recording payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred while recording the payment.",
    };
  }
}
