import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { StatusPill } from "@/components/status-pill";
import type { IncidentResponseRecord } from "@/lib/incidents";

function toneForResponse(status: IncidentResponseRecord["response_status"]) {
  switch (status) {
    case "attending":
      return "green" as const;
    case "delayed":
      return "amber" as const;
    case "fallback_available":
      return "blue" as const;
    case "not_attending":
      return "red" as const;
    default:
      return "grey" as const;
  }
}

const responseGroups: ReadonlyArray<{
  title: string;
  statuses: IncidentResponseRecord["response_status"][];
}> = [
  { title: "Attending", statuses: ["attending"] },
  { title: "Delayed", statuses: ["delayed"] },
  { title: "Fallback", statuses: ["fallback_available"] },
  { title: "Not attending", statuses: ["not_attending"] },
  { title: "Awaiting response", statuses: ["awaiting_response"] },
];

function getResponderLabel(response: IncidentResponseRecord) {
  const responder = response.responder && !Array.isArray(response.responder) ? response.responder : null;
  return responder?.display_name ?? responder?.email ?? response.profile_id;
}

function formatEta(value: number | null) {
  return value === null ? null : `${value} min ETA`;
}

export function IncidentResponseGroups({
  responses,
}: Readonly<{
  responses: IncidentResponseRecord[];
}>) {
  return (
    <div className="space-y-4">
      {responseGroups.map((group) => {
        const groupResponses = responses.filter((response) => group.statuses.includes(response.response_status));

        return (
          <div key={group.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{group.title}</p>
              <StatusPill tone="grey">{groupResponses.length}</StatusPill>
            </div>
            {groupResponses.length ? (
              <div className="mt-3 space-y-3">
                {groupResponses.map((response) => (
                  <div key={response.id} className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-card-foreground">{getResponderLabel(response)}</p>
                        <p className="text-xs text-muted-foreground">
                          {response.response_status.replace(/_/g, " ")}
                          {formatEta(response.eta_minutes) ? ` · ${formatEta(response.eta_minutes)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone={toneForResponse(response.response_status)}>
                          {response.response_status.replace(/_/g, " ")}
                        </StatusPill>
                        {response.hasCasualtyCare ? <StatusPill tone="blue">Casualty care</StatusPill> : null}
                      </div>
                    </div>
                    <div className="mt-3">
                      <CrewCapabilityBadges
                        items={response.capabilityBadges}
                        emptyLabel="No capability badges"
                      />
                    </div>
                    {response.notes ? (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{response.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No {group.title.toLowerCase()} responses.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
