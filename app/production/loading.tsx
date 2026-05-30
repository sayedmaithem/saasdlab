import { SkeletonPage } from "@/components/ui/skeleton";

export default function ProductionLoading() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">
      <SkeletonPage />
    </div>
  );
}
