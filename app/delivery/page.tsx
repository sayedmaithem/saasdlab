import { DeliveryTracker } from "@/components/delivery/delivery-tracker";

export const metadata = {
  title: "Delivery Management | LabFlow",
};

export default function DeliveryPage() {
  return (
    <div className="w-full h-full min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground font-sans gradient-text">Delivery & Logistics</h1>
        <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest font-semibold">Active Fleet Tracking</p>
      </div>
      <DeliveryTracker />
    </div>
  );
}
