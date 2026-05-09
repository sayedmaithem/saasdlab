import { Activity } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="hidden border-e bg-card p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">LabFlow</p>
            <p className="text-sm text-muted-foreground">Dental CRM</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-medium text-muted-foreground">
            Secure lab operations
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            Multi-lab production, approvals, files, and finance in one system.
          </h1>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
