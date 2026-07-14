import { Activity } from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ChartContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart";
import type { HourlyBucket } from "@/core/types";
import { cn } from "@/lib/utils";

const throughputChartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-completed))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-failed))",
  },
};

function formatHourShort(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
  });
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: number;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !label) return null;

  return (
    <div className="border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs font-medium mb-1.5">
        {new Date(label).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ThroughputChartProps {
  buckets: HourlyBucket[];
  className?: string;
  heightClass?: string;
}

export function ThroughputChart({
  buckets,
  className,
  heightClass = "h-40",
}: ThroughputChartProps) {
  const chartId = React.useId().replace(/:/g, "");
  const throughputData = buckets.map((b) => ({
    hour: b.hour,
    completed: b.completed,
    failed: b.failed,
  }));

  return (
    <div className={cn("border border-dashed bg-card p-4", className)}>
      <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        Fleet throughput (24h)
      </h3>
      <ChartContainer
        config={throughputChartConfig}
        className={cn("w-full", heightClass)}
      >
        <AreaChart data={throughputData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHourShort}
            tick={{
              fontSize: 11,
              fill: "hsl(var(--muted-foreground))",
            }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: "hsl(var(--muted-foreground))",
            }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
            )}
          />
          <defs>
            <linearGradient
              id={`${chartId}-completedGradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-completed)"
                stopOpacity={0.5}
              />
              <stop
                offset="100%"
                stopColor="var(--color-completed)"
                stopOpacity={0.05}
              />
            </linearGradient>
            <pattern
              id={`${chartId}-failedPattern`}
              x="0"
              y="0"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="6"
                height="6"
                fill="var(--color-failed)"
                fillOpacity={0.15}
              />
              <path
                d="M0,0 L6,6 M-1,5 L5,11 M-1,-1 L7,7"
                stroke="var(--color-failed)"
                strokeWidth="1"
                opacity="0.4"
              />
            </pattern>
          </defs>
          {/* Failed renders first so it stacks at the bottom: with zero
              failures its stroke is a flat line on the axis instead of
              tracing the top of the completed area in red (#30). */}
          <Area
            type="monotone"
            dataKey="failed"
            name="Failed"
            stackId="1"
            stroke="var(--color-failed)"
            fill={`url(#${chartId}-failedPattern)`}
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stackId="1"
            stroke="var(--color-completed)"
            fill={`url(#${chartId}-completedGradient)`}
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
