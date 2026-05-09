"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateDeliveryAction } from "@/app/actions/delivery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryQueueItem } from "@/lib/data/delivery";

const tabs = ["ready_for_delivery", "assigned_to_delivery", "out_for_delivery", "delivered", "failed_delivery"] as const;

function tone(status: string) {
  if (status === "delivered") return "green" as const;
  if (status === "failed_delivery") return "red" as const;
  if (status === "out_for_delivery") return "blue" as const;
  return "amber" as const;
}

export function DeliveryDashboard({
  items,
  deliveryPeople,
}: {
  items: DeliveryQueueItem[];
  deliveryPeople: Array<{ id: string; name: string }>;
}) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("ready_for_delivery");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const filtered = items.filter((item) => item.status === activeTab);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateDeliveryAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Delivery</p>
        <h1 className="text-2xl font-semibold">Delivery queue</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} type="button" variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
            {tab.replaceAll("_", " ")} ({items.filter((item) => item.status === tab).length})
          </Button>
        ))}
      </div>
      {message ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">{message}</p> : null}
      <Card>
        <CardHeader><CardTitle>{activeTab.replaceAll("_", " ")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg border bg-background p-4 text-sm xl:grid-cols-[1fr_460px]">
              <div>
                <Link href={`/cases/${item.caseId}`} className="text-base font-semibold hover:underline">{item.caseNumber}</Link>
                <p className="text-muted-foreground">{item.doctorName} / {item.clinicName} / {item.patientName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={tone(item.status)}>{item.status.replaceAll("_", " ")}</Badge>
                  <Badge tone="neutral">{item.deliveryPersonName ?? "Unassigned"}</Badge>
                  {item.recipientName ? <Badge tone="green">Recipient {item.recipientName}</Badge> : null}
                </div>
              </div>
              <form action={submit} className="grid gap-2 md:grid-cols-2">
                <input type="hidden" name="caseId" value={item.caseId} />
                <Select name="deliveryPersonId" defaultValue="">
                  <option value="">Delivery person</option>
                  {deliveryPeople.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </Select>
                <Input name="scheduledAt" type="datetime-local" />
                <Input name="recipientName" placeholder="Recipient name" />
                <Input name="proofFileId" placeholder="Proof file UUID" />
                <Textarea name="failureReason" placeholder="Failure reason" className="md:col-span-2" />
                <Textarea name="notes" placeholder="Delivery notes" className="md:col-span-2" />
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <Button name="deliveryAction" value="assign" size="sm" disabled={isPending}>Assign</Button>
                  <Button name="deliveryAction" value="out" size="sm" variant="outline" disabled={isPending}>Out</Button>
                  <Button name="deliveryAction" value="delivered" size="sm" variant="outline" disabled={isPending}>Delivered</Button>
                  <Button name="deliveryAction" value="failed" size="sm" variant="destructive" disabled={isPending}>Failed</Button>
                </div>
              </form>
            </div>
          ))}
          {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No deliveries in this tab.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
