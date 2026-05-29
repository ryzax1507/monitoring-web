'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PingLog {
  id?: string;
  latency: number;
  checkedAt: string | Date;
  isUp?: boolean;
}

interface LatencyChartProps {
  logs: PingLog[];
}

export default function LatencyChart({ logs }: LatencyChartProps) {
  // Sort logs by checkedAt ascending to display chronologically
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime();
  });

  const formatXAxis = (tickItem: string | Date) => {
    try {
      const date = new Date(tickItem);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PingLog;
      const date = new Date(data.checkedAt);
      const formattedDate = date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
      return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-xl backdrop-blur-md text-card-foreground">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {formattedDate}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${data.isUp !== false ? 'bg-emerald-500' : 'bg-destructive'}`} />
            <p className="text-sm font-semibold">
              {data.latency} <span className="text-xs font-normal text-muted-foreground">ms</span>
            </p>
          </div>
          {data.isUp === false && (
            <p className="text-[10px] text-destructive font-medium mt-1">
              Offline / Timeout
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!sortedLogs || sortedLogs.length === 0) {
    return (
      <Card className="w-full border-dashed flex items-center justify-center p-8 min-h-[300px] bg-card">
        <CardDescription className="text-center">
          No latency logs available yet.
        </CardDescription>
      </Card>
    );
  }

  // Calculate average latency
  const avgLatency = Math.round(
    sortedLogs.reduce((sum, log) => sum + log.latency, 0) / sortedLogs.length
  );
  
  // Calculate max latency
  const maxLatency = Math.max(...sortedLogs.map((log) => log.latency));

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-all duration-300 border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold tracking-tight">Latency History</CardTitle>
          <CardDescription>Realtime performance metrics over time</CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
            <span className="text-muted-foreground">Avg:</span>
            <span className="text-primary font-bold">{avgLatency} ms</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
            <span className="text-muted-foreground">Max:</span>
            <span className="text-primary font-bold">{maxLatency} ms</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sortedLogs}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
              <XAxis
                dataKey="checkedAt"
                tickFormatter={formatXAxis}
                className="text-[10px] fill-muted-foreground font-medium"
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                className="text-[10px] fill-muted-foreground font-medium"
                axisLine={false}
                tickLine={false}
                dx={-5}
                unit="ms"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, className: "fill-primary" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
