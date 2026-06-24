import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseFileManager } from "@/components/files/case-file-manager";
import { DesignWorkflow } from "@/components/design/design-workflow";
import type { CaseDetail as CaseDetailData } from "@/lib/data/cases";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CaseDetail({
  item,
  canViewFinance,
}: {
  item: CaseDetailData;
  canViewFinance: boolean;
}) {
  const waitingInfo = item.status === "waiting_doctor_info";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {item.doctorName} / {item.clinicName}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            {item.caseNumber} - {item.patientName}
          </h2>
          <div className="mt-3 flex gap-2">
            <Badge tone={waitingInfo ? "amber" : "green"}>
              {item.status.replaceAll("_", " ")}
            </Badge>
            <Badge tone={item.isUrgent ? "red" : "neutral"}>
              Priority {item.priorityScore}
            </Badge>
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Due: {item.dueDate ?? "Not set"}
        </p>
      </div>

      {waitingInfo ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">
          This case is waiting for doctor information.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Case info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-3">
              <p><span className="text-muted-foreground">Work:</span> {item.workType}</p>
              <p><span className="text-muted-foreground">Material:</span> {item.material ?? "Not set"}</p>
              <p><span className="text-muted-foreground">Shade:</span> {item.shade ?? "Not set"}</p>
              <p><span className="text-muted-foreground">Units:</span> {item.unitsCount}</p>
              <p><span className="text-muted-foreground">Teeth:</span> {item.toothNumbers.join(", ") || "Not set"}</p>
              <p><span className="text-muted-foreground">Stage:</span> {item.currentStage.replaceAll("_", " ")}</p>
              <p><span className="text-muted-foreground">Remake:</span> {item.isRemake ? "Yes" : "No"}</p>
              <p><span className="text-muted-foreground">Warranty:</span> {item.isWarranty ? "Yes" : "No"}</p>
              <p><span className="text-muted-foreground">Doctor approval:</span> {item.requiresDoctorApproval ? "Required" : "Not required"}</p>
              <div className="md:col-span-3">
                <p className="text-muted-foreground">Notes</p>
                <p className="mt-1 leading-6">{item.notes ?? "No notes yet."}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.timeline.map((event) => (
                <div key={event.id} className="rounded-lg border bg-background p-3">
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.createdAt}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.stageHistory.map((stage) => (
                <div key={stage.id} className="rounded-lg border bg-background p-3 text-sm">
                  <p className="font-semibold">
	                    {stage.fromStage?.replaceAll("_", " ") ?? "Start"} -{" "}
	                    {stage.toStage.replaceAll("_", " ")}
                  </p>
                  <p className="text-muted-foreground">{stage.notes ?? stage.createdAt}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Missing information</CardTitle>
            </CardHeader>
            <CardContent>
              {item.missingInfoFields.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {item.missingInfoFields.map((field) => (
                    <li key={field} className="rounded-md bg-amber-50 px-3 py-2 text-amber-950">
                      {field.replaceAll("_", " ")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Required information is complete.</p>
              )}
            </CardContent>
          </Card>

	          <Card>
	            <CardHeader><CardTitle>Files</CardTitle></CardHeader>
	            <CardContent>
	              <CaseFileManager
	                labId={item.labId}
	                caseId={item.id}
	                files={item.files}
	                allowedUploadCategories={item.allowedUploadCategories}
	                allowedUploadVisibilities={item.allowedUploadVisibilities}
	              />
	            </CardContent>
	          </Card>

	          <Card>
	            <CardHeader><CardTitle>Design versions</CardTitle></CardHeader>
	            <CardContent>
	              <DesignWorkflow
	                labId={item.labId}
	                caseId={item.id}
	                versions={item.designVersions}
	                canUpload={item.canUploadDesignVersion}
	                canDecide={item.canDecideDesignVersion}
	                canComment={item.canCommentDesignVersion}
	              />
	            </CardContent>
	          </Card>

          <Card>
            <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Case comments placeholder for Phase 9.
            </CardContent>
          </Card>

          {canViewFinance ? (
            <Card>
              <CardHeader><CardTitle>Finance summary</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {money(item.totalPrice)}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
