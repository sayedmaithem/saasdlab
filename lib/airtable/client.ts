import Airtable from "airtable";

// This is a singleton client for Airtable.
// In a real environment, you must set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env.local

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

export const airtableClient = apiKey && baseId 
  ? new Airtable({ apiKey }).base(baseId) 
  : null;

export async function syncCaseToAirtable(caseData: any) {
  if (!airtableClient) {
    console.warn("Airtable not configured. Skipping sync.");
    return;
  }

  try {
    await airtableClient("Cases").create([
      {
        fields: {
          CaseID: caseData.id,
          Status: caseData.status,
          Doctor: caseData.doctor_name,
          Patient: caseData.patient_name,
        },
      },
    ]);
    console.log("Successfully synced case to Airtable.");
  } catch (error) {
    console.error("Error syncing to Airtable:", error);
  }
}
