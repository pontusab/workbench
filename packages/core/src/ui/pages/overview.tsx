import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SummaryCard } from "@/components/metrics/summary-card";
import { ThroughputChart } from "@/components/metrics/throughput-chart";
import { AttentionAlerts } from "@/components/overview/attention-alerts";
import {
  metricsBucketsToSparkline,
  QueueHealthCard,
} from "@/components/overview/queue-health-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics, useOverview } from "@/lib/hooks";

interface OverviewPageProps {
  onQueueSelect: (queue: string) => void;
  onViewFailed: (queue: string) => void;
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i.toString()} className="border border-dashed bg-card p-4">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="border border-dashed bg-card p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i.toString()} className="border bg-card p-4">
            <Skeleton className="h-5 w-28 mb-3" />
            <Skeleton className="h-7 w-full mb-3" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((__, j) => (
                <Skeleton key={j.toString()} className="h-10" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverviewPage({
  onQueueSelect,
  onViewFailed,
}: OverviewPageProps) {
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useOverview();
  const { data: metrics, isLoading: metricsLoading } = useMetrics();

  if (overviewLoading && !overview) {
    return <OverviewSkeleton />;
  }

  if (overviewError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load overview"
        description={overviewError.message}
      />
    );
  }

  if (!overview) return null;

  if (overview.queues.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No queues discovered"
        description="Connect Workbench to a Redis instance with BullMQ queues, or pass Queue instances when mounting the dashboard."
        action={
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://getworkbench.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the docs
            </a>
          </Button>
        }
      />
    );
  }

  const metricsByQueue = new Map(
    metrics?.queues.map((q) => [q.queueName, q]) ?? [],
  );

  const aggregate = metrics?.aggregate;
  const buckets = aggregate?.buckets ?? [];
  const summary = aggregate?.summary;

  const midpoint = Math.floor(buckets.length / 2);
  const firstHalf = buckets.slice(0, midpoint);
  const secondHalf = buckets.slice(midpoint);
  const firstHalfCompleted = firstHalf.reduce((sum, b) => sum + b.completed, 0);
  const secondHalfCompleted = secondHalf.reduce(
    (sum, b) => sum + b.completed,
    0,
  );
  const firstHalfFailed = firstHalf.reduce((sum, b) => sum + b.failed, 0);
  const secondHalfFailed = secondHalf.reduce((sum, b) => sum + b.failed, 0);
  const throughputSparkline = buckets.map((b) => b.completed + b.failed);
  const errorSparkline = buckets.map((b) =>
    b.completed + b.failed > 0 ? b.failed / (b.completed + b.failed) : 0,
  );
  const hasRecentActivity =
    metricsLoading ||
    (summary?.totalCompleted ?? 0) > 0 ||
    (summary?.totalFailed ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading || !summary ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i.toString()}
              className="border border-dashed bg-card p-4"
            >
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard
              title="Throughput"
              value={summary.throughputPerHour.toLocaleString()}
              subtitle="jobs/hour avg"
              sparklineData={throughputSparkline}
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{
                current: secondHalfCompleted + secondHalfFailed,
                previous: firstHalfCompleted + firstHalfFailed,
                higherIsBetter: true,
              }}
            />
            <SummaryCard
              title="Error rate"
              value={formatPercentage(summary.errorRate)}
              subtitle={`${summary.totalFailed} failed (24h)`}
              sparklineData={errorSparkline}
              sparklineColor={summary.errorRate > 0.1 ? "danger" : "success"}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={{
                current: secondHalfFailed,
                previous: firstHalfFailed,
                higherIsBetter: false,
              }}
            />
            <SummaryCard
              title="Active now"
              value={overview.activeJobs.toLocaleString()}
              subtitle="processing"
              icon={<Zap className="h-4 w-4" />}
            />
            <SummaryCard
              title="Failed in queues"
              value={overview.failedJobs.toLocaleString()}
              subtitle="need review"
              sparklineColor="danger"
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {metricsLoading || buckets.length === 0 ? (
        <div className="border border-dashed bg-card p-4">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <ThroughputChart buckets={buckets} />
      )}

      <AttentionAlerts
        queues={overview.queues}
        onQueueSelect={onQueueSelect}
        onViewFailed={onViewFailed}
      />

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Queues
          </h3>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            asChild
          >
            <Link to="/metrics">View full metrics →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview.queues.map((queue) => {
            const queueMetrics = metricsByQueue.get(queue.name);
            const sparkline = queueMetrics
              ? metricsBucketsToSparkline(queueMetrics.buckets)
              : undefined;

            return (
              <QueueHealthCard
                key={queue.name}
                queue={queue}
                sparklineData={sparkline}
                onSelect={() => onQueueSelect(queue.name)}
                onFailedClick={() => onViewFailed(queue.name)}
              />
            );
          })}
        </div>
      </div>

      {overview.activeJobs === 0 &&
        overview.failedJobs === 0 &&
        overview.totalJobs === 0 &&
        !hasRecentActivity && (
          <div className="flex items-center gap-2 border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-chart-success shrink-0" />
            All queues are empty — enqueue a test job from the Test page to see
            activity here.
          </div>
        )}
    </div>
  );
}
