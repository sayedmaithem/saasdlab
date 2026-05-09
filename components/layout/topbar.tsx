import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({
  title = "LabFlow Dental CRM",
  eyebrow = "Production command center",
}: {
  title?: string;
  eyebrow?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/90 px-4 backdrop-blur md:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <Button asChild size="sm">
        <Link href="/cases/new">
          <PlusCircle aria-hidden="true" />
          New case
        </Link>
      </Button>
    </header>
  );
}
