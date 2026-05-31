import React from 'react';
import prisma from '@/lib/prisma';
import { Monitor, PingLog } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LatencyChart from '@/components/LatencyChart';
import AddMonitorDialog from '@/components/AddMonitorDialog';
import RefreshButton from '@/components/RefreshButton';
import TerminalPing from '@/components/TerminalPing';
import { deleteMonitor } from '@/app/actions';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Globe, 
  Trash2, 
  Clock 
} from 'lucide-react';

type MonitorWithLogs = Monitor & {
  pingLogs: PingLog[];
};

// Force dynamic rendering to always query fresh data from the database
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. Ambil semua data Monitor beserta 20 log terakhirnya
  const monitors = await prisma.monitor.findMany({
    include: {
      pingLogs: {
        orderBy: {
          checkedAt: 'desc',
        },
        take: 20,
      },
    },
  });

  // Calculate statistics
  const totalMonitors = monitors.length;
  const serversUp = monitors.filter((m: Monitor) => m.status === 'UP').length;
  const serversDown = monitors.filter((m: Monitor) => m.status === 'DOWN').length;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50 pb-16 font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">IT Monitor</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Uptime & Latency Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshButton />
            <AddMonitorDialog />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* 2. Statistik Singkat */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card Total Monitor */}
          <Card className="shadow-sm border-border hover:shadow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Monitors
              </CardTitle>
              <Server className="h-4.5 w-4.5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight">{totalMonitors}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured service checks</p>
            </CardContent>
          </Card>

          {/* Card Server UP */}
          <Card className="shadow-sm border-border hover:shadow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Servers Up
              </CardTitle>
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">
                {serversUp}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Operational services</p>
            </CardContent>
          </Card>

          {/* Card Server DOWN */}
          <Card className="shadow-sm border-border hover:shadow transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Servers Down
              </CardTitle>
              <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-destructive">
                {serversDown}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active failure incidents</p>
            </CardContent>
          </Card>
        </section>

        {/* 3. Grid List Monitors */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Active Monitors</h2>
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full border border-border/40">
              Auto-refreshing
            </span>
          </div>

          {monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-dashed border-border rounded-2xl min-h-[300px] shadow-sm">
              <Server className="h-10 w-10 text-muted-foreground/60 mb-4 stroke-[1.5]" />
              <h3 className="text-base font-bold text-foreground mb-1">No Monitors Registered</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Get started by adding your first URL to monitor its uptime and response speed.
              </p>
              <AddMonitorDialog />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {monitors.map((monitor: MonitorWithLogs) => {
                const lastLog = monitor.pingLogs[0];
                const lastChecked = lastLog 
                  ? new Date(lastLog.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                  : 'Never';

                return (
                  <Card key={monitor.id} className="rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-950/60 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden">
                    <div>
                      {/* Card Header area */}
                      <div className="p-6 border-b border-border/40 flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base tracking-tight truncate">
                              {monitor.name}
                            </h3>
                            <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                              <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                  monitor.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                  monitor.status === 'UP' 
                                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                                    : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                                }`}></span>
                              </span>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${
                                monitor.status === 'UP' 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {monitor.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <a 
                              href={monitor.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="hover:underline truncate select-all"
                            >
                              {monitor.url}
                            </a>
                          </div>
                          {monitor.sslDaysRemaining !== null && monitor.sslDaysRemaining !== undefined ? (
                            <div className="flex items-center gap-1.5 text-xs mt-1">
                              <span className="font-medium text-muted-foreground/80">SSL:</span>
                              <span className={
                                monitor.sslDaysRemaining < 7 
                                  ? 'text-rose-600 dark:text-rose-400 font-bold' 
                                  : monitor.sslDaysRemaining < 30 
                                    ? 'text-amber-600 dark:text-amber-500 font-semibold' 
                                    : 'text-zinc-500 dark:text-zinc-400 font-medium'
                              }>
                                {monitor.sslDaysRemaining} hari lagi
                              </span>
                            </div>
                          ) : (
                            monitor.url.startsWith('https://') && (
                              <div className="flex items-center gap-1.5 text-xs mt-1 text-muted-foreground/50">
                                <span>SSL: Checking...</span>
                              </div>
                            )
                          )}
                        </div>

                        {/* Delete Action Button */}
                        <form 
                          action={async () => {
                            'use server';
                            await deleteMonitor(monitor.id);
                          }}
                          className="shrink-0"
                        >
                          <Button 
                            type="submit" 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </form>
                      </div>

                      {/* Line Chart Component */}
                      <div className="p-6 bg-muted/20">
                        <LatencyChart logs={monitor.pingLogs} />
                      </div>
                    </div>

                    {/* Card Footer area */}
                    <div className="px-6 py-3.5 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last Checked: <strong className="font-semibold text-foreground">{lastChecked}</strong></span>
                      </div>
                      {lastLog && (
                        <div>
                          Status Code: <strong className="font-semibold text-foreground">{lastLog.statusCode ?? 'N/A'}</strong>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Diagnostic Tools Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Diagnostic Tools</h2>
          <TerminalPing />
        </section>
      </main>
    </div>
  );
}
