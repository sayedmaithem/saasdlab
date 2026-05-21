"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  Route,
  Truck,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import type { CaseDetail } from "@/lib/data/cases";
import {
  timelineEventLabels,
  timelineEventTypes,
  type TimelineEventType,
} from "@/lib/timeline/events";

type TimelineEvent = CaseDetail["timeline"][number];

const icons: Record<
  TimelineEventType,
  ComponentType<{ className?: string }>
> = {
  created: CheckCircle2,
  updated: RefreshCw,
  stage_changed: Route,
  comment_added: MessageSquare,
  file_uploaded: FileUp,
  design_submitted: ClipboardCheck,
  approval_updated: ClipboardCheck,
  qc_recorded: PackageCheck,
  invoice_created: BadgeDollarSign,
  payment_recorded: WalletCards,
  delivery_updated: Truck,
  remake_created: RefreshCw,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: string | null) {
  return role ? role.replaceAll("_", " ") : "system";
}

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  const [filter, setFilter] = useState<TimelineEventType | "all">("all");
  const filteredEvents = useMemo(
    () =>
      filter === "all"
        ? events
        : events.filter((event) => event.eventType === filter),
    [events, filter],
  );

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as TimelineEventType | "all")
          }
        >
          <option value="all">All events</option>
          {timelineEventTypes.map((eventType) => (
            <option key={eventType} value={eventType}>
              {timelineEventLabels[eventType]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const Icon = icons[event.eventType];

            return (
              <article
                key={event.id}
                className="grid grid-cols-[32px_1fr] gap-3 rounded-lg border bg-background p-3"
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <Badge tone="neutral">
                      {timelineEventLabels[event.eventType]}
                    </Badge>
                  </div>
                  {event.details ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.details}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.actorName} ({roleLabel(event.actorRole)}) /{" "}
                    {formatDate(event.createdAt)}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            No timeline events for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
