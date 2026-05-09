import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FoundationRoute } from "@/types/app";

export function ModuleScaffold({
  route,
}: {
  route: FoundationRoute;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {route.eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{route.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {route.description}
        </p>
      </div>
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">Architecture</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Route is registered and ready for tenant-scoped data access.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Security</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Future data reads and writes must pass through RLS and role checks.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Implementation</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Business UI will be added in its dedicated phase.
            </p>
          </div>
        </CardContent>
      </Card>
      {route.primaryAction ? (
        <Button asChild>
          <a href={route.primaryAction.href}>{route.primaryAction.label}</a>
        </Button>
      ) : null}
    </div>
  );
}
