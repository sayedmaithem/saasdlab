import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type ClinicListItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  doctorsCount: number;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) {
    throw new Error("No active lab was found for this user.");
  }

  return session.activeLabId;
}

export async function getClinics(session: AuthSessionContext) {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const [{ data: clinics, error: clinicsError }, { data: doctors, error: doctorsError }] =
    await Promise.all([
      supabase
        .from("clinics")
        .select("id, name, phone, email, address, notes, is_active")
        .eq("lab_id", labId)
        .order("name")
        .returns<
          Array<{
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            address: string | null;
            notes: string | null;
            is_active: boolean;
          }>
        >(),
      supabase
        .from("doctors")
        .select("id, default_clinic_id")
        .eq("lab_id", labId)
        .returns<Array<{ id: string; default_clinic_id: string | null }>>(),
    ]);

  const error = clinicsError ?? doctorsError;

  if (error) {
    throw new Error(error.message);
  }

  return (clinics ?? []).map(
    (clinic): ClinicListItem => ({
      id: clinic.id,
      name: clinic.name,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      notes: clinic.notes,
      isActive: clinic.is_active,
      doctorsCount: (doctors ?? []).filter(
        (doctor) => doctor.default_clinic_id === clinic.id,
      ).length,
    }),
  );
}
