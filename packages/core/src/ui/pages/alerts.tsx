import {
  Bell,
  CheckCircle2,
  Loader2,
  type LucideIcon,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AlertContactPointPreset,
  AlertContactPointPublic,
  AlertRule,
  AlertRuntimeStatus,
  AlertSeverity,
  AlertTrigger,
} from "@/core/types";
import {
  useAlertContactPoints,
  useAlertRules,
  useAlertStatus,
  useConfig,
  useCreateAlertContactPoint,
  useCreateAlertRule,
  useDeleteAlertContactPoint,
  useDeleteAlertRule,
  useTestAlertContactPoint,
  useUpdateAlertContactPoint,
  useUpdateAlertRule,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";

const TRIGGERS: { value: AlertTrigger; label: string; description: string }[] =
  [
    {
      value: "job_failed",
      label: "Job failed",
      description: "A job throws an error",
    },
    {
      value: "job_stalled",
      label: "Job stalled",
      description: "A job stops making progress",
    },
    {
      value: "retries_exhausted",
      label: "Retries exhausted",
      description: "A job used all retry attempts",
    },
    {
      value: "failed_backlog",
      label: "Failed backlog",
      description: "Failed job count crosses a threshold",
    },
    {
      value: "no_workers_with_backlog",
      label: "No workers with backlog",
      description: "Waiting jobs but no active workers",
    },
  ];

const SEVERITIES: AlertSeverity[] = ["critical", "warning", "info"];

const DESTINATION_TYPES: {
  value: AlertContactPointPreset;
  label: string;
  description: string;
  urlLabel: string;
  urlPlaceholder: string;
  icon: LucideIcon;
}[] = [
  {
    value: "slack",
    label: "Slack",
    description: "Incoming webhook to a channel",
    urlLabel: "Slack webhook URL",
    urlPlaceholder: "https://hooks.slack.com/services/...",
    icon: Bell,
  },
  {
    value: "discord",
    label: "Discord",
    description: "Webhook to a Discord channel",
    urlLabel: "Discord webhook URL",
    urlPlaceholder: "https://discord.com/api/webhooks/...",
    icon: MessageSquare,
  },
  {
    value: "webhook",
    label: "Webhook",
    description: "Custom HTTPS endpoint (JSON payload)",
    urlLabel: "Webhook URL",
    urlPlaceholder: "https://...",
    icon: Webhook,
  },
];

function destinationType(preset: AlertContactPointPreset) {
  return DESTINATION_TYPES.find((d) => d.value === preset);
}

function destinationTypeLabel(preset: AlertContactPointPreset): string {
  return destinationType(preset)?.label ?? preset;
}

function triggerLabel(trigger: AlertTrigger): string {
  return TRIGGERS.find((t) => t.value === trigger)?.label ?? trigger;
}

function formatCooldown(ms: number | undefined): string {
  const minutes = Math.round((ms ?? 300_000) / 60_000);
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  return `${(minutes / 60).toFixed(1)} hr`;
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const variant =
    severity === "critical"
      ? "destructive"
      : severity === "warning"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{severity}</Badge>;
}

function ContactPointForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AlertContactPointPublic;
  onSubmit: (data: {
    name: string;
    preset: AlertContactPointPreset;
    url: string;
    displayName?: string;
    enabled: boolean;
  }) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [preset, setPreset] = React.useState<AlertContactPointPreset>(
    initial?.preset ?? "slack",
  );
  const [url, setUrl] = React.useState("");
  const [displayName, setDisplayName] = React.useState(
    initial?.displayName ?? "",
  );

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPreset(initial?.preset ?? "slack");
      setUrl("");
      setDisplayName(initial?.displayName ?? "");
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit destination" : "Add destination"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Name</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ops Slack"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <Select
              value={preset}
              onValueChange={(v) => setPreset(v as AlertContactPointPreset)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESTINATION_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {destinationType(preset)?.description}
            </p>
          </div>
          {preset === "slack" && (
            <Alert>
              <AlertTitle>Slack incoming webhook</AlertTitle>
              <AlertDescription className="text-xs space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Open{" "}
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      api.slack.com/apps
                    </a>{" "}
                    and create or select an app
                  </li>
                  <li>
                    Enable <strong>Incoming Webhooks</strong> and add a webhook
                    to your channel
                  </li>
                  <li>
                    Copy the URL (
                    <code className="text-[10px]">
                      https://hooks.slack.com/services/…
                    </code>
                    ) and paste it below
                  </li>
                  <li>
                    Save, then use <strong>Test</strong> to verify delivery
                  </li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
          {preset === "discord" && (
            <Alert>
              <AlertTitle>Discord webhook</AlertTitle>
              <AlertDescription className="text-xs space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Open your server → <strong>Server Settings</strong> →{" "}
                    <strong>Integrations</strong> → <strong>Webhooks</strong>
                  </li>
                  <li>
                    Click <strong>New Webhook</strong>, pick a channel, then{" "}
                    <strong>Copy Webhook URL</strong>
                  </li>
                  <li>
                    Paste the URL (
                    <code className="text-[10px]">
                      https://discord.com/api/webhooks/…
                    </code>
                    ) below
                  </li>
                  <li>
                    Save, then use <strong>Test</strong> to verify delivery
                  </li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {destinationType(preset)?.urlLabel ?? "Webhook URL"}
              {initial ? " (leave blank to keep current)" : ""}
            </p>
            <Input
              type="url"
              placeholder={
                destinationType(preset)?.urlPlaceholder ?? "https://..."
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Sender name{" "}
              <span className="text-muted-foreground/80">(optional)</span>
            </p>
            <Input
              placeholder="Workbench"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shown on Slack and Discord messages when allowed.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name || (!initial && !url)) return;
              onSubmit({
                name,
                preset,
                url,
                displayName: displayName || undefined,
                enabled: initial?.enabled ?? true,
              });
              onOpenChange(false);
            }}
            disabled={!name || (!initial && !url)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleForm({
  open,
  onOpenChange,
  initial,
  contactPoints,
  queues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AlertRule;
  contactPoints: AlertContactPointPublic[];
  queues: string[];
  onSubmit: (data: Omit<AlertRule, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [trigger, setTrigger] = React.useState<AlertTrigger>(
    initial?.trigger ?? "job_failed",
  );
  const [severity, setSeverity] = React.useState<AlertSeverity>(
    initial?.severity ?? "warning",
  );
  const [threshold, setThreshold] = React.useState(
    String(initial?.threshold ?? 1),
  );
  const [cooldownMinutes, setCooldownMinutes] = React.useState(
    String(Math.round((initial?.cooldownMs ?? 300_000) / 60_000)),
  );
  const [contactPointIds, setContactPointIds] = React.useState<string[]>(
    initial?.contactPointIds ?? [],
  );
  const [queueFilter, setQueueFilter] = React.useState(
    initial?.queues?.join(", ") ?? "",
  );

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setTrigger(initial?.trigger ?? "job_failed");
      setSeverity(initial?.severity ?? "warning");
      setThreshold(String(initial?.threshold ?? 1));
      setCooldownMinutes(
        String(Math.round((initial?.cooldownMs ?? 300_000) / 60_000)),
      );
      setContactPointIds(initial?.contactPointIds ?? []);
      setQueueFilter(initial?.queues?.join(", ") ?? "");
    }
  }, [open, initial]);

  const needsThreshold =
    trigger === "failed_backlog" || trigger === "no_workers_with_backlog";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit alert rule" : "New alert rule"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Name</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Failed jobs in production"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">When</p>
              <Select
                value={trigger}
                onValueChange={(v) => setTrigger(v as AlertTrigger)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Severity</p>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as AlertSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {needsThreshold && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Threshold</p>
              <Input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Queues{" "}
              <span className="text-muted-foreground/80">(optional)</span>
            </p>
            <Input
              placeholder="All queues"
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated names. Leave empty to watch every queue.
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Cooldown (minutes)
            </p>
            <Input
              type="number"
              min={0}
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum wait before the same alert can fire again.
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Send to</p>
            <div className="space-y-1.5">
              {contactPoints.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add a destination first, then link it here.
                </p>
              ) : (
                contactPoints.map((cp) => (
                  <label
                    key={cp.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={contactPointIds.includes(cp.id)}
                      onChange={(e) => {
                        setContactPointIds((prev) =>
                          e.target.checked
                            ? [...prev, cp.id]
                            : prev.filter((id) => id !== cp.id),
                        );
                      }}
                    />
                    {cp.name}{" "}
                    <span className="text-muted-foreground">
                      ({destinationTypeLabel(cp.preset)})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name || contactPointIds.length === 0) return;
              const queues = queueFilter
                .split(",")
                .map((q) => q.trim())
                .filter(Boolean);
              onSubmit({
                name,
                enabled: initial?.enabled ?? true,
                trigger,
                severity,
                threshold: needsThreshold ? Number(threshold) : undefined,
                queues: queues.length > 0 ? queues : undefined,
                contactPointIds,
                cooldownMs: Number(cooldownMinutes) * 60_000 || undefined,
              });
              onOpenChange(false);
            }}
            disabled={!name || contactPointIds.length === 0}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetupGuide({
  hasDestinations,
  hasRules,
}: {
  hasDestinations: boolean;
  hasRules: boolean;
}) {
  if (hasDestinations && hasRules) return null;

  const steps = [
    {
      done: hasDestinations,
      label: "Add a destination",
      detail: "Slack, Discord, or webhook URL",
    },
    {
      done: hasRules,
      label: "Create an alert rule",
      detail: "Choose when to notify",
    },
  ];

  return (
    <div className="rounded-md border border-dashed bg-muted/20 px-4 py-3">
      <p className="text-sm font-medium mb-2">Getting started</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                step.done
                  ? "bg-chart-success/15 text-chart-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <span>
              <span className={step.done ? "text-muted-foreground" : ""}>
                {step.label}
              </span>
              {!step.done && (
                <span className="block text-xs text-muted-foreground">
                  {step.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DestinationIcon({ preset }: { preset: AlertContactPointPreset }) {
  const Icon = destinationType(preset)?.icon ?? Webhook;
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
      <Icon className="size-4 text-muted-foreground" />
    </div>
  );
}

function ActivityTab({ status }: { status: AlertRuntimeStatus }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Event listeners
        </h3>
        {status.listeners.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No queues connected yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {status.listeners.map((l) => (
              <div
                key={l.queue}
                className="flex items-center justify-between border bg-card px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">{l.queue}</span>
                {l.connected ? (
                  <Badge variant="outline" className="text-chart-success">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">Disconnected</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Recent alerts
        </h3>
        {status.recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing has fired yet. Alerts appear here when a rule matches.
          </p>
        ) : (
          <div className="space-y-2">
            {status.recentEvents.slice(0, 20).map((ev) => (
              <div key={ev.id} className="border bg-card px-3 py-2 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={ev.severity} />
                  <span className="font-medium">{ev.ruleName}</span>
                  <Badge variant="outline">{ev.status}</Badge>
                </div>
                <p className="text-muted-foreground text-xs">{ev.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Delivery log
        </h3>
        {status.lastDeliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Test messages and alert deliveries will show up here.
          </p>
        ) : (
          <div className="space-y-1">
            {status.lastDeliveries.slice(0, 10).map((d) => (
              <div
                key={`${d.contactPointId}-${d.at}-${d.error ?? "ok"}`}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                {d.success ? (
                  <CheckCircle2 className="size-3.5 text-chart-success" />
                ) : (
                  <XCircle className="size-3.5 text-destructive" />
                )}
                <span>{d.contactPointName}</span>
                {d.error && <span className="text-destructive">{d.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AlertsPage() {
  const { data: config } = useConfig();
  const { data: status, isLoading: statusLoading } = useAlertStatus();
  const { data: contactPoints = [], isLoading: cpLoading } =
    useAlertContactPoints();
  const { data: rules = [], isLoading: rulesLoading } = useAlertRules();
  const createCp = useCreateAlertContactPoint();
  const updateCp = useUpdateAlertContactPoint();
  const deleteCp = useDeleteAlertContactPoint();
  const testCp = useTestAlertContactPoint();
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();

  const [cpDialogOpen, setCpDialogOpen] = React.useState(false);
  const [editCp, setEditCp] = React.useState<AlertContactPointPublic>();
  const [ruleDialogOpen, setRuleDialogOpen] = React.useState(false);
  const [editRule, setEditRule] = React.useState<AlertRule>();

  const readonly = config?.readonly;
  const queues = config?.queues ?? [];

  if (statusLoading || cpLoading || rulesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SetupGuide
        hasDestinations={contactPoints.length > 0}
        hasRules={rules.length > 0}
      />

      <Tabs defaultValue="destinations">
        <TabsList>
          <TabsTrigger value="destinations">
            Destinations
            {contactPoints.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {contactPoints.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">
            Rules
            {rules.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {rules.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="destinations" className="space-y-4 mt-4">
          {!readonly && (
            <Button
              size="sm"
              onClick={() => {
                setEditCp(undefined);
                setCpDialogOpen(true);
              }}
            >
              <Plus className="size-4 mr-1" />
              Add destination
            </Button>
          )}
          {contactPoints.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No destinations yet"
              description="Connect Slack, Discord, or a webhook URL where notifications should be delivered."
              action={
                !readonly ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditCp(undefined);
                      setCpDialogOpen(true);
                    }}
                  >
                    <Plus className="size-4 mr-1" />
                    Add destination
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {contactPoints.map((cp) => (
                <div
                  key={cp.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 border bg-card px-4 py-3"
                >
                  <DestinationIcon preset={cp.preset} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{cp.name}</span>
                      <Badge variant="outline">
                        {destinationTypeLabel(cp.preset)}
                      </Badge>
                      {!cp.enabled && <Badge variant="secondary">Paused</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {cp.urlMasked}
                      {cp.displayName ? ` · sends as ${cp.displayName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                    {!readonly && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={testCp.isPending}
                          onClick={async () => {
                            try {
                              const r = await testCp.mutateAsync(cp.id);
                              if (r.success) {
                                toast.success(
                                  `Test message sent to ${cp.name}`,
                                );
                              } else {
                                toast.error(r.error ?? "Test message failed");
                              }
                            } catch (e) {
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : "Test message failed",
                              );
                            }
                          }}
                        >
                          {testCp.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                          <span className="ml-1.5">Send test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditCp(cp);
                            setCpDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete destination?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Rules linked to {cp.name} will stop sending
                                there.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCp.mutate(cp.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          {!readonly && (
            <Button
              size="sm"
              onClick={() => {
                setEditRule(undefined);
                setRuleDialogOpen(true);
              }}
              disabled={contactPoints.length === 0}
            >
              <Plus className="size-4 mr-1" />
              Add rule
            </Button>
          )}
          {contactPoints.length === 0 && !readonly && (
            <p className="text-xs text-muted-foreground">
              Add a destination before creating rules.
            </p>
          )}
          {rules.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alert rules yet"
              description="Rules watch your queues and send to destinations when something goes wrong."
              action={
                !readonly && contactPoints.length > 0 ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditRule(undefined);
                      setRuleDialogOpen(true);
                    }}
                  >
                    <Plus className="size-4 mr-1" />
                    Add rule
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{rule.name}</span>
                      <SeverityBadge severity={rule.severity} />
                      <Badge variant="outline">
                        {triggerLabel(rule.trigger)}
                      </Badge>
                      {!rule.enabled && (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rule.queues?.length
                        ? `Queues: ${rule.queues.join(", ")}`
                        : "All queues"}
                      {rule.threshold !== undefined
                        ? ` · threshold ${rule.threshold}`
                        : ""}
                      {rule.cooldownMs !== undefined
                        ? ` · cooldown ${formatCooldown(rule.cooldownMs)}`
                        : ""}
                    </p>
                  </div>
                  {!readonly && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateRule.mutate({
                            id: rule.id,
                            enabled: !rule.enabled,
                          })
                        }
                      >
                        {rule.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditRule(rule);
                          setRuleDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRule.mutate(rule.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {status ? (
            <ActivityTab status={status} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to load status.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <ContactPointForm
        open={cpDialogOpen}
        onOpenChange={setCpDialogOpen}
        initial={editCp}
        onSubmit={(data) => {
          if (editCp) {
            updateCp.mutate({
              id: editCp.id,
              name: data.name,
              preset: data.preset,
              displayName: data.displayName,
              enabled: data.enabled,
              ...(data.url ? { url: data.url } : {}),
            });
          } else {
            createCp.mutate(data);
          }
        }}
      />

      <RuleForm
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        initial={editRule}
        contactPoints={contactPoints}
        queues={queues}
        onSubmit={(data) => {
          if (editRule) {
            updateRule.mutate({ id: editRule.id, ...data });
          } else {
            createRule.mutate(data);
          }
        }}
      />
    </div>
  );
}
